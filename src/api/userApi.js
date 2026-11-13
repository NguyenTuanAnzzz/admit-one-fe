// Đổi địa chỉ backend trong file .env (VITE_API_URL), đã gồm /api ở cuối
import { fromSpringPage } from '../lib/springPage'

const API_URL = import.meta.env.VITE_API_URL

/**
 * Quản lý người dùng (admin): cả 3 role ADMIN, STAFF, CUSTOMER. Mọi API cần quyền ADMIN.
 * User = { id, fullName, email, phone, role, createdAt }
 */
async function send(fetchWithAuth, url, options, fallbackMessage) {
  let res
  try {
    res = await fetchWithAuth(url, options)
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message ?? fallbackMessage)
  return data
}

const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

// Thông tin tài khoản của người đang đăng nhập (trang cá nhân)
export function getMe(fetchWithAuth) {
  return send(fetchWithAuth, `${API_URL}/users/me`, undefined, 'Không lấy được thông tin tài khoản.')
}

// Sửa họ tên, số điện thoại của người đang đăng nhập. Backend trả về MeResponse mới để cập nhật lại user
export function updateMe(fetchWithAuth, { fullName, phone }) {
  return send(fetchWithAuth, `${API_URL}/users/me`, json('PUT', { fullName, phone: phone || null }), 'Cập nhật chưa thành công. Vui lòng thử lại.')
}

// Một trang người dùng. params: { role, q, page, size }, rỗng thì không gửi (role rỗng = cả 3 role)
export async function getUserPage(fetchWithAuth, params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value)
  })

  let res
  try {
    res = await fetchWithAuth(`${API_URL}/users?${query}`)
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message ?? 'Không tải được danh sách người dùng.')
  return fromSpringPage(data)
}

export function getUser(fetchWithAuth, id) {
  return send(fetchWithAuth, `${API_URL}/users/${id}`, undefined, 'Không tải được người dùng.')
}

// Tạo tài khoản ADMIN hoặc STAFF. Admin đặt mật khẩu ban đầu; backend đánh dấu email đã xác minh để đăng nhập được ngay
export function createUser(fetchWithAuth, user) {
  return send(fetchWithAuth, `${API_URL}/users`, json('POST', user), 'Tạo tài khoản chưa thành công. Vui lòng thử lại.')
}

// Sửa họ tên, số điện thoại. Email là tên đăng nhập và vai trò không đổi ở đây
export function updateUser(fetchWithAuth, id, user) {
  return send(fetchWithAuth, `${API_URL}/users/${id}`, json('PUT', user), 'Lưu thay đổi chưa thành công. Vui lòng thử lại.')
}
