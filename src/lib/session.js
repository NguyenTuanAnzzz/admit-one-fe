// Access token lưu trong localStorage để F5 vẫn còn đăng nhập. Refresh token nằm trong cookie httpOnly do backend đặt, JS không đọc được.
const TOKEN_KEY = 'admit-one.accessToken'

function readPayload(token) {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

export function saveAccessToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Trình duyệt chặn bộ nhớ (tab ẩn danh...): vẫn đăng nhập được, chỉ mất khi F5
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // bỏ qua, không có gì để xoá
  }
}

/** Token còn hạn, hoặc null. Token hết hạn thì xoá luôn. */
export function getAccessToken() {
  let token
  try {
    token = localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
  const payload = token && readPayload(token)
  if (!payload || payload.exp * 1000 <= Date.now()) {
    if (token) clearSession()
    return null
  }
  return token
}

/** Người đang đăng nhập cho header. Token chỉ có email (sub) nên tạm hiện email thay cho họ tên. */
export function getSessionUser() {
  const token = getAccessToken()
  if (!token) return null
  const email = readPayload(token).sub
  return { email, name: email, initials: email.slice(0, 2).toUpperCase() }
}
