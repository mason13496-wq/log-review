import { theme } from 'antd'
import type { ThemeConfig } from 'antd'

export const appTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#1677ff',
    colorBgLayout: '#f5f6fa',
    borderRadius: 8,
    fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#001529',
    },
    Card: {
      borderRadiusLG: 12,
    },
  },
}
