import { Collapse, Space, Tag, Typography } from 'antd'
import type { KeyboardEvent } from 'react'

import {
  INSTRUCTION_CATEGORY_LABELS,
  INSTRUCTION_STATUS_COLORS,
  INSTRUCTION_STATUS_LABELS,
} from '@/constants/instructions'
import type { InstructionLogEntry } from '@/types/instruction'
import { formatInstructionTimestamp } from '@/utils/date'

interface InstructionListViewProps {
  instructions: InstructionLogEntry[]
  selectedId: string | null
  onSelect: (id: string) => void
}

const handleKeyPress = (event: KeyboardEvent<HTMLDivElement>, id: string, onSelect: (id: string) => void) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onSelect(id)
  }
}

const renderPayload = (instruction: InstructionLogEntry) => (
  <pre className="instruction-payload">{JSON.stringify(instruction.payload, null, 2)}</pre>
)

export const InstructionListView = ({ instructions, selectedId, onSelect }: InstructionListViewProps) => {
  return (
    <div className="instruction-list" role="list">
      {instructions.map((instruction) => {
        const isSelected = instruction.id === selectedId
        const itemClassName = `instruction-list-item${
          isSelected ? ' instruction-list-item--selected' : ''
        }`

        return (
          <div
            key={instruction.id}
            role="listitem"
            tabIndex={0}
            aria-selected={isSelected}
            className={itemClassName}
            onClick={() => onSelect(instruction.id)}
            onKeyDown={(event) => handleKeyPress(event, instruction.id, onSelect)}
          >
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Space align="baseline" wrap>
                <Typography.Title level={5} style={{ margin: 0 }}>
                  {instruction.title}
                </Typography.Title>
                <Typography.Text type="secondary" code>
                  {instruction.action.code}
                </Typography.Text>
              </Space>

              <Space size={[8, 8]} wrap>
                <Tag color={instruction.action.color}>
                  {INSTRUCTION_CATEGORY_LABELS[instruction.category]}
                </Tag>
                <Tag color={INSTRUCTION_STATUS_COLORS[instruction.status]}>
                  {INSTRUCTION_STATUS_LABELS[instruction.status]}
                </Tag>
                <Tag>{instruction.owner}</Tag>
              </Space>

              <Typography.Text type="secondary">
                {formatInstructionTimestamp(instruction.createdAt)}
              </Typography.Text>

              <Typography.Paragraph style={{ marginBottom: 0 }}>
                {instruction.payload.summary}
              </Typography.Paragraph>

              {instruction.payload.steps.length > 0 && (
                <Space size={[8, 8]} wrap>
                  {instruction.payload.steps.map((step, index) => (
                    <Tag key={`${instruction.id}-step-${index}`}>{step}</Tag>
                  ))}
                </Space>
              )}

              <Collapse
                ghost
                size="small"
                className="instruction-payload-collapse"
                items={[
                  {
                    key: `${instruction.id}-payload`,
                    label: 'View payload JSON',
                    children: renderPayload(instruction),
                  },
                ]}
              />
            </Space>
          </div>
        )
      })}
    </div>
  )
}
