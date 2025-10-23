import { Card, Col, Collapse, Empty, Row, Space, Tag, Timeline, Typography } from 'antd'
import type { KeyboardEvent } from 'react'
import { useMemo } from 'react'

import {
  INSTRUCTION_CATEGORY_LABELS,
  INSTRUCTION_STATUS_COLORS,
  INSTRUCTION_STATUS_LABELS,
} from '@/constants/instructions'
import type {
  InstructionLogEntry,
  InstructionValidationLookup,
  InstructionValidationResult,
} from '@/types/instruction'
import { formatInstructionTimestamp } from '@/utils/date'
import { getValidationSeverity, renderValidationTags } from './validationHelpers'
import { InstructionValidationIssueList } from './InstructionValidationIssueList'

interface InstructionTimelineProps {
  instructions: InstructionLogEntry[]
  selectedId: string | null
  selectedInstruction: InstructionLogEntry | null
  onSelect: (id: string) => void
  validationLookup?: InstructionValidationLookup
}

const VALIDATION_COLORS: Record<'error' | 'warning', string> = {
  error: '#ff4d4f',
  warning: '#faad14',
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
  validationLookup,
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

  const resolvedSelectedValidation = useMemo<InstructionValidationResult | null>(() => {
    if (!resolvedSelectedInstruction) {
      return null
    }

    return validationLookup?.[resolvedSelectedInstruction.id] ?? null
  }, [resolvedSelectedInstruction, validationLookup])

  const timelineItems = orderedInstructions.map((instruction) => {
    const isSelected = instruction.id === selectedId
    const validation = validationLookup?.[instruction.id]
    const validationSeverity = getValidationSeverity(validation)
    const color = validationSeverity ? VALIDATION_COLORS[validationSeverity] : instruction.action.color
    const dotClassNames = ['instruction-timeline-dot']

    if (isSelected) {
      dotClassNames.push('instruction-timeline-dot--selected')
    }

    if (validationSeverity === 'error') {
      dotClassNames.push('instruction-timeline-dot--error')
    } else if (validationSeverity === 'warning') {
      dotClassNames.push('instruction-timeline-dot--warning')
    }

    const itemClassNames = ['instruction-timeline-item']

    if (isSelected) {
      itemClassNames.push('instruction-timeline-item--selected')
    }

    if (validationSeverity === 'error') {
      itemClassNames.push('instruction-timeline-item--error')
    } else if (validationSeverity === 'warning') {
      itemClassNames.push('instruction-timeline-item--warning')
    }

    const validationTags = renderValidationTags(validation)

    return {
      key: instruction.id,
      color,
      dot: <span className={dotClassNames.join(' ')} style={{ borderColor: color }} />,
      children: (
        <div
          className={itemClassNames.join(' ')}
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
              {validationTags}
            </Space>

            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {instruction.payload.summary}
            </Typography.Paragraph>
          </Space>
        </div>
      ),
    }
  })

  const selectedValidationTags = renderValidationTags(resolvedSelectedValidation ?? undefined)

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
                {selectedValidationTags}
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

              <InstructionValidationIssueList validation={resolvedSelectedValidation} />

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
