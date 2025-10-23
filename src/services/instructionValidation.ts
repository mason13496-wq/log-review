import type { InstructionStatus } from '@/types/instruction'
import {
  type InstructionCategory,
  type InstructionLogEntry,
  type InstructionValidationCategorySummary,
  type InstructionValidationIssue,
  type InstructionValidationReport,
  type InstructionValidationResult,
} from '@/types/instruction'

const toTimestamp = (iso: string): number => new Date(iso).getTime()

const titleCase = (value: string): string =>
  value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ')

const formatStatus = (status: InstructionStatus): string => titleCase(status)

const formatStatusList = (statuses: InstructionStatus[]): string =>
  statuses.map((status) => formatStatus(status)).join(' or ')

type PairingRule = {
  startActions: string[]
  endActions: string[]
  description: string
}

type SequenceRule = {
  startStatuses: InstructionStatus[]
  endStatuses: InstructionStatus[]
  statusOrder: InstructionStatus[]
}

type CategoryValidationRule = {
  sequence: SequenceRule
  minSteps: number
  requireOwnerNotes?: boolean
  requireOwnerNotesForStatuses?: InstructionStatus[]
  pairingRules: PairingRule[]
}

const CATEGORY_VALIDATION_RULES: Record<InstructionCategory, CategoryValidationRule> = {
  quality: {
    sequence: {
      startStatuses: ['pending', 'in_review'],
      endStatuses: ['approved', 'rejected'],
      statusOrder: ['pending', 'in_review', 'approved'],
    },
    minSteps: 2,
    requireOwnerNotesForStatuses: ['rejected'],
    pairingRules: [
      {
        startActions: ['TRAINING_SESSION'],
        endActions: ['TRAINING_COMPLETION'],
        description: 'Training sessions should conclude with a completion record',
      },
      {
        startActions: ['QA_INSPECTION', 'QUALITY_CHECK'],
        endActions: ['QA_DEVIATION_REVIEW', 'QUALITY_IMPROVEMENT'],
        description: 'Quality checks should be followed by a review or improvement action',
      },
    ],
  },
  compliance: {
    sequence: {
      startStatuses: ['pending', 'in_review'],
      endStatuses: ['approved', 'rejected'],
      statusOrder: ['pending', 'in_review', 'approved'],
    },
    minSteps: 3,
    requireOwnerNotes: true,
    pairingRules: [
      {
        startActions: ['COMPLIANCE_AUDIT'],
        endActions: ['AUDIT_RESPONSE'],
        description: 'Compliance audits must capture a corresponding response entry',
      },
      {
        startActions: ['POLICY_UPDATE', 'SOP_UPDATE'],
        endActions: ['COMPLIANCE_REVIEW', 'SOP_REVIEW'],
        description: 'Policy and SOP updates should be reviewed for compliance',
      },
    ],
  },
  safety: {
    sequence: {
      startStatuses: ['pending', 'in_review'],
      endStatuses: ['approved', 'rejected'],
      statusOrder: ['pending', 'in_review', 'approved'],
    },
    minSteps: 2,
    requireOwnerNotes: true,
    pairingRules: [
      {
        startActions: ['SAFETY_DRILL', 'SAFETY_INSPECTION'],
        endActions: ['SAFETY_ALERT', 'INCIDENT_REVIEW', 'INCIDENT_REPORT'],
        description: 'Safety activities should log the resulting alert or incident review',
      },
      {
        startActions: ['RISK_ASSESSMENT'],
        endActions: ['SAFETY_ALERT', 'INCIDENT_REVIEW', 'INCIDENT_REPORT'],
        description: 'Risk assessments should link to the follow-up safety communication',
      },
    ],
  },
  efficiency: {
    sequence: {
      startStatuses: ['pending', 'in_review'],
      endStatuses: ['approved', 'rejected'],
      statusOrder: ['pending', 'in_review', 'approved'],
    },
    minSteps: 1,
    requireOwnerNotesForStatuses: ['rejected'],
    pairingRules: [
      {
        startActions: ['MAINTENANCE_SCHEDULE'],
        endActions: ['MAINTENANCE_CHECK'],
        description: 'Maintenance schedules require a matching maintenance check entry',
      },
      {
        startActions: ['WORKFLOW_OPTIMIZATION', 'WORKFLOW_UPDATE', 'PROCESS_UPDATE'],
        endActions: ['PROCESS_IMPROVEMENT', 'EFFICIENCY_REVIEW'],
        description: 'Workflow changes should be assessed with a follow-up review',
      },
    ],
  },
}

const ensureResult = (
  resultMap: Map<string, InstructionValidationResult>,
  entry: InstructionLogEntry,
): InstructionValidationResult => {
  const existing = resultMap.get(entry.id)

  if (existing) {
    return existing
  }

  const result: InstructionValidationResult = {
    instructionId: entry.id,
    actionCode: entry.action.code,
    title: entry.title,
    category: entry.category,
    issues: [],
    errorCount: 0,
    warningCount: 0,
  }

  resultMap.set(entry.id, result)

  return result
}

