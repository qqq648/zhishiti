import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class ErrorBoundary extends React.Component<{ children?: React.ReactNode }, { hasError: boolean; msg?: string }> {
  constructor(props: { children?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, msg: undefined }
  }
  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, msg: String(error instanceof Error ? error.message : error) }
  }
  componentDidCatch(error: unknown) {
    console.error('runtime_error', error)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#1f1f1f', background: '#ffffff' }}>
          <div style={{ border: '1px solid #e0e0e0', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 16, marginBottom: 8 }}>页面发生错误</div>
            <div style={{ fontSize: 12, color: '#5f6368' }}>{this.state.msg || ''}</div>
          </div>
        </div>
      )
    }
    return this.props.children as React.ReactElement
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
