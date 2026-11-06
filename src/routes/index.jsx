import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AuthLayout from '../layout/AuthLayout'
import DashboardLayout from '../layout/DashboardLayout'
import PublicLayout from '../layout/PublicLayout'
import { DASHBOARD_NAV, DASHBOARD_ROLES } from '../lib/roles'
import DashboardHome from '../pages/dashboard/DashboardHome'
import DashboardPlaceholder from '../pages/dashboard/DashboardPlaceholder'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import EventsPage from '../pages/EventsPage'
import FaqPage from '../pages/FaqPage'
import HowToBuyPage from '../pages/HowToBuyPage'
import ProfilePage from '../pages/ProfilePage'
import RegisterPage from '../pages/RegisterPage'
import VerifyEmailPage from '../pages/VerifyEmailPage'
import ProtectRole from './ProtectRole'
import ProtectRoute from './ProtectRoute'

// Trang quản lý chỉ admin dùng: tải khi mở, khách không phải tải. Suspense chờ tải nằm ở DashboardLayout
const DashboardEvents = lazy(() => import('../pages/dashboard/DashboardEvents'))
const DashboardEventForm = lazy(() => import('../pages/dashboard/DashboardEventForm'))
const DashboardEventDetail = lazy(() => import('../pages/dashboard/DashboardEventDetail'))
const DashboardEventTiers = lazy(() => import('../pages/dashboard/DashboardEventTiers'))
const DashboardStaff = lazy(() => import('../pages/dashboard/DashboardStaff'))
const DashboardStaffForm = lazy(() => import('../pages/dashboard/DashboardStaffForm'))
// Suspense chờ tải nằm ở PublicLayout
const EventDetailPage = lazy(() => import('../pages/EventDetailPage'))

// Mục dashboard đã có trang thật: [đường dẫn con, trang], '' là trang chính của mục. Mục chưa có ở đây hiện trang "Sắp có"
const DASHBOARD_PAGES = {
  events: [
    ['', DashboardEvents],
    ['new', DashboardEventForm],
    [':id', DashboardEventDetail],
    [':id/edit', DashboardEventForm],
    [':id/tiers', DashboardEventTiers],
  ],
  staff: [
    ['', DashboardStaff],
    ['new', DashboardStaffForm],
    [':id', DashboardStaffForm],
  ],
}

export default function AppRoute() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {/* Trang công khai, không cần đăng nhập: chung header và footer */}
      <Route element={<PublicLayout />}>
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/how-to-buy" element={<HowToBuyPage />} />
        <Route path="/faq" element={<FaqPage />} />
      </Route>
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
            {DASHBOARD_NAV.map((item) => {
              const pages = DASHBOARD_PAGES[item.path]
              return (
                <Route key={item.path} element={<ProtectRole roles={item.roles} redirectTo="/dashboard" />}>
                  {pages ? (
                    pages.map(([sub, Page]) => <Route key={sub} path={sub ? `${item.path}/${sub}` : item.path} element={<Page />} />)
                  ) : (
                    <Route path={item.path} element={<DashboardPlaceholder item={item} />} />
                  )}
                </Route>
              )
            })}
          </Route>
        </Route>
      </Route>

      {/* Đường dẫn không tồn tại: đưa về trang chủ thay vì để trang trắng */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
