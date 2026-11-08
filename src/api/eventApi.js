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

// Sửa thông tin một loại vé: PUT /admin/events/{eventId}/tickets/{ticketId}. Backend chỉ cho sửa vé INACTIVE
export async function updateTicket(fetchWithAuth, eventId, ticketId, ticket) {
  let res
  try {
    res = await fetchWithAuth(`${API_URL}/admin/events/${eventId}/tickets/${ticketId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket),
    })
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message ?? 'Lưu loại vé chưa thành công. Vui lòng thử lại.')
  return data
}

// Thêm một loại vé vào sự kiện đã có: POST /admin/events/{eventId}/tickets. Backend chỉ cho khi DRAFT hoặc UPCOMING
export async function addTicket(fetchWithAuth, eventId, ticket) {
  let res
  try {
    res = await fetchWithAuth(`${API_URL}/admin/events/${eventId}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket),
    })
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message ?? 'Thêm loại vé chưa thành công. Vui lòng thử lại.')
  return data
}

// Xoá hẳn một loại vé: DELETE /admin/events/{eventId}/tickets/{ticketId}, trả 204 không có body.
// Backend chỉ cho xoá khi sự kiện còn DRAFT và loại vé chưa bán vé nào, sai thì 409 kèm lý do
export async function deleteTicket(fetchWithAuth, eventId, ticketId) {
  let res
  try {
    res = await fetchWithAuth(`${API_URL}/admin/events/${eventId}/tickets/${ticketId}`, { method: 'DELETE' })
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.message ?? 'Xoá loại vé chưa thành công. Vui lòng thử lại.')
  }
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

// Công bố bản nháp: PATCH /admin/events/{id}/publish, không có body. Trả EventResponse với status PUBLISHED.
// Sự kiện không còn là bản nháp thì backend trả lỗi kèm lý do
export async function publishEvent(fetchWithAuth, id) {
  let res
  try {
    res = await fetchWithAuth(`${API_URL}/admin/events/${id}/publish`, { method: 'PATCH' })
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message ?? 'Công bố chưa thành công. Vui lòng thử lại.')
  return data
}
