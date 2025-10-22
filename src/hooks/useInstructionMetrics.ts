import { useMemo } from 'react'

import { INSTRUCTION_CATEGORY_ORDER } from '@/constants/instructions'
import type { InstructionMetric } from '@/types/instruction'
import { useInstructionStore } from './useInstructionStore'

export const useInstructionMetrics = (): InstructionMetric[] => {
  const logs = useInstructionStore((state) => state.logs)

  return useMemo(() => {
    return INSTRUCTION_CATEGORY_ORDER.map((category) => ({
      category,
      count: logs.filter((log) => log.category === category).length,
    }))
  }, [logs])
}
