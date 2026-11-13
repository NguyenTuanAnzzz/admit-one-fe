// Đổi địa chỉ backend trong file .env (VITE_API_URL), đã gồm /api ở cuối
const API_URL = import.meta.env.VITE_API_URL

/**
 * Check-in (S-01, S-02): Admin và Staff đều dùng được, không giới hạn theo sự kiện được gán.
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

// Sự kiện còn check-in được (đang bán, hết vé, hoặc đã kết thúc). keyword rỗng thì không gửi
export function getCheckinEvents(fetchWithAuth, keyword) {
  const query = new URLSearchParams()
  if (keyword) query.set('keyword', keyword)
  return send(fetchWithAuth, `${API_URL}/checkin/events?${query}`, undefined, 'Không tải được danh sách sự kiện.')
}

// { checkedIn, totalIssued }
export function getCheckinStats(fetchWithAuth, eventId) {
  return send(fetchWithAuth, `${API_URL}/checkin/events/${eventId}/stats`, undefined, 'Không tải được số liệu check-in.')
}

/**
 * Quét 1 vé: { result, ticketCode, ticketName, customerName, checkedInAt }.
 * result: OK | ALREADY_CHECKED_IN | VOID | WRONG_EVENT | NOT_FOUND - luôn trả 200, không phải lỗi HTTP.
 */
export function scanTicket(fetchWithAuth, { eventId, qrSecret }) {
  return send(fetchWithAuth, `${API_URL}/checkin/scan`, json('POST', { eventId, qrSecret }), 'Quét vé chưa thành công. Vui lòng thử lại.')
}
