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

// Sơ đồ đã lưu: hạng vé, khu (kèm số ghế), vật thể. Sự kiện chưa có sơ đồ thì các mảng rỗng, mapWidth null
export function getSeatMap(fetchWithAuth, eventId) {
  return send(fetchWithAuth, `${API_URL}/admin/events/${eventId}/seatmap`, undefined, 'Không tải được sơ đồ ghế.')
}

// Lưu cả sơ đồ (backend xoá sơ đồ cũ rồi sinh lại ghế). Trả về sơ đồ vừa lưu, có id thật
export function saveSeatMap(fetchWithAuth, eventId, seatMap) {
  return send(
    fetchWithAuth,
    `${API_URL}/admin/events/${eventId}/seatmap`,
    { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(seatMap) },
    'Lưu sơ đồ chưa thành công. Vui lòng thử lại.',
  )
}

// Ghế của một khu, dùng để biết ghế nào đang bị khoá khi mở lại sơ đồ
export function getZoneSeats(fetchWithAuth, eventId, zoneId) {
  return send(fetchWithAuth, `${API_URL}/admin/events/${eventId}/zones/${zoneId}/seats`, undefined, 'Không tải được ghế của khu.')
}
