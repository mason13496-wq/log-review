import { useMemo } from 'react'
import {
  Alert,
  Card,
  Col,
  Empty,
  List,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { InstructionSummary } from '@/components/common/InstructionSummary'
import { LogUploadCard } from '@/components/common/LogUploadCard'
import {
  INSTRUCTION_CATEGORY_LABELS,
  INSTRUCTION_STATUS_COLORS,
  INSTRUCTION_STATUS_LABELS,
} from '@/constants/instructions'
import { useInstructionMetrics } from '@/hooks/useInstructionMetrics'
import { useInstructionStore } from '@/hooks/useInstructionStore'
import type { InstructionLogEntry } from '@/types/instruction'

const chartMargin = { top: 10, right: 0, left: -20, bottom: 0 }

const renderTooltipLabel = (label: unknown) => String(label ?? '')

export const InstructionReviewPage = () => {
  const metrics = useInstructionMetrics()
  const logs = useInstructionStore((state) => state.logs)
  const uploadStatus = useInstructionStore((state) => state.uploadStatus)
  const error = useInstructionStore((state) => state.error)

  const isProcessing = uploadStatus === 'reading' || uploadStatus === 'parsing'
  const hasUploadedFile = uploadStatus !== 'idle'
  const hasLogs = logs.length > 0

  const categoryChartData = useMemo(
    () =>
      metrics.map((metric) => ({
        name: INSTRUCTION_CATEGORY_LABELS[metric.category],
        count: metric.count,
      })),
    [metrics],
  )

  const openInstructions = useMemo(
    () =>
      logs
        .filter((log) => log.status !== 'approved')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [logs],
  )

  const recentActivity = useMemo(() => logs.slice(0, 5), [logs])

  const renderActivityListItem = (item: InstructionLogEntry) => (
    <List.Item key={item.id} className="activity-item">
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <Space align="center" split="•">
          <Typography.Text strong>{item.title}</Typography.Text>
          <Typography.Text type="secondary">
            {INSTRUCTION_CATEGORY_LABELS[item.category]}
          </Typography.Text>
        </Space>
        <Typography.Text type="secondary">
          Owner: {item.owner} • {new Date(item.createdAt).toLocaleString()}
        </Typography.Text>
        <Space wrap>
          {item.payload.steps.map((step) => (
            <Tag key={step}>{step}</Tag>
          ))}
        </Space>
        {item.payload.ownerNotes && (
          <Typography.Text type="secondary">{item.payload.ownerNotes}</Typography.Text>
        )}
        <Tag color={INSTRUCTION_STATUS_COLORS[item.status]}>
          {INSTRUCTION_STATUS_LABELS[item.status]}
        </Tag>
      </Space>
    </List.Item>
  )

  return (
    <Space direction="vertical" size="large" className="page-container">
      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
        Monitor instruction quality, compliance alignment, and review pace across the operations
        pipeline.
      </Typography.Paragraph>

      <LogUploadCard />

      {hasUploadedFile && <InstructionSummary metrics={metrics} />}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="Instruction throughput"
            bordered={false}
            className="chart-card"
            loading={isProcessing}
          >
            {hasLogs ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} margin={chartMargin}>
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                    <Tooltip
                      labelFormatter={renderTooltipLabel}
                      cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="var(--chart-bar-color)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty
                description={
                  hasUploadedFile
                    ? 'No instruction entries available in the uploaded file'
                    : 'Upload a log file to visualize instruction throughput'
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="Open instructions"
            bordered={false}
            className="list-card"
            loading={isProcessing}
          >
            {openInstructions.length === 0 ? (
              <Empty
                description={
                  hasUploadedFile
                    ? 'No open instructions in the parsed log'
                    : 'Upload a log file to review instructions'
                }
              />
            ) : (
              <List
                dataSource={openInstructions}
                renderItem={(item) => (
                  <List.Item key={item.id}>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Typography.Text strong>{item.title}</Typography.Text>
                      <Typography.Text type="secondary">
                        Owner: {item.owner} • {INSTRUCTION_STATUS_LABELS[item.status]}
                      </Typography.Text>
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Card
        title="Recent activity"
        bordered={false}
        className="list-card"
        loading={isProcessing}
      >
        {error && (
          <Alert
            type="error"
            showIcon
            message="Unable to process instruction activity"
            description={error}
            style={{ marginBottom: 16 }}
          />
        )}
        {recentActivity.length === 0 ? (
          <Empty
            description={
              hasUploadedFile
                ? 'No instructions available in the uploaded file'
                : 'Upload a log file to review instruction activity'
            }
          />
        ) : (
          <List dataSource={recentActivity} renderItem={renderActivityListItem} />
        )}
      </Card>
    </Space>
  )
}
