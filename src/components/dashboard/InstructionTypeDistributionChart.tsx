import { Card, Empty, Space, Typography } from 'antd'
import type { TooltipProps } from 'recharts'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import type { InstructionTypeDistributionEntry } from '@/hooks/useInstructionAnalytics'

interface InstructionTypeDistributionChartProps {
  data: InstructionTypeDistributionEntry[]
  isLoading: boolean
}

const formatTooltip: TooltipProps<number, string>['formatter'] = (value, name, payload) => {
  const entry = payload?.payload as InstructionTypeDistributionEntry | undefined

  if (!entry) {
    return [value, name]
  }

  const formattedValue = typeof value === 'number' ? value.toLocaleString() : value

  return [`${formattedValue} (${entry.percentage.toFixed(1)}%)`, name]
}

export const InstructionTypeDistributionChart = ({ data, isLoading }: InstructionTypeDistributionChartProps) => {
  const hasData = data.length > 0

  return (
    <Card
      bordered={false}
      title="Instruction type distribution"
      className="chart-card"
      loading={isLoading}
    >
      {hasData ? (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div className="chart-container chart-container--pie">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip formatter={tooltipFormatter} />
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="label"
                  innerRadius="55%"
                  outerRadius="80%"
                  paddingAngle={2}
                >
                  {data.map((entry) => (
                    <Cell key={entry.category} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-legend">
            {data.map((entry) => (
              <Space key={entry.category} size={8} align="baseline">
                <span className="chart-legend-dot" style={{ backgroundColor: entry.color }} />
                <Typography.Text strong>{entry.label}</Typography.Text>
                <Typography.Text type="secondary">
                  {entry.count.toLocaleString()} · {entry.percentage.toFixed(1)}%
                </Typography.Text>
              </Space>
            ))}
          </div>
        </Space>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Category distribution will appear once instructions are parsed"
        />
      )}
    </Card>
  )
}
