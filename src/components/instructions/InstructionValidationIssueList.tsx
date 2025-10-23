import { Space, Tag, Typography } from 'antd'

import type { InstructionValidationResult } from '@/types/instruction'

interface InstructionValidationIssueListProps {
  validation: InstructionValidationResult | null | undefined
  maxItems?: number
}

const formatRemainingIssues = (remaining: number): string =>
  remaining === 1 ? '1 additional issue not shown' : `${remaining} additional issues not shown`

export const InstructionValidationIssueList = ({
  validation,
  maxItems,
}: InstructionValidationIssueListProps) => {
  if (!validation || validation.issues.length === 0) {
    return null
  }

  const issues = typeof maxItems === 'number' ? validation.issues.slice(0, maxItems) : validation.issues
  const remaining = typeof maxItems === 'number' ? validation.issues.length - issues.length : 0

  return (
    <Space direction="vertical" size={6} className="instruction-validation-issues">
      {issues.map((issue, index) => (
        <Space
          key={`${validation.instructionId}-${issue.code}-${index}`}
          align="start"
          className="instruction-validation-issue"
        >
          <Tag color={issue.severity === 'error' ? 'red' : 'orange'}>{issue.severity.toUpperCase()}</Tag>
          <Space direction="vertical" size={0} style={{ flex: 1 }}>
            <Typography.Text>{issue.message}</Typography.Text>
            {issue.detail && (
              <Typography.Text type="secondary">{issue.detail}</Typography.Text>
            )}
          </Space>
        </Space>
      ))}
      {remaining > 0 && (
        <Typography.Text type="secondary">{formatRemainingIssues(remaining)}</Typography.Text>
      )}
    </Space>
  )
}
