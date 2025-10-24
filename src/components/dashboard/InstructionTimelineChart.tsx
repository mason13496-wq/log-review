import { Card, Empty } from 'antd'
import type { TooltipProps } from 'recharts'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { InstructionTimelineEntry } from '@/hooks/useInstructionAnalytics'

interface InstructionTimelineChartProps {
  data: InstructionTimelineEntry[]
  isLoading: boolean
}

const chartMargin = { top: 10, right: 20, left: -20, bottom: 0 }

const formatValue: TooltipProps<number, string>['formatter'] = (value) => {
  const numeric = typeof value === 'number' ? value : Number(value)
  const formatted = Number.isNaN(numeric) ? value : numeric.toLocaleString()
  return [`${formatted}`, 'Instructions']
}

export const InstructionTimelineChart = ({ data, isLoading }: InstructionTimelineChartProps) => {
  const hasData = data.length > 0

  return (
    <Card
      bordered={false}
      title="Instruction activity over time"
      className="chart-card"
      loading={isLoading}
    >
      {hasData ? (
        <div className="chart-container chart-container--timeline">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={chartMargin}>
              <defs>
                <linearGradient id="timelineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-bar-color)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--chart-bar-color)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={48} />
              <Tooltip
                formatter={formatValue}
                labelFormatter={(label, payload) => {
                  const entry = payload?.[0]?.payload as InstructionTimelineEntry | undefined
                  return entry?.fullLabel ?? label
                }}
                cursor={{ stroke: 'var(--chart-bar-color)', strokeOpacity: 0.2 }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--chart-bar-color)"
                strokeWidth={2}
                fill="url(#timelineGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Timeline metrics will appear once instructions are parsed"
        />
      )}
    </Card>
  )
}
