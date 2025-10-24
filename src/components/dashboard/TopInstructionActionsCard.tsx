import { Card, Empty, List, Progress, Space, Tag, Typography } from 'antd'

import { INSTRUCTION_CATEGORY_LABELS } from '@/constants/instructions'
import type { InstructionTopActionEntry } from '@/hooks/useInstructionAnalytics'

interface TopInstructionActionsCardProps {
  actions: InstructionTopActionEntry[]
  isLoading: boolean
}

export const TopInstructionActionsCard = ({ actions, isLoading }: TopInstructionActionsCardProps) => {
  const hasData = actions.length > 0

  return (
    <Card
      bordered={false}
      title="Top instruction usage"
      className="list-card"
      loading={isLoading}
    >
      {hasData ? (
        <List
          dataSource={actions}
          split={false}
          renderItem={(action, index) => (
            <List.Item key={action.code} className="top-actions-item">
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Space align="baseline" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space size={8} wrap>
                    <Typography.Text strong>
                      #{index + 1} {action.name}
                    </Typography.Text>
                    <Typography.Text type="secondary" code>
                      {action.code}
                    </Typography.Text>
                    <Tag color={action.color}>{INSTRUCTION_CATEGORY_LABELS[action.category]}</Tag>
                  </Space>
                  <Typography.Text strong>{action.count.toLocaleString()}</Typography.Text>
                </Space>
                <Progress
                  percent={parseFloat(action.percentage.toFixed(1))}
                  strokeColor={action.color}
                  showInfo
                  format={(percent) => `${percent?.toFixed(1)}%`}
                />
              </Space>
            </List.Item>
          )}
        />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Top usage ranking will appear once instructions are parsed"
        />
      )}
    </Card>
  )
}
