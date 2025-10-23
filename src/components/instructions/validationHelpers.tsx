import { Tag } from 'antd'
import type { ReactNode } from 'react'

import type { InstructionValidationResult } from '@/types/instruction'

export type ValidationSeverity = 'error' | 'warning' | null

export const getValidationSeverity = (
  validation?: InstructionValidationResult,
): ValidationSeverity => {
  if (!validation) {
    return null
  }

  if (validation.errorCount > 0) {
    return 'error'
  }

  if (validation.warningCount > 0) {
    return 'warning'
  }

  return null
}

export const renderValidationTags = (
  validation?: InstructionValidationResult,
): ReactNode[] | null => {
  if (!validation) {
    return null
  }

  const tags: ReactNode[] = []

  if (validation.errorCount > 0) {
    tags.push(
      <Tag key="errors" color="red">
        {`${validation.errorCount} error${validation.errorCount === 1 ? '' : 's'}`}
      </Tag>,
    )
  }

  if (validation.warningCount > 0) {
    tags.push(
      <Tag key="warnings" color="orange">
        {`${validation.warningCount} warning${validation.warningCount === 1 ? '' : 's'}`}
      </Tag>,
    )
  }

  return tags.length > 0 ? tags : null
}
