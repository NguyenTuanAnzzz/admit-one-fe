import { fromSpringPage } from '../lib/springPage'

// Đổi địa chỉ backend trong file .env (VITE_API_URL), đã gồm /api ở cuối
const API_URL = import.meta.env.VITE_API_URL

/**
 * Gắn holdDeadline (mốc ms) để đếm ngược giữ vé: lúc nhận response + remainingSeconds backend tính bằng giờ server.
 * Không so expiresAt với giờ máy khách, vì máy khách chỉnh giờ sai thì đồng hồ lệch theo.
 * Date.now() ở đây chỉ dùng để đo thời gian trôi qua từ lúc nhận, nên giờ máy sai bao nhiêu vẫn khớp server.
 */
function withHoldDeadline(order) {
  // Backend cũ chưa gửi remainingSeconds: tạm dùng expiresAt, không coi như đã hết giờ
  const holdDeadline = typeof order.remainingSeconds === 'number' ? Date.now() + order.remainingSeconds * 1000 : new Date(order.expiresAt).getTime()
  return { ...order, holdDeadline }
}

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
  return withHoldDeadline(data)
}

/**
 * Khách tự huỷ đơn đang giữ: PATCH /orders/{id}/cancel, vé được trả lại ngay. Trả { message }.
 * Đơn không còn PENDING: 400; vừa hết hạn hoặc vừa thanh toán ở chỗ khác: 409.
 */
export async function cancelMyOrder(fetchWithAuth, orderId) {
  let res
  try {
    res = await fetchWithAuth(`${API_URL}/orders/${orderId}/cancel`, { method: 'PATCH' })
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message ?? 'Chưa huỷ được đơn. Vui lòng thử lại.')
  return data
}

/**
 * Bắt đầu thanh toán: POST /orders/{id}/pay. Backend tạo (hoặc lấy lại) link payOS, trả { checkoutUrl }.
 * Đơn không còn chờ thanh toán (đã hết giờ, đã huỷ, đã trả): 400.
 */
export async function startPayment(fetchWithAuth, orderId) {
  let res
  try {
    res = await fetchWithAuth(`${API_URL}/orders/${orderId}/pay`, { method: 'POST' })
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.checkoutUrl) throw new Error(data?.message ?? 'Chưa mở được trang thanh toán. Vui lòng thử lại.')
  return data
}

/**
 * Đối soát thanh toán: POST /orders/{id}/payment/sync. Backend tự hỏi payOS, có giao dịch thì ghi nhận như webhook.
 * Dùng ở trang kết quả, phòng khi webhook payOS không về được (ngrok tắt, mạng lỗi).
 */
export async function syncPayment(fetchWithAuth, orderId) {
  const res = await fetchWithAuth(`${API_URL}/orders/${orderId}/payment/sync`, { method: 'POST' })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message ?? 'Chưa kiểm tra được thanh toán.')
  return data
}

/**
 * Vé đã xuất của một đơn: GET /orders/{id}/tickets, chỉ chủ đơn. Đơn chưa thanh toán thì trả [].
 * Mỗi vé: { id, code, ticketName, status (VALID | CHECKED_IN | VOID), qrSecret, checkedInAt }. QR vẽ từ qrSecret.
 */
export async function getMyTickets(fetchWithAuth, orderId) {
  let res
  try {
    res = await fetchWithAuth(`${API_URL}/orders/${orderId}/tickets`)
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message ?? 'Không tải được vé.')
  return data ?? []
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
  const page = fromSpringPage(data)
  return { ...page, items: page.items.map(withHoldDeadline) }
}

/**
 * Tạo đơn: POST /orders, chỉ tài khoản CUSTOMER (backend chặn bằng @PreAuthorize, role khác nhận 403).
 * items: [{ ticketId, quantity }], mỗi loại vé một dòng, tổng tối đa 4 vé.
 * Trả CreateOrderResponse: { id, code, eventId, eventName, totalAmount, status, expiresAt, items, remainingSeconds }
 * kèm holdDeadline để đếm ngược.
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
  return withHoldDeadline(data)
}
