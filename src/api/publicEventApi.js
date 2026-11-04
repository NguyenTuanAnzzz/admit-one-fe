// Đổi địa chỉ backend trong file .env (VITE_API_URL), đã gồm /api ở cuối
const API_URL = import.meta.env.VITE_API_URL

/**
 * Danh sách sự kiện cho khách, không cần đăng nhập nên dùng fetch thường. Backend chỉ trả sự kiện đã công bố.
 * params: { status, q, startsFrom, startsTo, page, size, sort }, tham số rỗng thì không gửi. Trả EventPageResponse.
 */
export async function getPublicEvents(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value)
  })

  let res
  try {
    res = await fetch(`${API_URL}/events?${query}`)
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message ?? 'Không tải được danh sách sự kiện.')
  return data
}

async function getJson(url, fallbackMessage) {
  let res
  try {
    res = await fetch(url)
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const err = new Error(data?.message ?? fallbackMessage)
    // Trang chi tiết phân biệt "không có sự kiện này" (404) với lỗi mạng, lỗi máy chủ
    err.status = res.status
    throw err
  }
  return data
}

// Chi tiết sự kiện cho khách. Bản nháp backend trả 404
export function getPublicEvent(id) {
  return getJson(`${API_URL}/events/${id}`, 'Không tải được sự kiện.')
}

// Sơ đồ cho khách: hạng vé, khu kèm số ghế còn trống, vật thể (không có ảnh nền)
export function getPublicSeatMap(id) {
  return getJson(`${API_URL}/events/${id}/seatmap`, 'Không tải được sơ đồ ghế.')
}

// Ghế của một khu kèm trạng thái (AVAILABLE, HELD, SOLD, BLOCKED)
export function getPublicZoneSeats(id, zoneId) {
  return getJson(`${API_URL}/events/${id}/zones/${zoneId}/seats`, 'Không tải được ghế của khu.')
}
