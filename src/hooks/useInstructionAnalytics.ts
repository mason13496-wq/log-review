import { useMemo } from 'react'

import {
  INSTRUCTION_CATEGORY_COLORS,
  INSTRUCTION_CATEGORY_LABELS,
  INSTRUCTION_CATEGORY_ORDER,
  INSTRUCTION_STATUS_LABELS,
} from '@/constants/instructions'
import type { InstructionCategory, InstructionStatus } from '@/types/instruction'
import { useInstructionStore } from './useInstructionStore'

export interface InstructionTypeDistributionEntry {
  category: InstructionCategory
  label: string
  count: number
  percentage: number
  color: string
}

export interface InstructionTimelineEntry {
  date: string
  label: string
  fullLabel: string
  count: number
}

export interface InstructionTopActionEntry {
  code: string
  name: string
  category: InstructionCategory
  color: string
  count: number
  percentage: number
}

export interface InstructionStatusDistributionEntry {
  status: InstructionStatus
  label: string
  count: number
  percentage: number
}

export interface InstructionStatisticsSummary {
  totalInstructions: number
  uniqueActions: number
  activeCategories: number
  averagePerDay: number
  peakDay?: {
    date: string
    label: string
    fullLabel: string
    count: number
  }
  validation: {
    affected: number
    errors: number
    warnings: number
  }
}

export interface InstructionAnalyticsResult {
  hasData: boolean
  summary: InstructionStatisticsSummary
  typeDistribution: InstructionTypeDistributionEntry[]
  timeline: InstructionTimelineEntry[]
  topActions: InstructionTopActionEntry[]
  statusDistribution: InstructionStatusDistributionEntry[]
}

export const useInstructionAnalytics = (): InstructionAnalyticsResult => {
  const logs = useInstructionStore((state) => state.logs)
  const validationReport = useInstructionStore((state) => state.validationReport)

  return useMemo(() => {
    const totalInstructions = logs.length

    const categoryCounts = new Map<InstructionCategory, number>()
    const statusCounts = new Map<InstructionStatus, number>()
    const actionCounts = new Map<
      string,
      { code: string; name: string; category: InstructionCategory; count: number }
    >()
    const dailyCounts = new Map<string, number>()

    logs.forEach((log) => {
      categoryCounts.set(log.category, (categoryCounts.get(log.category) ?? 0) + 1)
      statusCounts.set(log.status, (statusCounts.get(log.status) ?? 0) + 1)

      const existingAction = actionCounts.get(log.action.code)
      if (existingAction) {
        existingAction.count += 1
      } else {
        actionCounts.set(log.action.code, {
          code: log.action.code,
          name: log.action.name,
          category: log.action.category,
          count: 1,
        })
      }

      const createdAt = new Date(log.createdAt)
      if (!Number.isNaN(createdAt.getTime())) {
        const dateKey = createdAt.toISOString().slice(0, 10)
        dailyCounts.set(dateKey, (dailyCounts.get(dateKey) ?? 0) + 1)
      }
    })

    const shortDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
    const fullDateFormatter = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    const timeline = Array.from(dailyCounts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([dateKey, count]) => {
        const date = new Date(`${dateKey}T00:00:00Z`)
        return {
          date: dateKey,
          label: shortDateFormatter.format(date),
          fullLabel: fullDateFormatter.format(date),
          count,
        }
      })

    const averagePerDay = timeline.length > 0 ? totalInstructions / timeline.length : 0

    const peakDay = timeline.reduce<InstructionStatisticsSummary['peakDay']>((accumulator, entry) => {
      if (!accumulator || entry.count > accumulator.count) {
        return {
          date: entry.date,
          label: entry.label,
          fullLabel: entry.fullLabel,
          count: entry.count,
        }
      }

      return accumulator
    }, undefined)

    const typeDistribution = INSTRUCTION_CATEGORY_ORDER.map((category) => {
      const count = categoryCounts.get(category) ?? 0
      const percentage = totalInstructions > 0 ? (count / totalInstructions) * 100 : 0

      return {
        category,
        label: INSTRUCTION_CATEGORY_LABELS[category],
        count,
        percentage,
        color: INSTRUCTION_CATEGORY_COLORS[category],
      }
    }).filter((entry) => entry.count > 0)

    const statusDistribution = (Object.keys(INSTRUCTION_STATUS_LABELS) as InstructionStatus[])
      .map((status) => {
        const count = statusCounts.get(status) ?? 0
        const percentage = totalInstructions > 0 ? (count / totalInstructions) * 100 : 0

        return {
          status,
          label: INSTRUCTION_STATUS_LABELS[status],
          count,
          percentage,
        }
      })
      .filter((entry) => entry.count > 0)

    const topActions = Array.from(actionCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((action) => ({
        code: action.code,
        name: action.name,
        category: action.category,
        color: INSTRUCTION_CATEGORY_COLORS[action.category],
        count: action.count,
        percentage: totalInstructions > 0 ? (action.count / totalInstructions) * 100 : 0,
      }))

    const summary: InstructionStatisticsSummary = {
      totalInstructions,
      uniqueActions: actionCounts.size,
      activeCategories: categoryCounts.size,
      averagePerDay,
      peakDay,
      validation: {
        affected: validationReport?.totals.affectedCount ?? 0,
        errors: validationReport?.totals.errorCount ?? 0,
        warnings: validationReport?.totals.warningCount ?? 0,
      },
    }

    return {
      hasData: totalInstructions > 0,
      summary,
      typeDistribution,
      timeline,
      topActions,
      statusDistribution,
    }
  }, [logs, validationReport])
}
