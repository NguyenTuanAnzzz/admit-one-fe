import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { DASHBOARD_NAV, ROLE } from '../../lib/roles'

/** Trang đầu /dashboard: lời chào và lối vào từng mục mà role này được dùng. */
export default function DashboardHome() {
  const { user } = useAuth()
  const items = DASHBOARD_NAV.filter((item) => item.roles.includes(user.role))

  useEffect(() => {
    const previous = document.title
    document.title = 'Dashboard · Admit One'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-heading font-bold text-title">Chào {user.name}</h1>
      <p className="mt-2 text-body-sm text-fg-muted">
        {user.role === ROLE.ADMIN
          ? 'Quản lý sự kiện, đơn hàng, nhân viên và theo dõi doanh thu.'
          : 'Soát vé tại cửa cho các sự kiện bạn được gán.'}
      </p>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className="flex h-full flex-col rounded-card border border-card-line bg-card p-card hover:border-card-line-hover hover:shadow-card-hover"
            >
              <span className="text-subheading font-bold text-title">{item.label}</span>
              <span className="mt-1 text-body-sm text-fg-muted">{item.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
