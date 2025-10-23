import { Card, Col, Collapse, Empty, Row, Space, Tag, Timeline, Typography } from 'antd'
import type { KeyboardEvent } from 'react'
import { useMemo } from 'react'

import {
  INSTRUCTION_CATEGORY_LABELS,
  INSTRUCTION_STATUS_COLORS,
  INSTRUCTION_STATUS_LABELS,
} from '@/constants/instructions'
import type { InstructionLogEntry } from '@/types/instruction'
import { formatInstructionTimestamp } from '@/utils/date'

interface InstructionTimelineProps {
  instructions: InstructionLogEntry[]
  selectedId: string | null
  selectedInstruction: InstructionLogEntry | null
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

export const InstructionTimeline = ({
  instructions,
  selectedId,
  selectedInstruction,
  onSelect,
}: InstructionTimelineProps) => {
  const orderedInstructions = useMemo(
    () =>
      [...instructions].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [instructions],
  )

  const resolvedSelectedInstruction = useMemo(() => {
    if (selectedInstruction) {
      return selectedInstruction
    }

    return orderedInstructions.find((instruction) => instruction.id === selectedId) ?? null
  }, [orderedInstructions, selectedId, selectedInstruction])

  const timelineItems = orderedInstructions.map((instruction) => {
    const isSelected = instruction.id === selectedId
    const dotClassName = `instruction-timeline-dot${
      isSelected ? ' instruction-timeline-dot--selected' : ''
    }`

    return {
      key: instruction.id,
      color: instruction.action.color,
      dot: <span className={dotClassName} style={{ borderColor: instruction.action.color }} />,
      children: (
        <div
          className={`instruction-timeline-item${
            isSelected ? ' instruction-timeline-item--selected' : ''
          }`}
          role="button"
          tabIndex={0}
          aria-pressed={isSelected}
          onClick={() => onSelect(instruction.id)}
          onKeyDown={(event) => handleKeyPress(event, instruction.id, onSelect)}
        >
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Space align="baseline" wrap>
              <Typography.Text strong>{instruction.title}</Typography.Text>
              <Typography.Text type="secondary" code>
                {instruction.action.code}
              </Typography.Text>
            </Space>

            <Typography.Text type="secondary">
              {formatInstructionTimestamp(instruction.createdAt)}
            </Typography.Text>

            <Space size={[8, 8]} wrap>
              <Tag color={instruction.action.color}>
                {INSTRUCTION_CATEGORY_LABELS[instruction.category]}
              </Tag>
              <Tag color={INSTRUCTION_STATUS_COLORS[instruction.status]}>
                {INSTRUCTION_STATUS_LABELS[instruction.status]}
              </Tag>
            </Space>

            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {instruction.payload.summary}
            </Typography.Paragraph>
          </Space>
        </div>
      ),
    }
  })

  return (
    <Row gutter={[24, 24]} className="instruction-timeline-layout">
      <Col xs={24} lg={14}>
        <Timeline className="instruction-timeline" mode="left" items={timelineItems} />
      </Col>
      <Col xs={24} lg={10}>
        {resolvedSelectedInstruction ? (
          <Card
            type="inner"
            title={resolvedSelectedInstruction.title}
            className="instruction-timeline-detail"
          >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Space align="center" wrap size={8}>
                <Tag color={resolvedSelectedInstruction.action.color}>
                  {INSTRUCTION_CATEGORY_LABELS[resolvedSelectedInstruction.category]}
                </Tag>
                <Tag color={INSTRUCTION_STATUS_COLORS[resolvedSelectedInstruction.status]}>
                  {INSTRUCTION_STATUS_LABELS[resolvedSelectedInstruction.status]}
                </Tag>
                <Tag>{resolvedSelectedInstruction.owner}</Tag>
              </Space>

              <Typography.Text type="secondary">
                {formatInstructionTimestamp(resolvedSelectedInstruction.createdAt)}
              </Typography.Text>

              <Typography.Paragraph style={{ marginBottom: 0 }}>
                {resolvedSelectedInstruction.payload.summary}
              </Typography.Paragraph>

              {resolvedSelectedInstruction.payload.steps.length > 0 && (
                <Space direction="vertical" size={4} className="instruction-step-section">
                  <Typography.Text strong>Steps</Typography.Text>
                  <ol className="instruction-step-list">
                    {resolvedSelectedInstruction.payload.steps.map((step, index) => (
                      <li key={`${resolvedSelectedInstruction.id}-timeline-step-${index}`}>
                        <Typography.Text>{step}</Typography.Text>
                      </li>
                    ))}
                  </ol>
                </Space>
              )}

              <Typography.Text type="secondary" code>
                Action code: {resolvedSelectedInstruction.action.code}
              </Typography.Text>

              <Collapse
                ghost
                size="small"
                className="instruction-payload-collapse"
                items={[
                  {
                    key: `${resolvedSelectedInstruction.id}-timeline-payload`,
                    label: 'View payload JSON',
                    children: renderPayload(resolvedSelectedInstruction),
                  },
                ]}
              />
            </Space>
          </Card>
        ) : (
          <Empty description="Select an instruction to view details" />
        )}
      </Col>
    </Row>
  )
}
