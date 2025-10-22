import type { InstructionCategory, InstructionStatus } from '@/types/instruction'

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
