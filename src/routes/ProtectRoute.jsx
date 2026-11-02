import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Chặn trang cần đăng nhập. Chưa hỏi xong backend (F5) thì chờ, không đá về /login người đang đăng nhập.
 * Chưa đăng nhập: sang /login kèm from, đăng nhập xong useLogin đưa về đúng trang đang mở.
 */
export default function ProtectRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div role="status" className="flex min-h-dvh items-center justify-center bg-canvas text-body-sm text-fg-muted">
        <span aria-hidden="true" className="mr-3 size-5 animate-spin rounded-full border-2 border-line border-t-action" />
        Đang kiểm tra đăng nhập...
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  return <Outlet />
}
