import { fromSpringPage } from '../lib/springPage'

// Đổi địa chỉ backend trong file .env (VITE_API_URL), đã gồm /api ở cuối
const API_URL = import.meta.env.VITE_API_URL

/**
 * Danh sách sự kiện cho khách: GET /events, không cần đăng nhập nên dùng fetch thường.
 * Backend chỉ trả UPCOMING, ON_SALE, SOLD_OUT. params: { keyword, status, from, to, page, size },
 * from và to dạng "2026-12-20" (khoảng ngày diễn), tham số rỗng thì không gửi.
 * Trả { items, page, size, totalItems, totalPages }, mỗi item là PublicEventSummaryResponse.
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
  return fromSpringPage(data)
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

// Chi tiết sự kiện cho khách: GET /events/{id}, PublicEventDetailResponse kèm tickets [{ id, name, description, price, available, status }].
// Bản nháp backend trả 404
export function getPublicEvent(id) {
  return getJson(`${API_URL}/events/${id}`, 'Không tải được sự kiện.')
}
