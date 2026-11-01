import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { refresh } from '../api/authApi'
import { createFetchWithAuth } from '../api/fetchWithAuth'

const AuthContext = createContext(null)

// TODO: backend chưa có GET /me nên tạm lấy email từ access token (JWT, phần sub). Có /me thì gọi API lấy họ tên.
function userFromToken(token) {
  try {
    const { sub } = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return { email: sub, name: sub, initials: sub.slice(0, 2).toUpperCase() }
  } catch {
    return null
  }
}

/**
 * Access token giữ trong state (bộ nhớ), refresh token nằm trong cookie httpOnly.
 * Mở app hoặc F5: gọi refresh bằng cookie để lấy lại access token; không có cookie thì là khách.
 * loading = true tới khi hỏi xong, để không nháy nút "Đăng nhập" với người đang đăng nhập.
 */
export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null)
  const [loading, setLoading] = useState(true)

  const user = useMemo(() => (accessToken ? userFromToken(accessToken) : null), [accessToken])
  const fetchWithAuth = useMemo(() => createFetchWithAuth(accessToken, setAccessToken), [accessToken])

  useEffect(() => {
    refresh()
      .then((data) => setAccessToken(data.accessToken))
      .catch(() => setAccessToken(null))
      .finally(() => setLoading(false))
  }, [])

  // TODO: gọi API đăng xuất khi backend có. Chưa xoá cookie refreshToken thì F5 sẽ tự đăng nhập lại
  const logout = () => setAccessToken(null)

  return (
    <AuthContext value={{ accessToken, setAccessToken, user, loading, fetchWithAuth, logout }}>
      {children}
    </AuthContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
