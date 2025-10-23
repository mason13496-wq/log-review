import { useMemo } from 'react'
import { Card, Col, Empty, Row, Space, Typography } from 'antd'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { InstructionBrowser } from '@/components/instructions'
import { InstructionSummary } from '@/components/common/InstructionSummary'
import { InstructionValidationReportCard } from '@/components/common/InstructionValidationReportCard'
import { LogUploadCard } from '@/components/common/LogUploadCard'
import { INSTRUCTION_CATEGORY_LABELS } from '@/constants/instructions'
import { useInstructionMetrics } from '@/hooks/useInstructionMetrics'
import { useInstructionStore } from '@/hooks/useInstructionStore'
import type { InstructionValidationLookup } from '@/types/instruction'

const chartMargin = { top: 10, right: 0, left: -20, bottom: 0 }

const renderTooltipLabel = (label: unknown) => String(label ?? '')

export const InstructionReviewPage = () => {
  const metrics = useInstructionMetrics()
  const logs = useInstructionStore((state) => state.logs)
  const validationReport = useInstructionStore((state) => state.validationReport)
  const uploadStatus = useInstructionStore((state) => state.uploadStatus)
  const error = useInstructionStore((state) => state.error)

  const validationLookup = useMemo<InstructionValidationLookup | undefined>(() => {
    if (!validationReport) {
      return undefined
    }

    return validationReport.results.reduce<InstructionValidationLookup>((accumulator, result) => {
      accumulator[result.instructionId] = result
      return accumulator
    }, {})
  }, [validationReport])

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

  return (
    <Space direction="vertical" size="large" className="page-container">
      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
        Monitor instruction quality, compliance alignment, and review pace across the operations
        pipeline.
      </Typography.Paragraph>

      <LogUploadCard />

      {hasUploadedFile && <InstructionSummary metrics={metrics} />}

      {hasUploadedFile && (
        <InstructionValidationReportCard report={validationReport ?? null} isLoading={isProcessing} />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24}>
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
      </Row>

      <InstructionBrowser
        instructions={logs}
        isLoading={isProcessing}
        hasUploadedFile={hasUploadedFile}
        error={error}
        validationLookup={validationLookup}
      />
    </Space>
  )
}
