import { refresh } from './authApi'

// Nhiều request cùng gặp 401 thì chỉ gọi refresh một lần, các request kia chờ chung
let refreshPromise = null

/**
 * fetch kèm access token cho API cần đăng nhập. Gặp 401 thì refresh rồi gọi lại đúng request đó.
 * Trả về Response như fetch thường, nơi gọi tự đọc json và kiểm tra res.ok.
 */
export function createFetchWithAuth(accessToken, setAccessToken) {
  return async (url, options = {}) => {
    const withToken = (token) => ({ ...options, headers: { ...options.headers, Authorization: `Bearer ${token}` } })

    const res = await fetch(url, withToken(accessToken))
    if (res.status !== 401) return res

    try {
      refreshPromise ??= refresh()
        .then((data) => {
          setAccessToken(data.accessToken)
          return data.accessToken
        })
        .finally(() => {
          refreshPromise = null
        })

      const newToken = await refreshPromise
      return await fetch(url, withToken(newToken))
    } catch (err) {
      setAccessToken(null)
      throw err
    }
  }
}
