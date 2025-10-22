import { InboxOutlined } from '@ant-design/icons'
import {
  Alert,
  Card,
  Descriptions,
  List,
  Progress,
  Space,
  Typography,
  Upload,
} from 'antd'
import type { UploadProps } from 'antd'
import { useCallback, useMemo } from 'react'

import { useInstructionStore, type UploadStatus } from '@/hooks/useInstructionStore'
import type { InstructionLogParseError } from '@/types/instruction'

const { Dragger } = Upload

const statusLabels: Record<UploadStatus, string> = {
  idle: 'Awaiting file upload',
  reading: 'Reading log file',
  parsing: 'Parsing instruction entries',
  complete: 'Upload complete',
  error: 'Upload encountered an issue',
}

const getProgressStatus = (status: UploadStatus): 'normal' | 'active' | 'exception' | 'success' => {
  if (status === 'error') {
    return 'exception'
  }

  if (status === 'complete') {
    return 'success'
  }

  return 'active'
}

const formatBytes = (size: number): string => {
  if (size === 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  const power = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1)
  const value = size / 1024 ** power

  return `${value.toFixed(power === 0 ? 0 : 1)} ${units[power]}`
}

const formatTimestamp = (timestamp?: number): string => {
  if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
    return '—'
  }

  return new Date(timestamp).toLocaleString()
}

const renderParseError = (error: InstructionLogParseError) => (
  <List.Item key={`${error.line}-${error.message}`}>
    <Space direction="vertical" size={0} style={{ width: '100%' }}>
      <Typography.Text strong>Line {error.line}</Typography.Text>
      <Typography.Text type="secondary">{error.message}</Typography.Text>
      {error.raw && (
        <Typography.Text code ellipsis>
          {error.raw}
        </Typography.Text>
      )}
    </Space>
  </List.Item>
)

export const LogUploadCard = () => {
  const processLogFile = useInstructionStore((state) => state.processLogFile)
  const uploadStatus = useInstructionStore((state) => state.uploadStatus)
  const uploadProgress = useInstructionStore((state) => state.uploadProgress)
  const fileMetadata = useInstructionStore((state) => state.fileMetadata)
  const parseErrors = useInstructionStore((state) => state.parseErrors)
  const error = useInstructionStore((state) => state.error)

  const handleBeforeUpload = useCallback<UploadProps['beforeUpload']>(
    (file) => {
      void processLogFile(file)
      return false
    },
    [processLogFile],
  )

  const isProcessing = uploadStatus === 'reading' || uploadStatus === 'parsing'
  const progressStatus = getProgressStatus(uploadStatus)
  const parseErrorSummary = useMemo(() => {
    if (parseErrors.length === 0) {
      return null
    }

    const MAX_ERRORS = 5
    const truncated = parseErrors.slice(0, MAX_ERRORS)
    const remaining = parseErrors.length - truncated.length

    return (
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Typography.Text strong>Parsing issues</Typography.Text>
        <Typography.Text type="secondary">
          {remaining > 0
            ? `Displaying ${truncated.length} of ${parseErrors.length} parsing errors`
            : 'The following entries could not be processed'}
        </Typography.Text>
        <List size="small" bordered dataSource={truncated} renderItem={renderParseError} />
      </Space>
    )
  }, [parseErrors])

  return (
    <Card title="Upload instruction logs" bordered={false} className="upload-card">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Dragger
          multiple={false}
          accept=".log"
          beforeUpload={handleBeforeUpload}
          showUploadList={false}
          disabled={isProcessing}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <Typography.Paragraph strong style={{ marginBottom: 0 }}>
            Drag & drop instruction log files here, or click to browse
          </Typography.Paragraph>
          <Typography.Text type="secondary">
            Only .log files in JSON Lines format are supported
          </Typography.Text>
        </Dragger>

        {uploadStatus !== 'idle' && (
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Typography.Text type="secondary">{statusLabels[uploadStatus]}</Typography.Text>
            <Progress
              percent={uploadProgress}
              status={progressStatus}
              showInfo
              strokeColor={uploadStatus === 'complete' ? undefined : 'var(--chart-bar-color)'}
            />
          </Space>
        )}

        {fileMetadata && (
          <Descriptions
            title="Uploaded file details"
            bordered
            size="small"
            column={{ xs: 1, sm: 2, md: 3 }}
          >
            <Descriptions.Item label="File name">{fileMetadata.name}</Descriptions.Item>
            <Descriptions.Item label="File size">
              {formatBytes(fileMetadata.size)}
            </Descriptions.Item>
            <Descriptions.Item label="Instructions parsed">
              {fileMetadata.instructionCount}
            </Descriptions.Item>
            <Descriptions.Item label="Last modified">
              {formatTimestamp(fileMetadata.lastModified)}
            </Descriptions.Item>
          </Descriptions>
        )}

        {error && (
          <Alert
            type="error"
            showIcon
            message="Unable to process instruction log file"
            description={error}
          />
        )}

        {parseErrorSummary && (
          <Alert
            type="warning"
            showIcon
            message="Some log entries could not be parsed"
            description={parseErrorSummary}
          />
        )}
      </Space>
    </Card>
  )
}
