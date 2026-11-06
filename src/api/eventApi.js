// Đổi địa chỉ backend trong file .env (VITE_API_URL), đã gồm /api ở cuối
const API_URL = import.meta.env.VITE_API_URL

/**
 * Một trang danh sách sự kiện cho admin, có cả bản nháp: GET /admin/events (EventController.getAllEventsForAdmin).
 * params: { keyword, eventDate, saleDate, page, size }. eventDate, saleDate dạng "2026-12-20", page bắt đầu từ 0.
 * Tham số rỗng thì không gửi. Backend xếp sự kiện mới tạo lên đầu.
 * Backend trả Page<EventResponse> của Spring, đổi về { items, page, size, totalItems, totalPages } cho trang danh sách.
 */
export async function getAdminEvents(fetchWithAuth, params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value)
  })

  let res
  try {
    res = await fetchWithAuth(`${API_URL}/admin/events?${query}`)
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message ?? 'Không tải được danh sách sự kiện.')
  return fromSpringPage(data)
}

/**
 * Spring trả Page theo một trong hai kiểu, tuỳ cấu hình:
 * { content, number, size, totalElements, totalPages } hoặc { content, page: { number, size, totalElements, totalPages } }.
 */
function fromSpringPage(data) {
  const meta = data?.page ?? data ?? {}
  return {
    items: data?.content ?? [],
    page: meta.number ?? 0,
    size: meta.size ?? 0,
    totalItems: meta.totalElements ?? 0,
    totalPages: meta.totalPages ?? 0,
  }
}

// Chi tiết một sự kiện (kể cả bản nháp), để điền sẵn form sửa
export async function getAdminEvent(fetchWithAuth, id) {
  let res
  try {
    res = await fetchWithAuth(`${API_URL}/admin/events/${id}`)
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message ?? 'Không tải được sự kiện.')
  return data
}

// Sửa thông tin sự kiện, body giống createEvent
export async function updateEvent(fetchWithAuth, id, event) {
  let res
  try {
    res = await fetchWithAuth(`${API_URL}/admin/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message ?? 'Lưu thay đổi chưa thành công. Vui lòng thử lại.')
  return data
}

// Bước 1: tải ảnh poster lên Cloudinary qua backend, nhận về { url, publicId }
export async function uploadPoster(fetchWithAuth, file) {
  const body = new FormData()
  body.append('file', file)

  let res
  try {
    // Không tự đặt Content-Type: trình duyệt tự điền multipart/form-data kèm boundary
    res = await fetchWithAuth(`${API_URL}/admin/uploads/poster`, { method: 'POST', body })
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message ?? 'Tải ảnh lên chưa thành công. Vui lòng thử lại.')
  return data
}

// Bước 2: tạo sự kiện, posterUrl lấy từ kết quả uploadPoster. Sự kiện mới luôn là DRAFT
export async function createEvent(fetchWithAuth, event) {
  let res
  try {
    res = await fetchWithAuth(`${API_URL}/admin/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message ?? 'Tạo sự kiện chưa thành công. Vui lòng thử lại.')
  return data
}

// Đổi trạng thái sự kiện (công bố, mở bán, huỷ). Bước chuyển không hợp lệ thì backend trả 409 kèm lý do
export async function updateEventStatus(fetchWithAuth, id, status) {
  let res
  try {
    res = await fetchWithAuth(`${API_URL}/admin/events/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message ?? 'Đổi trạng thái chưa thành công. Vui lòng thử lại.')
  return data
}
