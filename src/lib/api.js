/**
 * Dữ liệu mẫu còn lại cho phần minh hoạ "Cách mua vé" trên trang chủ (BuyingFlow).
 * Sự kiện trên trang chủ đã lấy từ backend thật (GET /api/events).
 */

/** Tài khoản demo duy nhất, dùng cho form đăng nhập. */
export const DEMO_USER = {
  name: 'Đặng Thùy Linh',
  initials: 'TL',
  email: 'linh.dtl@gmail.com',
}

/** Đơn đang giữ vé mẫu, minh họa phiếu giữ vé 10 phút. */
export const SAMPLE_HOLD = {
  id: 'ADM-2026-00417',
  tickets: ['VIP', 'VIP'],
  total: 2500000,
  remainingSeconds: 581,
}
