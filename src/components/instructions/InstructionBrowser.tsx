import { AppstoreOutlined, BarsOutlined, FieldTimeOutlined } from '@ant-design/icons'
import { Alert, Card, Empty, Segmented, Space, Typography } from 'antd'
import type { SegmentedValue } from 'antd/es/segmented'
import { useEffect, useMemo, useState } from 'react'

import type { InstructionLogEntry, InstructionValidationLookup } from '@/types/instruction'

import { InstructionCardView } from './InstructionCardView'
import { InstructionListView } from './InstructionListView'
import { InstructionTimeline } from './InstructionTimeline'

type ViewMode = 'timeline' | 'list' | 'card'

interface InstructionBrowserProps {
  instructions: InstructionLogEntry[]
  isLoading: boolean
  hasUploadedFile: boolean
  error?: string
  validationLookup?: InstructionValidationLookup
}

const viewOptions = [
  { label: 'Timeline', value: 'timeline', icon: <FieldTimeOutlined /> },
  { label: 'List', value: 'list', icon: <BarsOutlined /> },
  { label: 'Cards', value: 'card', icon: <AppstoreOutlined /> },
]

export const InstructionBrowser = ({
  instructions,
  isLoading,
  hasUploadedFile,
  error,
  validationLookup,
}: InstructionBrowserProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (instructions.length === 0) {
      setSelectedId(null)
      return
    }

    setSelectedId((current) => {
      if (current && instructions.some((instruction) => instruction.id === current)) {
        return current
      }

      return instructions[0]?.id ?? null
    })
  }, [instructions])

  const selectedInstruction = useMemo(
    () => instructions.find((instruction) => instruction.id === selectedId),
    [instructions, selectedId],
  )

  const handleViewChange = (value: SegmentedValue) => {
    setViewMode(value as ViewMode)
  }

  const handleInstructionSelect = (id: string) => {
    setSelectedId(id)
  }

  const shouldShowEmptyState = instructions.length === 0

  return (
    <Card
      title="Instruction activity"
      bordered={false}
      className="instruction-browser-card"
      loading={isLoading}
      extra={
        !shouldShowEmptyState && (
          <Segmented
            aria-label="Instruction view mode"
            value={viewMode}
            onChange={handleViewChange}
            options={viewOptions}
          />
        )
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Typography.Text type="secondary">
          Explore parsed instructions as a chronological timeline or browse them in list and card
          views. Selecting an entry will highlight it across all views.
        </Typography.Text>

        {error && (
          <Alert
            type="error"
            showIcon
            message="Unable to process instruction activity"
            description={error}
          />
        )}

        {shouldShowEmptyState ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              hasUploadedFile
                ? 'No instruction entries available in the uploaded file'
                : 'Upload a log file to explore instruction activity'
            }
          />
        ) : (
          <>
            {viewMode === 'timeline' && (
              <InstructionTimeline
                instructions={instructions}
                selectedId={selectedId}
                selectedInstruction={selectedInstruction ?? null}
                onSelect={handleInstructionSelect}
                validationLookup={validationLookup}
              />
            )}

            {viewMode === 'list' && (
              <InstructionListView
                instructions={instructions}
                selectedId={selectedId}
                onSelect={handleInstructionSelect}
                validationLookup={validationLookup}
              />
            )}

            {viewMode === 'card' && (
              <InstructionCardView
                instructions={instructions}
                selectedId={selectedId}
                onSelect={handleInstructionSelect}
                validationLookup={validationLookup}
              />
            )}
          </>
        )}
      </Space>
    </Card>
  )
}
