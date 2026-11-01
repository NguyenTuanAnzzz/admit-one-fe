import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { logout as logoutApi, refresh } from '../api/authApi'
import { createFetchWithAuth } from '../api/fetchWithAuth'
import { getMe } from '../api/userApi'

const AuthContext = createContext(null)

// Tên Việt đặt họ trước nên lấy chữ đầu của hai từ cuối: "Nguyễn Tuấn An" → "TA"
function initialsOf(fullName) {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

/**
 * Access token giữ trong state (bộ nhớ), refresh token nằm trong cookie httpOnly.
 * Mở app hoặc F5: gọi refresh bằng cookie để lấy lại access token; không có cookie thì là khách.
 * loading = true tới khi hỏi xong, để không nháy nút "Đăng nhập" với người đang đăng nhập.
 */
export function AuthProvider({ children }) {
  const [accessToken, setToken] = useState(null)
  const [refreshing, setRefreshing] = useState(true)
  // Kết quả /me: undefined = chưa hỏi xong, null = hỏi lỗi
  const [me, setMe] = useState(undefined)

  // Mất token (đăng xuất, refresh hỏng) thì quên luôn user cũ, lần đăng nhập sau hỏi lại /me từ đầu
  const setAccessToken = useCallback((token) => {
    if (!token) setMe(undefined)
    setToken(token)
  }, [])

  const user = accessToken ? (me ?? null) : null
  const loading = refreshing || (accessToken !== null && me === undefined)

  const fetchWithAuth = useMemo(() => createFetchWithAuth(accessToken, setAccessToken), [accessToken, setAccessToken])

  // Có access token thì hỏi backend người đang đăng nhập là ai. Token đổi do refresh thì user cũ vẫn hiện trong lúc hỏi lại.
  useEffect(() => {
    if (!accessToken) return
    getMe(fetchWithAuth)
      .then((data) => setMe({ ...data, name: data.fullName, initials: initialsOf(data.fullName) }))
      .catch(() => setMe(null))
  }, [accessToken, fetchWithAuth])

  useEffect(() => {
    refresh()
      .then((data) => setAccessToken(data.accessToken))
      .catch(() => setAccessToken(null))
      .finally(() => setRefreshing(false))
  }, [setAccessToken])

  // Backend xoá cookie refreshToken. Gọi API lỗi (mất mạng) thì vẫn đăng xuất ở FE
  const logout = () => {
    logoutApi()
      .catch(() => {})
      .finally(() => setAccessToken(null))
  }

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
