import { Card, Col, Row, Statistic, Typography } from 'antd'

import { INSTRUCTION_CATEGORY_LABELS } from '@/constants/instructions'
import type { InstructionMetric } from '@/types/instruction'

interface InstructionSummaryProps {
  metrics: InstructionMetric[]
}

export const InstructionSummary = ({ metrics }: InstructionSummaryProps) => {
  return (
    <Card bordered={false} title="Instruction overview" bodyStyle={{ paddingBottom: 0 }}>
      <Row gutter={[16, 16]}>
        {metrics.map((metric) => (
          <Col xs={12} md={6} key={metric.category}>
            <Card size="small" bordered={false} className="summary-card">
              <Statistic
                title={INSTRUCTION_CATEGORY_LABELS[metric.category]}
                value={metric.count}
              />
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                Active instructions this week
              </Typography.Paragraph>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  )
}
