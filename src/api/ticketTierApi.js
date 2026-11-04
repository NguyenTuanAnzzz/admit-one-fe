// Đổi địa chỉ backend trong file .env (VITE_API_URL), đã gồm /api ở cuối
const API_URL = import.meta.env.VITE_API_URL

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

// Hạng vé của sự kiện, xếp theo sortOrder: [{ id, name, price, quantity, sold, color, sortOrder }]. Chưa có thì mảng rỗng
export function getTicketTiers(fetchWithAuth, eventId) {
  return send(fetchWithAuth, `${API_URL}/admin/events/${eventId}/tiers`, undefined, 'Không tải được hạng vé.')
}

// Thay cả danh sách hạng vé (chỉ khi sự kiện còn là bản nháp). tiers: [{ name, price, quantity, color }], thứ tự mảng là thứ tự hiện
export function saveTicketTiers(fetchWithAuth, eventId, tiers) {
  return send(
    fetchWithAuth,
    `${API_URL}/admin/events/${eventId}/tiers`,
    { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tiers }) },
    'Lưu hạng vé chưa thành công. Vui lòng thử lại.',
  )
}
