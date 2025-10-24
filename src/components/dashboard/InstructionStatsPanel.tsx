import { Card, Col, Empty, Row, Statistic, Typography } from 'antd'

import type { InstructionStatisticsSummary } from '@/hooks/useInstructionAnalytics'

interface InstructionStatsPanelProps {
  summary: InstructionStatisticsSummary
  isLoading: boolean
}

const getAffectedLabel = (count: number) => {
  if (count === 0) {
    return 'No instructions impacted'
  }

  return `${count.toLocaleString()} instruction${count === 1 ? '' : 's'} impacted`
}

export const InstructionStatsPanel = ({ summary, isLoading }: InstructionStatsPanelProps) => {
  const hasData = summary.totalInstructions > 0

  return (
    <Card
      bordered={false}
      title="Instruction statistics"
      className="stats-card"
      loading={isLoading}
      bodyStyle={{ paddingBottom: hasData ? 16 : undefined }}
    >
      {hasData ? (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={12} md={8} xl={4}>
              <Card size="small" bordered={false} className="stat-card">
                <Statistic title="Total instructions" value={summary.totalInstructions} />
                <Typography.Text type="secondary">
                  {summary.activeCategories.toLocaleString()} active categor{summary.activeCategories === 1 ? 'y' : 'ies'}
                </Typography.Text>
              </Card>
            </Col>
            <Col xs={12} md={8} xl={4}>
              <Card size="small" bordered={false} className="stat-card">
                <Statistic title="Unique actions" value={summary.uniqueActions} />
                <Typography.Text type="secondary">Distinct action codes observed</Typography.Text>
              </Card>
            </Col>
            <Col xs={12} md={8} xl={4}>
              <Card size="small" bordered={false} className="stat-card">
                <Statistic title="Average per day" value={summary.averagePerDay} precision={1} />
                <Typography.Text type="secondary">Across observed activity</Typography.Text>
              </Card>
            </Col>
            <Col xs={12} md={8} xl={4}>
              <Card size="small" bordered={false} className="stat-card">
                <Statistic
                  title="Peak day volume"
                  value={summary.peakDay?.count ?? 0}
                />
                <Typography.Text type="secondary">
                  {summary.peakDay ? summary.peakDay.fullLabel : 'No historical activity'}
                </Typography.Text>
              </Card>
            </Col>
            <Col xs={12} md={8} xl={4}>
              <Card size="small" bordered={false} className="stat-card">
                <Statistic title="Validation errors" value={summary.validation.errors} valueStyle={{ color: '#ff4d4f' }} />
                <Typography.Text type="secondary">
                  {getAffectedLabel(summary.validation.affected)}
                </Typography.Text>
              </Card>
            </Col>
            <Col xs={12} md={8} xl={4}>
              <Card size="small" bordered={false} className="stat-card">
                <Statistic title="Validation warnings" value={summary.validation.warnings} valueStyle={{ color: '#faad14' }} />
                <Typography.Text type="secondary">
                  {getAffectedLabel(summary.validation.affected)}
                </Typography.Text>
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <Empty description="Upload instruction logs to view statistics" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Card>
  )
}
