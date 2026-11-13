// Đổi địa chỉ backend trong file .env (VITE_API_URL), đã gồm /api ở cuối
const API_URL = import.meta.env.VITE_API_URL

// Dashboard › Tổng quan (A-04): { totalRevenue, ticketsSold, ticketsHeld }
export async function getOverview(fetchWithAuth) {
  let res
  try {
    res = await fetchWithAuth(`${API_URL}/admin/overview`)
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message ?? 'Không tải được số liệu tổng quan.')
  return data
}

async function get(fetchWithAuth, path, fallbackMessage) {
  let res
  try {
    res = await fetchWithAuth(`${API_URL}${path}`)
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message ?? fallbackMessage)
  return data
}

// [{ date: "2026-11-14", revenue }], mặc định 14 ngày gần nhất, luôn đủ ngày (ngày không có đơn thì revenue = 0)
export function getRevenueByDay(fetchWithAuth, days = 14) {
  return get(fetchWithAuth, `/admin/overview/revenue-by-day?days=${days}`, 'Không tải được doanh thu theo ngày.')
}

// [{ status, count }], luôn đủ 4 trạng thái (PENDING, PAID, EXPIRED, CANCELLED)
export function getOrdersByStatus(fetchWithAuth) {
  return get(fetchWithAuth, '/admin/overview/orders-by-status', 'Không tải được số đơn theo trạng thái.')
}

// [{ eventName, revenue }], sắp theo doanh thu giảm dần, chỉ tính đơn đã thanh toán
export function getTopEvents(fetchWithAuth, limit = 5) {
  return get(fetchWithAuth, `/admin/overview/top-events?limit=${limit}`, 'Không tải được top sự kiện.')
}
