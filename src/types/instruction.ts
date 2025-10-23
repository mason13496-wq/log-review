export type InstructionCategory = 'quality' | 'compliance' | 'safety' | 'efficiency'

export type InstructionStatus = 'pending' | 'in_review' | 'approved' | 'rejected'

export interface InstructionPayload {
  revision: number
  summary: string
  steps: string[]
  ownerNotes?: string
}

export interface InstructionActionMetadata {
  code: string
  name: string
  category: InstructionCategory
  color: string
}

export interface InstructionLogEntry {
  id: string
  title: string
  category: InstructionCategory
  status: InstructionStatus
  createdAt: string
  owner: string
  payload: InstructionPayload
  action: InstructionActionMetadata
}

export interface InstructionMetric {
  category: InstructionCategory
  count: number
}

export interface InstructionLogFileMetadata {
  name: string
  size: number
  instructionCount: number
  lastModified?: number
}

export interface InstructionLogParseError {
  line: number
  message: string
  raw?: string
}

export type InstructionValidationSeverity = 'error' | 'warning'

export type InstructionValidationIssueCode =
  | 'missing_sequence_start'
  | 'missing_sequence_end'
  | 'time_order_violation'
  | 'status_regression'
  | 'missing_required_field'
  | 'missing_pair_end'
  | 'missing_pair_start'
  | 'insufficient_steps'

export interface InstructionValidationIssue {
  instructionId: string
  actionCode: string
  category: InstructionCategory
  severity: InstructionValidationSeverity
  code: InstructionValidationIssueCode
  message: string
  detail?: string
  relatedInstructionIds?: string[]
}

export interface InstructionValidationResult {
  instructionId: string
  actionCode: string
  title: string
  category: InstructionCategory
  issues: InstructionValidationIssue[]
  errorCount: number
  warningCount: number
}

export interface InstructionValidationCategorySummary {
  category: InstructionCategory
  instructionCount: number
  affectedCount: number
  errorCount: number
  warningCount: number
}

export interface InstructionValidationReportTotals {
  instructionCount: number
  affectedCount: number
  errorCount: number
  warningCount: number
}

export interface InstructionValidationReport {
  results: InstructionValidationResult[]
  totals: InstructionValidationReportTotals
  categorySummaries: InstructionValidationCategorySummary[]
  generatedAt: string
}

export type InstructionValidationLookup = Record<string, InstructionValidationResult>
