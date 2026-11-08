/**
 * Đổi Page của Spring Data về dạng trang danh sách FE dùng: { items, page, size, totalItems, totalPages }.
 * Spring trả một trong hai kiểu tuỳ cấu hình:
 * { content, number, size, totalElements, totalPages } hoặc { content, page: { number, size, totalElements, totalPages } }.
 */
export function fromSpringPage(data) {
  const meta = data?.page ?? data ?? {}
  return {
    items: data?.content ?? [],
    page: meta.number ?? 0,
    size: meta.size ?? 0,
    totalItems: meta.totalElements ?? 0,
    totalPages: meta.totalPages ?? 0,
  }
}
