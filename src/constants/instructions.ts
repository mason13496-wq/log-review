import type {
  InstructionActionMetadata,
  InstructionCategory,
  InstructionStatus,
} from '@/types/instruction'

export const INSTRUCTION_CATEGORY_LABELS: Record<InstructionCategory, string> = {
  quality: 'Quality Assurance',
  compliance: 'Compliance',
  safety: 'Safety',
  efficiency: 'Operational Efficiency',
}

export const INSTRUCTION_STATUS_LABELS: Record<InstructionStatus, string> = {
  pending: 'Pending Review',
  in_review: 'In Review',
  approved: 'Approved',
  rejected: 'Requires Changes',
}

export const INSTRUCTION_STATUS_COLORS: Record<InstructionStatus, string> = {
  pending: 'gold',
  in_review: 'blue',
  approved: 'green',
  rejected: 'red',
}

export const INSTRUCTION_CATEGORY_ORDER: InstructionCategory[] = [
  'quality',
  'compliance',
  'safety',
  'efficiency',
]

export const INSTRUCTION_CATEGORY_COLORS: Record<InstructionCategory, string> = {
  quality: '#722ed1',
  compliance: '#1677ff',
  safety: '#fa541c',
  efficiency: '#52c41a',
}

type ActionDefinition = {
  name?: string
  category: InstructionCategory
  color?: string
}

const ACTION_DEFINITIONS: Record<string, ActionDefinition> = {
  QA_INSPECTION: { name: 'Quality Inspection', category: 'quality' },
  QA_DEVIATION_REVIEW: { name: 'Deviation Review', category: 'quality' },
  QUALITY_AUDIT: { name: 'Quality Audit', category: 'quality' },
  QUALITY_CHECK: { name: 'Quality Check', category: 'quality' },
  COMPLIANCE_AUDIT: { name: 'Compliance Audit', category: 'compliance' },
  COMPLIANCE_CHECK: { name: 'Compliance Check', category: 'compliance' },
  COMPLIANCE_REVIEW: { name: 'Compliance Review', category: 'compliance' },
  POLICY_UPDATE: { name: 'Policy Update', category: 'compliance' },
  SAFETY_DRILL: { name: 'Safety Drill', category: 'safety' },
  SAFETY_ALERT: { name: 'Safety Alert', category: 'safety' },
  SAFETY_INSPECTION: { name: 'Safety Inspection', category: 'safety' },
  INCIDENT_REVIEW: { name: 'Incident Review', category: 'safety' },
  WORKFLOW_OPTIMIZATION: { name: 'Workflow Optimization', category: 'efficiency' },
  WORKFLOW_UPDATE: { name: 'Workflow Update', category: 'efficiency' },
  PROCESS_UPDATE: { name: 'Process Update', category: 'efficiency' },
  PROCESS_IMPROVEMENT: { name: 'Process Improvement', category: 'efficiency' },
  EFFICIENCY_REVIEW: { name: 'Efficiency Review', category: 'efficiency' },
  MAINTENANCE_SCHEDULE: { name: 'Maintenance Schedule', category: 'efficiency' },
  MAINTENANCE_CHECK: { name: 'Maintenance Check', category: 'efficiency' },
  PERFORMANCE_REVIEW: { name: 'Performance Review', category: 'efficiency' },
  SOP_UPDATE: { name: 'SOP Update', category: 'compliance' },
  SOP_REVIEW: { name: 'SOP Review', category: 'compliance' },
  AUDIT_RESPONSE: { name: 'Audit Response', category: 'compliance' },
  RISK_ASSESSMENT: { name: 'Risk Assessment', category: 'safety' },
  INCIDENT_REPORT: { name: 'Incident Report', category: 'safety' },
  QUALITY_IMPROVEMENT: { name: 'Quality Improvement', category: 'quality' },
  TRAINING_SESSION: { name: 'Training Session', category: 'quality' },
  TRAINING_COMPLETION: { name: 'Training Completion', category: 'quality' },
  CAPA_UPDATE: { name: 'CAPA Update', category: 'quality' },
}

const CATEGORY_INFERENCE_RULES: Array<{ pattern: RegExp; category: InstructionCategory }> = [
  { pattern: /^(QA|QC|QUALITY|LAB)/, category: 'quality' },
  { pattern: /(QUALITY|QA|QC|CALIBRATION)/, category: 'quality' },
  { pattern: /^(COMP|REG|POLICY|AUDIT|GOV)/, category: 'compliance' },
  { pattern: /(COMPLIANCE|AUDIT|REGULATION|POLICY)/, category: 'compliance' },
  { pattern: /^(SAFE|HSE|EHS|SECURITY|RISK)/, category: 'safety' },
  { pattern: /(SAFETY|INCIDENT|HAZARD|EMERGENCY)/, category: 'safety' },
  { pattern: /^(OPS|EFF|LEAN|MAINT|SOP|WORK|PROC|PROD)/, category: 'efficiency' },
  { pattern: /(EFFICIENCY|OPTIM|MAINTENANCE|WORKFLOW|THROUGHPUT|SCHEDULE)/, category: 'efficiency' },
]

const normalizeActionCode = (code: string): string =>
  code.trim().replace(/[\s-]+/g, '_').toUpperCase()

const inferCategoryFromCode = (code: string): InstructionCategory => {
  const rule = CATEGORY_INFERENCE_RULES.find(({ pattern }) => pattern.test(code))
  return rule?.category ?? 'quality'
}

export const formatInstructionActionName = (code: string): string => {
  const normalized = normalizeActionCode(code)
  const tokens = normalized.split('_').filter(Boolean)

  if (tokens.length === 0) {
    return 'Instruction'
  }

  return tokens
    .map((token) => {
      if (/^\d+$/.test(token)) {
        return token
      }

      if (token.length <= 3 && /^[A-Z]+$/.test(token)) {
        return token
      }

      return token.charAt(0) + token.slice(1).toLowerCase()
    })
    .join(' ')
}

export const getInstructionActionMetadata = (code: string): InstructionActionMetadata => {
  const normalized = normalizeActionCode(code)
  const definition = ACTION_DEFINITIONS[normalized]
  const category = definition?.category ?? inferCategoryFromCode(normalized)
  const name = definition?.name ?? formatInstructionActionName(normalized)
  const color = definition?.color ?? INSTRUCTION_CATEGORY_COLORS[category]

  return {
    code: normalized,
    name,
    category,
    color,
  }
}
