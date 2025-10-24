import { Button, DatePicker, Input, Select, Space } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

import { INSTRUCTION_CATEGORY_LABELS } from '@/constants/instructions'
import type { InstructionCategory } from '@/types/instruction'
import type { InstructionFilters } from '@/hooks/useInstructionStore'

const { RangePicker } = DatePicker

type RangeValue = [Dayjs | null, Dayjs | null] | null

interface InstructionFilterBarProps {
  categories: InstructionCategory[]
  actionOptions: Array<{ code: string; name: string }>
  filters: InstructionFilters
  onFiltersChange: (filters: Partial<InstructionFilters>) => void
  onReset: () => void
}

const toRangeValue = (timeRange: InstructionFilters['timeRange']): RangeValue => {
  const [from, to] = timeRange
  const start = from ? dayjs(from) : null
  const end = to ? dayjs(to) : null

  if (!start && !end) {
    return null
  }

  return [start, end]
}

export const InstructionFilterBar = ({
  categories,
  actionOptions,
  filters,
  onFiltersChange,
  onReset,
}: InstructionFilterBarProps) => {
  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.actionCodes.length > 0 ||
    filters.timeRange.some(Boolean) ||
    filters.searchTerm.trim().length > 0

  const rangeValue = toRangeValue(filters.timeRange)

  return (
    <Space wrap className="instruction-filter-bar">
      <Select
        mode="multiple"
        allowClear
        placeholder="Instruction types"
        value={filters.categories}
        onChange={(values: InstructionCategory[]) => onFiltersChange({ categories: values })}
        options={categories.map((category) => ({
          value: category,
          label: INSTRUCTION_CATEGORY_LABELS[category],
        }))}
        style={{ minWidth: 200 }}
        maxTagCount="responsive"
      />

      <Select
        mode="multiple"
        allowClear
        placeholder="Action codes"
        value={filters.actionCodes}
        onChange={(values: string[]) => onFiltersChange({ actionCodes: values })}
        options={actionOptions.map((option) => ({
          value: option.code,
          label: option.name ? `${option.code} — ${option.name}` : option.code,
        }))}
        optionLabelProp="value"
        style={{ minWidth: 220 }}
        maxTagCount="responsive"
        showSearch
      />

      <RangePicker
        value={rangeValue}
        onChange={(dates) => {
          if (!dates || dates.every((value) => value === null)) {
            onFiltersChange({ timeRange: [null, null] })
            return
          }

          const [start, end] = dates
          onFiltersChange({
            timeRange: [start ? start.toISOString() : null, end ? end.toISOString() : null],
          })
        }}
        allowClear
        showTime
        style={{ minWidth: 260 }}
      />

      <Input
        allowClear
        placeholder="Search action codes or payload"
        value={filters.searchTerm}
        onChange={(event) => onFiltersChange({ searchTerm: event.target.value })}
        style={{ minWidth: 240 }}
      />

      <Button type="text" onClick={onReset} disabled={!hasActiveFilters}>
        Reset filters
      </Button>
    </Space>
  )
}
