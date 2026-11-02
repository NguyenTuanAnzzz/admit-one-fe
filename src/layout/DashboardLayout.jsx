import { Link, NavLink, Outlet } from 'react-router-dom'
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion'
import { HeaderLogo } from '../components/HeaderLogo'
import { useAuth } from '../context/AuthContext'
import { DASHBOARD_NAV, ROLE_LABEL } from '../lib/roles'

const sideLink = ({ isActive }) =>
  `flex min-h-11 items-center rounded-nav px-3 text-body-sm font-semibold ${
    isActive ? 'bg-chip-active text-chip-active-fg' : 'text-fg-muted hover:bg-surface-sunken hover:text-title'
  }`

const topLink = 'inline-flex min-h-11 items-center rounded-nav px-3 text-body-sm font-medium text-fg-muted hover:bg-surface-sunken hover:text-title'

/**
 * Khung dashboard cho Admin và Staff: thanh trên (logo, vai trò, tài khoản), menu bên trái, nội dung ở giữa.
 * Menu lọc theo role từ DASHBOARD_NAV, Staff chỉ thấy Check-in. Dưới md menu chuyển thành hàng nút dưới thanh trên.
 */
export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const items = DASHBOARD_NAV.filter((item) => item.roles.includes(user.role))

  const nav = (
    <ul className="flex flex-wrap gap-1 md:flex-col">
      <li>
        <NavLink to="/dashboard" end className={sideLink}>
          Bắt đầu
        </NavLink>
      </li>
      {items.map((item) => (
        <li key={item.path}>
          <NavLink to={item.path} className={sideLink}>
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  )

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className="flex min-h-dvh flex-col bg-canvas text-fg">
          <header className="sticky top-0 z-40 border-b border-line bg-surface">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-gutter py-3">
              <HeaderLogo href={import.meta.env.BASE_URL} label="Admit One, về trang chủ" />
              <span className="rounded-badge border border-badge-line bg-badge px-2.5 py-1 text-caption font-semibold text-badge-fg">
                {ROLE_LABEL[user.role]}
              </span>
              <div className="ml-auto flex items-center gap-1">
                <Link to="/profile" aria-label={`Trang cá nhân của ${user.name}`} className="inline-flex min-h-11 items-center gap-2 rounded-nav px-1 text-title hover:bg-surface-sunken sm:pr-3">
                  <span aria-hidden="true" className="inline-flex size-9 items-center justify-center rounded-full bg-avatar text-body-sm font-bold text-avatar-fg">
                    {user.initials}
                  </span>
                  <span aria-hidden="true" className="hidden text-body-sm font-semibold sm:inline">{user.name}</span>
                </Link>
                <button type="button" onClick={logout} className={topLink}>
                  Đăng xuất
                </button>
              </div>
            </div>
            <nav aria-label="Menu dashboard" className="border-t border-line px-gutter py-2 md:hidden">
              {nav}
            </nav>
          </header>

          <div className="flex flex-1">
            <aside className="hidden w-60 shrink-0 border-r border-line bg-surface md:block">
              <nav aria-label="Menu dashboard" className="sticky top-[69px] p-3">
                {nav}
                <div className="mt-4 border-t border-line pt-3">
                  <Link to="/" className={topLink}>
                    ← Về trang chủ
                  </Link>
                </div>
              </nav>
            </aside>
            <main id="main-content" className="min-w-0 flex-1 px-gutter py-8 md:px-10">
              <Outlet />
            </main>
          </div>
        </div>
      </MotionConfig>
    </LazyMotion>
  )
}
