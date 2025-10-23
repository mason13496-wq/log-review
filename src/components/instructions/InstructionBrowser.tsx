import { AppstoreOutlined, BarsOutlined, FieldTimeOutlined } from '@ant-design/icons'
import { Alert, Card, Empty, Segmented, Space, Typography } from 'antd'
import type { SegmentedValue } from 'antd/es/segmented'
import { useEffect, useMemo, useState } from 'react'

import { INSTRUCTION_CATEGORY_ORDER } from '@/constants/instructions'
import { useInstructionStore } from '@/hooks/useInstructionStore'
import type { InstructionLogEntry, InstructionValidationLookup } from '@/types/instruction'

import { InstructionCardView } from './InstructionCardView'
import { InstructionFilterBar } from './InstructionFilterBar'
import { InstructionListView } from './InstructionListView'
import { InstructionTimeline } from './InstructionTimeline'
import { getSearchTokens } from './searchUtils'

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

  const filters = useInstructionStore((state) => state.filters)
  const setFilters = useInstructionStore((state) => state.setFilters)
  const clearFilters = useInstructionStore((state) => state.clearFilters)

  const { categories, actionCodes, timeRange, searchTerm } = filters

  const hasActiveFilters =
    categories.length > 0 ||
    actionCodes.length > 0 ||
    timeRange.some(Boolean) ||
    searchTerm.trim().length > 0

  const categoryOptions = useMemo(() => {
    const availableCategories = new Set(instructions.map((instruction) => instruction.category))
    return INSTRUCTION_CATEGORY_ORDER.filter((category) => availableCategories.has(category))
  }, [instructions])

  const actionOptions = useMemo(
    () => {
      const map = new Map<string, { code: string; name: string }>()

      instructions.forEach((instruction) => {
        const code = instruction.action.code
        if (!map.has(code)) {
          map.set(code, { code, name: instruction.action.name })
        }
      })

      return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code))
    },
    [instructions],
  )

  const payloadSearchIndex = useMemo(() => {
    const index = new Map<string, string>()

    instructions.forEach((instruction) => {
      index.set(instruction.id, JSON.stringify(instruction.payload).toLowerCase())
    })

    return index
  }, [instructions])

  const searchTokens = useMemo(() => getSearchTokens(searchTerm), [searchTerm])

  const filteredInstructions = useMemo(() => {
    if (instructions.length === 0) {
      return []
    }

    const [from, to] = timeRange
    const fromTime = from ? new Date(from).getTime() : null
    const toTime = to ? new Date(to).getTime() : null

    return instructions.filter((instruction) => {
      if (categories.length > 0 && !categories.includes(instruction.category)) {
        return false
      }

      if (actionCodes.length > 0 && !actionCodes.includes(instruction.action.code)) {
        return false
      }

      const createdAtTime = new Date(instruction.createdAt).getTime()

      if (fromTime !== null && createdAtTime < fromTime) {
        return false
      }

      if (toTime !== null && createdAtTime > toTime) {
        return false
      }

      if (searchTokens.length > 0) {
        const payloadValue = payloadSearchIndex.get(instruction.id) ?? ''
        const combined = `${instruction.action.code.toLowerCase()} ${instruction.action.name.toLowerCase()} ${payloadValue}`

        return searchTokens.every((token) => combined.includes(token))
      }

      return true
    })
  }, [
    instructions,
    categories,
    actionCodes,
    timeRange,
    searchTokens,
    payloadSearchIndex,
  ])

  useEffect(() => {
    setSelectedId((current) => {
      if (filteredInstructions.length === 0) {
        return null
      }

      if (current && filteredInstructions.some((instruction) => instruction.id === current)) {
        return current
      }

      return filteredInstructions[0]?.id ?? null
    })
  }, [filteredInstructions])

  const selectedInstruction = useMemo(
    () => filteredInstructions.find((instruction) => instruction.id === selectedId) ?? null,
    [filteredInstructions, selectedId],
  )

  const handleViewChange = (value: SegmentedValue) => {
    setViewMode(value as ViewMode)
  }

  const handleInstructionSelect = (id: string) => {
    setSelectedId(id)
  }

  const shouldShowEmptyState = filteredInstructions.length === 0
  const totalInstructions = instructions.length

  const emptyStateDescription = useMemo(() => {
    if (!hasUploadedFile) {
      return 'Upload a log file to explore instruction activity'
    }

    if (totalInstructions === 0) {
      return 'No instruction entries available in the uploaded file'
    }

    if (hasActiveFilters) {
      return 'No instructions match the current filters'
    }

    return 'No instruction entries available in the uploaded file'
  }, [hasUploadedFile, totalInstructions, hasActiveFilters])

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

        {totalInstructions > 0 && (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <InstructionFilterBar
              categories={categoryOptions}
              actionOptions={actionOptions}
              filters={filters}
              onFiltersChange={setFilters}
              onReset={clearFilters}
            />
            <Typography.Text type="secondary">
              Showing {filteredInstructions.length.toLocaleString()} of
              {' '}
              {totalInstructions.toLocaleString()} instructions
            </Typography.Text>
          </Space>
        )}

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
            description={emptyStateDescription}
          />
        ) : (
          <>
            {viewMode === 'timeline' && (
              <InstructionTimeline
                instructions={filteredInstructions}
                selectedId={selectedId}
                selectedInstruction={selectedInstruction}
                onSelect={handleInstructionSelect}
                validationLookup={validationLookup}
                searchTokens={searchTokens}
              />
            )}

            {viewMode === 'list' && (
              <InstructionListView
                instructions={filteredInstructions}
                selectedId={selectedId}
                onSelect={handleInstructionSelect}
                validationLookup={validationLookup}
                searchTokens={searchTokens}
              />
            )}

            {viewMode === 'card' && (
              <InstructionCardView
                instructions={filteredInstructions}
                selectedId={selectedId}
                onSelect={handleInstructionSelect}
                validationLookup={validationLookup}
                searchTokens={searchTokens}
              />
            )}
          </>
        )}
      </Space>
    </Card>
  )
}
