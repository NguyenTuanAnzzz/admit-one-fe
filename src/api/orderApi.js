import { fromSpringPage } from '../lib/springPage'

// Đổi địa chỉ backend trong file .env (VITE_API_URL), đã gồm /api ở cuối
const API_URL = import.meta.env.VITE_API_URL

/**
 * Chi tiết một đơn của tôi: GET /orders/{id}, trả MyOrderResponse.
 * Đơn không có hoặc của người khác: backend trả 404, err.status = 404 để trang hiện "không tìm thấy".
 */
export async function getMyOrder(fetchWithAuth, orderId) {
  let res
  try {
    res = await fetchWithAuth(`${API_URL}/orders/${orderId}`)
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const err = new Error(data?.message ?? 'Không tải được đơn hàng.')
    // id sai định dạng (400) cũng coi như không có đơn này
    err.status = res.status === 400 ? 404 : res.status
    throw err
  }
  return data
}

/**
 * Đơn của tôi: GET /orders/me, chỉ CUSTOMER. params: { keyword, status, page, size }, tham số rỗng thì không gửi.
 * keyword tìm theo mã đơn hoặc tên sự kiện. Đơn mới nhất lên trước.
 * Trả { items, page, size, totalItems, totalPages }, mỗi item là MyOrderResponse.
 */
export async function getMyOrders(fetchWithAuth, params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value)
  })

  let res
  try {
    res = await fetchWithAuth(`${API_URL}/orders/me?${query}`)
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message ?? 'Không tải được danh sách đơn.')
  return fromSpringPage(data)
}

/**
 * Tạo đơn: POST /orders, chỉ tài khoản CUSTOMER (backend chặn bằng @PreAuthorize, role khác nhận 403).
 * items: [{ ticketId, quantity }], mỗi loại vé một dòng, tổng tối đa 4 vé.
 * Trả CreateOrderResponse: { id, code, eventId, eventName, totalAmount, status, expiresAt, items }.
 */
export async function createOrder(fetchWithAuth, { eventId, items }) {
  let res
  try {
    res = await fetchWithAuth(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, items }),
    })
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const err = new Error(data?.message ?? 'Chưa giữ được vé. Vui lòng thử lại.')
    err.status = res.status
    throw err
  }
  return data
}