const pushIssue = (
  resultMap: Map<string, InstructionValidationResult>,
  entry: InstructionLogEntry,
  issue: Omit<InstructionValidationIssue, 'instructionId' | 'actionCode' | 'category'>,
) => {
  const result = ensureResult(resultMap, entry)

  const fullIssue: InstructionValidationIssue = {
    instructionId: result.instructionId,
    actionCode: result.actionCode,
    category: result.category,
    ...issue,
  }

  result.issues.push(fullIssue)

  if (issue.severity === 'error') {
    result.errorCount += 1
  } else {
    result.warningCount += 1
  }
}

const validateSequenceForGroup = (
  resultMap: Map<string, InstructionValidationResult>,
  groupEntries: InstructionLogEntry[],
  rule: CategoryValidationRule,
) => {
  if (groupEntries.length === 0) {
    return
  }

  const sortedEntries = [...groupEntries].sort(
    (a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt),
  )

  const statuses = sortedEntries.map((entry) => entry.status)
  const firstEntry = sortedEntries[0]
  const lastEntry = sortedEntries[sortedEntries.length - 1]

  const hasStartStatus = statuses.some((status) => rule.sequence.startStatuses.includes(status))
  const hasEndStatus = statuses.some((status) => rule.sequence.endStatuses.includes(status))

  if (!hasStartStatus) {
    pushIssue(resultMap, firstEntry, {
      severity: 'error',
      code: 'missing_sequence_start',
      message: `Sequence is missing a recognised start status (${formatStatusList(rule.sequence.startStatuses)}).`,
    })
  } else if (!rule.sequence.startStatuses.includes(firstEntry.status)) {
    pushIssue(resultMap, firstEntry, {
      severity: 'warning',
      code: 'missing_sequence_start',
      message: `Sequence begins with ${formatStatus(firstEntry.status)}, expected ${formatStatusList(rule.sequence.startStatuses)}.`,
    })
  }

  if (!hasEndStatus) {
    pushIssue(resultMap, lastEntry, {
      severity: 'warning',
      code: 'missing_sequence_end',
      message: `Sequence does not include an end status (${formatStatusList(rule.sequence.endStatuses)}).`,
    })
  } else if (!rule.sequence.endStatuses.includes(lastEntry.status)) {
    pushIssue(resultMap, lastEntry, {
      severity: 'warning',
      code: 'missing_sequence_end',
      message: `Sequence ends with ${formatStatus(lastEntry.status)}, expected ${formatStatusList(rule.sequence.endStatuses)}.`,
    })
  }

  for (let index = 1; index < sortedEntries.length; index += 1) {
    const previous = sortedEntries[index - 1]
    const current = sortedEntries[index]
    const previousTimestamp = toTimestamp(previous.createdAt)
    const currentTimestamp = toTimestamp(current.createdAt)

    if (currentTimestamp < previousTimestamp) {
      pushIssue(resultMap, current, {
        severity: 'error',
        code: 'time_order_violation',
        message: `Entry timestamp ${current.createdAt} occurs before the previous event (${previous.createdAt}).`,
      })
    } else if (currentTimestamp === previousTimestamp) {
      pushIssue(resultMap, current, {
        severity: 'warning',
        code: 'time_order_violation',
        message: `Entry timestamp ${current.createdAt} matches a previous event and may be out of order.`,
      })
    }
  }

  const statusOrderIndex = new Map<InstructionStatus, number>(
    rule.sequence.statusOrder.map((status, index) => [status, index] as const),
  )

  let highestIndex = -1

  sortedEntries.forEach((entry, index) => {
    if (entry.status === 'rejected') {
      highestIndex = Number.MAX_SAFE_INTEGER
      return
    }

    const orderIndex = statusOrderIndex.get(entry.status)

    if (orderIndex === undefined) {
      return
    }

    if (orderIndex < highestIndex) {
      const previousStatus = index > 0 ? sortedEntries[index - 1].status : entry.status
      pushIssue(resultMap, entry, {
        severity: 'warning',
        code: 'status_regression',
        message: `Status regressed from ${formatStatus(previousStatus)} to ${formatStatus(entry.status)}.`,
      })
      return
    }

    highestIndex = orderIndex
  })

  sortedEntries.forEach((entry) => {
    const stepCount = entry.payload.steps.filter((step) => step.trim().length > 0).length

    if (stepCount < rule.minSteps) {
      pushIssue(resultMap, entry, {
        severity: 'warning',
        code: 'insufficient_steps',
        message: `Instruction payload includes ${stepCount} step${stepCount === 1 ? '' : 's'} but ${rule.minSteps} ${
          rule.minSteps === 1 ? 'step is' : 'steps are'
        } recommended for ${entry.category} instructions.`,
      })
    }

    const ownerNotes = entry.payload.ownerNotes?.trim() ?? ''

    if (rule.requireOwnerNotes && ownerNotes.length === 0) {
      pushIssue(resultMap, entry, {
        severity: 'error',
        code: 'missing_required_field',
        message: 'Owner notes are required for this instruction category.',
      })
    }

    if (
      rule.requireOwnerNotesForStatuses?.includes(entry.status) &&
      ownerNotes.length === 0
    ) {
      pushIssue(resultMap, entry, {
        severity: 'warning',
        code: 'missing_required_field',
        message: `Owner notes should be provided when an instruction is ${formatStatus(entry.status)}.`,
      })
    }
  })
}

