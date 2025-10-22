import { create } from 'zustand'

import type { InstructionLogEntry } from '@/types/instruction'
import { fetchInstructionLogs } from '@/services/instructionService'

interface InstructionState {
  logs: InstructionLogEntry[]
  isLoading: boolean
  error?: string
  loadLogs: () => Promise<void>
}

export const useInstructionStore = create<InstructionState>((set) => ({
  logs: [],
  isLoading: false,
  error: undefined,
  loadLogs: async () => {
    set({ isLoading: true, error: undefined })

    try {
      const logs = await fetchInstructionLogs()
      set({ logs, isLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load logs'
      set({ error: message, isLoading: false })
    }
  },
}))
