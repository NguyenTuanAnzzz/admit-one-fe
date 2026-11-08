import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import AppRoute from './routes'
import { AuthProvider } from './context/AuthContext'
import { ConfirmProvider } from './context/ConfirmContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        {/* Hộp xác nhận dùng chung cả app: useConfirm() thay cho window.confirm */}
        <ConfirmProvider>
          <AppRoute />
        </ConfirmProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
