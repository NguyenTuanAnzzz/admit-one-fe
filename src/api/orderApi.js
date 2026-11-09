// Đổi địa chỉ backend trong file .env (VITE_API_URL), đã gồm /api ở cuối
const API_URL = import.meta.env.VITE_API_URL

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
