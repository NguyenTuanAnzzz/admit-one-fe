// Đổi địa chỉ backend trong file .env (VITE_API_URL), đã gồm /api ở cuối
const API_URL = import.meta.env.VITE_API_URL

/**
 * Quản lý nhân viên soát vé (A-07). Mọi API cần quyền ADMIN.
 * Staff = { id, fullName, email, phone, createdAt, events: [{ id, name, startsAt, status }] }
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

// Một trang nhân viên: { items, page, size, totalItems, totalPages }. params: { q, page, size }, rỗng thì không gửi
export function getStaffPage(fetchWithAuth, params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value)
  })
  return send(fetchWithAuth, `${API_URL}/admin/staff?${query}`, undefined, 'Không tải được danh sách nhân viên.')
}

export function getStaff(fetchWithAuth, id) {
  return send(fetchWithAuth, `${API_URL}/admin/staff/${id}`, undefined, 'Không tải được nhân viên.')
}

// Tạo tài khoản Staff. Admin đặt mật khẩu ban đầu; backend đánh dấu email đã xác minh để đăng nhập được ngay
export function createStaff(fetchWithAuth, staff) {
  return send(fetchWithAuth, `${API_URL}/admin/staff`, json('POST', staff), 'Tạo nhân viên chưa thành công. Vui lòng thử lại.')
}

// Sửa họ tên, số điện thoại. Email là tên đăng nhập nên không đổi ở đây
export function updateStaff(fetchWithAuth, id, staff) {
  return send(fetchWithAuth, `${API_URL}/admin/staff/${id}`, json('PUT', staff), 'Lưu thay đổi chưa thành công. Vui lòng thử lại.')
}

// Thay toàn bộ danh sách sự kiện được gán bằng eventIds gửi lên (gửi mảng rỗng là bỏ gán hết)
export function setStaffEvents(fetchWithAuth, id, eventIds) {
  return send(fetchWithAuth, `${API_URL}/admin/staff/${id}/events`, json('PUT', { eventIds }), 'Gán sự kiện chưa thành công. Vui lòng thử lại.')
}
