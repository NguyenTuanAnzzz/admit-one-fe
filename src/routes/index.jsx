import { Navigate, Route, Routes } from 'react-router-dom'
import AuthLayout from '../layout/AuthLayout'
import DashboardLayout from '../layout/DashboardLayout'
import { DASHBOARD_NAV, DASHBOARD_ROLES } from '../lib/roles'
import DashboardHome from '../pages/dashboard/DashboardHome'
import DashboardPlaceholder from '../pages/dashboard/DashboardPlaceholder'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import ProfilePage from '../pages/ProfilePage'
import RegisterPage from '../pages/RegisterPage'
import VerifyEmailPage from '../pages/VerifyEmailPage'
import ProtectRole from './ProtectRole'
import ProtectRoute from './ProtectRoute'

export default function AppRoute() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Route>

      {/* Cần đăng nhập */}
      <Route element={<ProtectRoute />}>
        <Route path="/profile" element={<ProfilePage />} />

        {/* Admin và Staff vào chung /dashboard, mỗi trang con tự giới hạn role theo DASHBOARD_NAV */}
        <Route element={<ProtectRole roles={DASHBOARD_ROLES} />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            {DASHBOARD_NAV.map((item) => (
              <Route key={item.path} element={<ProtectRole roles={item.roles} redirectTo="/dashboard" />}>
                <Route path={item.path} element={<DashboardPlaceholder item={item} />} />
              </Route>
            ))}
          </Route>
        </Route>
      </Route>

      {/* Đường dẫn không tồn tại: đưa về trang chủ thay vì để trang trắng */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
