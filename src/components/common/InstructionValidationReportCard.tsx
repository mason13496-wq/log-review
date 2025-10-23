import { DownloadOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  List,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd'
import { useCallback, useMemo } from 'react'

import { INSTRUCTION_CATEGORY_LABELS } from '@/constants/instructions'
import type {
  InstructionValidationReport,
  InstructionValidationResult,
} from '@/types/instruction'
import { InstructionValidationIssueList } from '@/components/instructions/InstructionValidationIssueList'
import { getValidationSeverity, renderValidationTags } from '@/components/instructions/validationHelpers'

interface InstructionValidationReportCardProps {
  report: InstructionValidationReport | null
  isLoading: boolean
}

const MAX_RESULTS = 5

const getSeverityLabel = (result: InstructionValidationResult): string => {
  const severity = getValidationSeverity(result)

  if (severity === 'error') {
    return 'Contains blocking errors'
  }

  if (severity === 'warning') {
    return 'Contains warnings'
  }

  return 'No issues detected'
}

export const InstructionValidationReportCard = ({
  report,
  isLoading,
}: InstructionValidationReportCardProps) => {
  const totals = report?.totals ?? {
    instructionCount: 0,
    affectedCount: 0,
    errorCount: 0,
    warningCount: 0,
  }

  const hasReport = Boolean(report)
  const hasInstructions = totals.instructionCount > 0
  const hasIssues = totals.errorCount > 0 || totals.warningCount > 0

  const affectedResults = useMemo(
    () =>
      report?.results.filter((result) => result.errorCount > 0 || result.warningCount > 0) ?? [],
    [report],
  )

  const displayedResults = affectedResults.slice(0, MAX_RESULTS)
  const remainingResults = affectedResults.length - displayedResults.length

  const handleDownload = useCallback(() => {
    if (!report) {
      return
    }

    const fileNameTimestamp = report.generatedAt
      ? report.generatedAt.replace(/[:]/g, '-').replace(/\..*/, '')
      : new Date().toISOString().replace(/[:]/g, '-').replace(/\..*/, '')
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `instruction-validation-${fileNameTimestamp}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [report])

  const generatedAtLabel = useMemo(() => {
    if (!report) {
      return ''
    }

    return new Date(report.generatedAt).toLocaleString()
  }, [report])

  return (
    <Card
      bordered={false}
      title="Validation report"
      className="validation-report-card"
      loading={isLoading}
      extra={
        hasReport && (
          <Button icon={<DownloadOutlined />} onClick={handleDownload} disabled={!hasInstructions}>
            Download report
          </Button>
        )
      }
    >
      {!hasReport ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Validation results will appear once instructions are parsed."
        />
      ) : !hasInstructions ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No instructions were available for validation."
        />
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Instructions evaluated"
                value={totals.instructionCount}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic title="Instructions with issues" value={totals.affectedCount} />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic title="Errors" value={totals.errorCount} valueStyle={{ color: '#ff4d4f' }} />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic title="Warnings" value={totals.warningCount} valueStyle={{ color: '#faad14' }} />
            </Col>
          </Row>

          <Space direction="vertical" size={4}>
            <Typography.Text type="secondary">
              Report generated {generatedAtLabel}
            </Typography.Text>
            {!hasIssues && (
              <Typography.Text type="secondary">
                Validation run did not detect any blocking errors or warnings.
              </Typography.Text>
            )}
          </Space>

          {hasIssues ? (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {report?.categorySummaries.some((summary) => summary.affectedCount > 0) && (
                <Row gutter={[16, 16]}>
                  {report?.categorySummaries.map((summary) => {
                    if (summary.affectedCount === 0) {
                      return null
                    }

                    const categoryLabel = INSTRUCTION_CATEGORY_LABELS[summary.category]

                    return (
                      <Col xs={24} sm={12} md={6} key={`category-${summary.category}`}>
                        <Card size="small" className="validation-category-card">
                          <Space direction="vertical" size={4} style={{ width: '100%' }}>
                            <Typography.Text strong>{categoryLabel}</Typography.Text>
                            <Space size={8} wrap>
                              <Tag color="red">{summary.errorCount} error{summary.errorCount === 1 ? '' : 's'}</Tag>
                              <Tag color="orange">{summary.warningCount} warning{summary.warningCount === 1 ? '' : 's'}</Tag>
                            </Space>
                            <Typography.Text type="secondary">
                              {summary.affectedCount} of {summary.instructionCount} instruction
                              {summary.instructionCount === 1 ? '' : 's'} impacted
                            </Typography.Text>
                          </Space>
                        </Card>
                      </Col>
                    )
                  })}
                </Row>
              )}

              <List
                header={
                  <Typography.Text strong>Instructions with validation issues</Typography.Text>
                }
                dataSource={displayedResults}
                locale={{ emptyText: 'No validation issues detected.' }}
                split={false}
                renderItem={(result) => {
                  const validationTags = renderValidationTags(result)
                  const severityType = result.errorCount > 0 ? 'danger' : 'warning'

                  return (
                    <List.Item key={result.instructionId} className="validation-report-item">
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Space align="baseline" wrap>
                          <Typography.Text strong>{result.title}</Typography.Text>
                          <Typography.Text type="secondary" code>
                            {result.actionCode}
                          </Typography.Text>
                          <Typography.Text type={severityType}>
                            {getSeverityLabel(result)}
                          </Typography.Text>
                        </Space>

                        {validationTags && (
                          <Space size={[8, 8]} wrap>
                            {validationTags}
                          </Space>
                        )}

                        <InstructionValidationIssueList validation={result} maxItems={3} />
                      </Space>
                    </List.Item>
                  )
                }}
              />

              {remainingResults > 0 && (
                <Typography.Text type="secondary">
                  {remainingResults} additional instruction
                  {remainingResults === 1 ? '' : 's'} with issues not shown in this summary.
                </Typography.Text>
              )}
            </Space>
          ) : (
            <Alert
              type="success"
              showIcon
              message="All instruction sequences passed validation"
              description="Start/end pairing, time ordering, and required field checks were satisfied for every instruction."
            />
          )}
        </Space>
      )}
    </Card>
  )
}
