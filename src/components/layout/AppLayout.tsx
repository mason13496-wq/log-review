import { FileSearchOutlined, SettingOutlined } from '@ant-design/icons'
import { Layout, Menu, Space, Typography } from 'antd'
import type { MenuProps } from 'antd'
import type { ReactNode } from 'react'

const { Header, Sider, Content } = Layout

interface AppLayoutProps {
  children: ReactNode
}

const menuItems: MenuProps['items'] = [
  {
    key: 'review',
    icon: <FileSearchOutlined />,
    label: 'Instruction Review',
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: 'Settings',
    disabled: true,
  },
]

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <Layout className="app-layout">
      <Sider breakpoint="lg" collapsedWidth={0} className="app-sider">
        <div className="app-logo">
          <Typography.Title level={5}>Log Instruction Review</Typography.Title>
          <Typography.Text type="secondary">Operations Console</Typography.Text>
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={['review']} items={menuItems} />
      </Sider>
      <Layout>
        <Header className="app-header">
          <Space direction="vertical" size={0}>
            <Typography.Text type="secondary">Dashboard</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0 }}>
              Instruction Log Overview
            </Typography.Title>
          </Space>
        </Header>
        <Content className="app-content">{children}</Content>
      </Layout>
    </Layout>
  )
}
