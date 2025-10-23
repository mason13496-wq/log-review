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
