import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Chỉ cho role trong roles đi tiếp, đặt bên trong ProtectRoute nên user chắc chắn đã có.
 * Đây chỉ là ẩn trang ở FE: backend vẫn phải chặn API theo role (hasRole trong SecurityConfig).
 */
export default function ProtectRole({ roles, redirectTo = '/' }) {
  const { user } = useAuth()

  if (!roles.includes(user.role)) return <Navigate to={redirectTo} replace />

  return <Outlet />
}
