import { create } from 'zustand'

import { parseInstructionLogLines } from '@/services/instructionService'
import { validateInstructionSequences } from '@/services/instructionValidation'
import type {
  InstructionLogEntry,
  InstructionLogFileMetadata,
  InstructionLogParseError,
  InstructionValidationReport,
} from '@/types/instruction'

export type UploadStatus = 'idle' | 'reading' | 'parsing' | 'complete' | 'error'

interface InstructionState {
  logs: InstructionLogEntry[]
  uploadStatus: UploadStatus
  uploadProgress: number
  fileMetadata?: InstructionLogFileMetadata
  parseErrors: InstructionLogParseError[]
  validationReport: InstructionValidationReport | null
  error?: string
  processLogFile: (file: File) => Promise<void>
  reset: () => void
}

const INITIAL_STATE: Omit<InstructionState, 'processLogFile' | 'reset'> = {
  logs: [],
  uploadStatus: 'idle',
  uploadProgress: 0,
  fileMetadata: undefined,
  parseErrors: [],
  validationReport: null,
  error: undefined,
}

const isSupportedLogFile = (file: File) => file.name.toLowerCase().endsWith('.log')

const toMetadata = (file: File, instructionCount: number): InstructionLogFileMetadata => ({
  name: file.name,
  size: file.size,
  instructionCount,
  lastModified: file.lastModified,
})

export const useInstructionStore = create<InstructionState>((set) => ({
  ...INITIAL_STATE,
  processLogFile: async (file: File) => {
    if (!isSupportedLogFile(file)) {
      set({
        uploadStatus: 'error',
        uploadProgress: 0,
        validationReport: null,
        error: 'Only .log files containing JSON Lines are supported',
      })
      return
    }

    set({
      logs: [],
      parseErrors: [],
      fileMetadata: undefined,
      error: undefined,
      validationReport: null,
      uploadStatus: 'reading',
      uploadProgress: 20,
    })

    let fileContent = ''

    try {
      fileContent = await file.text()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to read the selected file'
      set({
        uploadStatus: 'error',
        uploadProgress: 0,
        validationReport: null,
        error: message,
      })
      return
    }

    set({ uploadStatus: 'parsing', uploadProgress: 60 })

    const { entries, errors } = parseInstructionLogLines(fileContent)

    const hasValidEntries = entries.length > 0
    const hasErrorsOnly = !hasValidEntries && errors.length > 0
    const nextStatus: UploadStatus = hasErrorsOnly ? 'error' : 'complete'
    const nextErrorMessage = hasErrorsOnly
      ? 'No valid instruction records were found in the uploaded file'
      : undefined
    const validationReport = hasValidEntries ? validateInstructionSequences(entries) : null

    set({
      logs: entries,
      parseErrors: errors,
      fileMetadata: toMetadata(file, entries.length),
      validationReport,
      uploadStatus: nextStatus,
      uploadProgress: 100,
      error: nextErrorMessage,
    })
  },
  reset: () => set({ ...INITIAL_STATE }),
}))
