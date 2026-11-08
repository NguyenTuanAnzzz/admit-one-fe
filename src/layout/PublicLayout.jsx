import { Suspense } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion'
import { SiteFooter } from '../components/SiteFooter'
import { SiteHeader } from '../components/SiteHeader'
import { useAuth } from '../context/AuthContext'

/**
 * Khung chung cho các trang công khai ngoài trang chủ (Cách mua vé, Hỏi đáp): header, nội dung, footer.
 * Tìm ở header thì về trang chủ (#events) kèm từ khoá, trang chủ lọc danh sách sự kiện mẫu theo từ khoá đó.
 * LazyMotion bọc ngoài vì nút, ô nhập dùng m.* của Framer Motion.
 */
export default function PublicLayout() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className="flex min-h-screen flex-col bg-canvas text-fg">
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-pill focus:bg-title focus:px-4 focus:py-2 focus:text-fg-inverse">
            Bỏ qua tới nội dung
          </a>
          <SiteHeader
            user={user}
            authReady={!loading}
            linkBase="/"
            onLogin={() => navigate('/login')}
            onLogout={logout}
            onSearch={(q) => navigate('/#events', { state: { q } })}
          />
          <div className="flex-1">
            {/* Trang tải khi cần (React.lazy) hiện dòng chờ này trong lúc tải */}
            <Suspense fallback={<p role="status" className="mx-auto max-w-page px-gutter py-section-sm text-body-sm text-fg-muted">Đang tải trang...</p>}>
              <Outlet />
            </Suspense>
          </div>
          <SiteFooter />
        </div>
      </MotionConfig>
    </LazyMotion>
  )
}