const validatePairings = (
  resultMap: Map<string, InstructionValidationResult>,
  categoryEntries: InstructionLogEntry[],
  rule: CategoryValidationRule,
) => {
  if (categoryEntries.length === 0) {
    return
  }

  rule.pairingRules.forEach((pairing) => {
    const startEntries = categoryEntries.filter((entry) =>
      pairing.startActions.includes(entry.action.code),
    )
    const endEntries = categoryEntries.filter((entry) =>
      pairing.endActions.includes(entry.action.code),
    )

    const remainingEnds = [...endEntries]

    startEntries.forEach((startEntry) => {
      const matchIndex = remainingEnds.findIndex(
        (endEntry) =>
          endEntry.owner === startEntry.owner &&
          toTimestamp(endEntry.createdAt) >= toTimestamp(startEntry.createdAt),
      )

      if (matchIndex === -1) {
        pushIssue(resultMap, startEntry, {
          severity: 'error',
          code: 'missing_pair_end',
          message: `${pairing.description} A follow-up entry was not found for ${startEntry.action.code}.`,
        })
        return
      }

      remainingEnds.splice(matchIndex, 1)
    })

    endEntries.forEach((endEntry) => {
      const matchingStart = startEntries.find(
        (startEntry) =>
          startEntry.owner === endEntry.owner &&
          toTimestamp(startEntry.createdAt) <= toTimestamp(endEntry.createdAt),
      )

      if (!matchingStart) {
        pushIssue(resultMap, endEntry, {
          severity: 'warning',
          code: 'missing_pair_start',
          message: `${pairing.description} A preceding start entry was not found for ${endEntry.action.code}.`,
        })
      }
    })
  })
}

export const validateInstructionSequences = (
  entries: InstructionLogEntry[],
): InstructionValidationReport => {
  const resultMap = new Map<string, InstructionValidationResult>()
  const groups = new Map<string, InstructionLogEntry[]>()

  entries.forEach((entry) => {
    const group = groups.get(entry.id)

    if (group) {
      group.push(entry)
    } else {
      groups.set(entry.id, [entry])
    }
  })

  const categorySummariesMap = new Map<InstructionCategory, InstructionValidationCategorySummary>()

  const ensureCategorySummary = (
    category: InstructionCategory,
  ): InstructionValidationCategorySummary => {
    const existing = categorySummariesMap.get(category)

    if (existing) {
      return existing
    }

    const summary: InstructionValidationCategorySummary = {
      category,
      instructionCount: 0,
      affectedCount: 0,
      errorCount: 0,
      warningCount: 0,
    }

    categorySummariesMap.set(category, summary)

    return summary
  }

  groups.forEach((groupEntries) => {
    const category = groupEntries[0]?.category

    if (!category) {
      return
    }

    const rule = CATEGORY_VALIDATION_RULES[category]

    if (!rule) {
      return
    }

    const summary = ensureCategorySummary(category)
    summary.instructionCount += 1

    validateSequenceForGroup(resultMap, groupEntries, rule)
  })

  Object.entries(CATEGORY_VALIDATION_RULES).forEach(([categoryKey, rule]) => {
    const category = categoryKey as InstructionCategory
    const categoryEntries = entries.filter((entry) => entry.category === category)

    if (categoryEntries.length === 0) {
      return
    }

    ensureCategorySummary(category)
    validatePairings(resultMap, categoryEntries, rule)
  })

  const results = Array.from(resultMap.values()).sort((a, b) => {
    if (b.errorCount !== a.errorCount) {
      return b.errorCount - a.errorCount
    }

    if (b.warningCount !== a.warningCount) {
      return b.warningCount - a.warningCount
    }

    return a.title.localeCompare(b.title)
  })

  const totals = results.reduce(
    (accumulator, result) => {
      accumulator.errorCount += result.errorCount
      accumulator.warningCount += result.warningCount

      if (result.errorCount > 0 || result.warningCount > 0) {
        accumulator.affectedCount += 1
      }

      return accumulator
    },
    {
      instructionCount: groups.size,
      affectedCount: 0,
      errorCount: 0,
      warningCount: 0,
    },
  )

  results.forEach((result) => {
    if (result.errorCount === 0 && result.warningCount === 0) {
      return
    }

    const summary = ensureCategorySummary(result.category)
    summary.affectedCount += 1
    summary.errorCount += result.errorCount
    summary.warningCount += result.warningCount
  })

  const categorySummaries = Array.from(categorySummariesMap.values()).sort((a, b) => {
    if (b.errorCount !== a.errorCount) {
      return b.errorCount - a.errorCount
    }

    if (b.warningCount !== a.warningCount) {
      return b.warningCount - a.warningCount
    }

    return a.category.localeCompare(b.category)
  })

  return {
    results,
    totals,
    categorySummaries,
    generatedAt: new Date().toISOString(),
  }
}
