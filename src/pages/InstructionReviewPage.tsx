import { useMemo } from 'react'
import { Col, Row, Space, Typography } from 'antd'

import { InstructionStatsPanel } from '@/components/dashboard/InstructionStatsPanel'
import { InstructionTimelineChart } from '@/components/dashboard/InstructionTimelineChart'
import { InstructionTypeDistributionChart } from '@/components/dashboard/InstructionTypeDistributionChart'
import { TopInstructionActionsCard } from '@/components/dashboard/TopInstructionActionsCard'
import { InstructionSummary } from '@/components/common/InstructionSummary'
import { InstructionValidationReportCard } from '@/components/common/InstructionValidationReportCard'
import { LogUploadCard } from '@/components/common/LogUploadCard'
import { InstructionBrowser } from '@/components/instructions'
import { useInstructionAnalytics } from '@/hooks/useInstructionAnalytics'
import { useInstructionMetrics } from '@/hooks/useInstructionMetrics'
import { useInstructionStore } from '@/hooks/useInstructionStore'
import type { InstructionValidationLookup } from '@/types/instruction'

export const InstructionReviewPage = () => {
  const metrics = useInstructionMetrics()
  const analytics = useInstructionAnalytics()
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

  return (
    <Space direction="vertical" size="large" className="page-container">
      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
        Monitor instruction quality, compliance alignment, and review pace across the operations pipeline.
      </Typography.Paragraph>

      <LogUploadCard />

      {hasUploadedFile && (
        <>
          <InstructionSummary metrics={metrics} />
          <InstructionStatsPanel summary={analytics.summary} isLoading={isProcessing} />

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <InstructionTimelineChart data={analytics.timeline} isLoading={isProcessing} />
            </Col>
            <Col xs={24} lg={10}>
              <InstructionTypeDistributionChart data={analytics.typeDistribution} isLoading={isProcessing} />
            </Col>
          </Row>

          <TopInstructionActionsCard actions={analytics.topActions} isLoading={isProcessing} />

          <InstructionValidationReportCard report={validationReport ?? null} isLoading={isProcessing} />
        </>
      )}

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
