export type InstructionCategory = 'quality' | 'compliance' | 'safety' | 'efficiency'

export type InstructionStatus = 'pending' | 'in_review' | 'approved' | 'rejected'

export interface InstructionPayload {
  revision: number
  summary: string
  steps: string[]
  ownerNotes?: string
}

export interface InstructionLogEntry {
  id: string
  title: string
  category: InstructionCategory
  status: InstructionStatus
  createdAt: string
  owner: string
  payload: InstructionPayload
}

export interface InstructionMetric {
  category: InstructionCategory
  count: number
}
