import { Navigate, Route, Routes } from 'react-router-dom'
import AuthLayout from '../layout/AuthLayout'
import HomePage from '../pages/HomePage'
import RegisterPage from '../pages/RegisterPage'
import VerifyEmailPage from '../pages/VerifyEmailPage'

export default function AppRoute() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route element={<AuthLayout />}>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Route>
      {/* Đường dẫn không tồn tại: đưa về trang chủ thay vì để trang trắng */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
