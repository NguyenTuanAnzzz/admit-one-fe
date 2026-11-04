// Trùng enum UserRole ở backend
export const ROLE = { CUSTOMER: 'CUSTOMER', STAFF: 'STAFF', ADMIN: 'ADMIN' }

export const ROLE_LABEL = {
  [ROLE.CUSTOMER]: 'Khách hàng',
  [ROLE.STAFF]: 'Nhân viên soát vé',
  [ROLE.ADMIN]: 'Quản trị viên',
}

// Ai được vào /dashboard. Mỗi mục trong menu dashboard còn tự giới hạn role riêng (DASHBOARD_NAV)
export const DASHBOARD_ROLES = [ROLE.ADMIN, ROLE.STAFF]

/**
 * Menu dashboard. Admin thấy hết, Staff chỉ thấy check-in (đặc tả mục 3.2: Staff chỉ dùng màn hình check-in).
 * code: mã yêu cầu trong spec.md, hiện ở trang "sắp có" để biết trang đó làm gì.
 */
export const DASHBOARD_NAV = [
  {
    path: 'overview',
    label: 'Tổng quan',
    description: 'Doanh thu, số vé bán, vé đang giữ, độ dài hàng đợi theo thời gian thực.',
    code: 'A-04',
    roles: [ROLE.ADMIN],
  },
  {
    path: 'events',
    label: 'Sự kiện',
    description: 'Tạo sự kiện, đặt hạng vé, giá, số lượng và giờ mở bán.',
    code: 'A-01 · A-02 · A-03',
    roles: [ROLE.ADMIN],
  },
  {
    path: 'orders',
    label: 'Đơn hàng',
    description: 'Tra cứu đơn, xem log thanh toán, đánh dấu đơn cần hoàn tiền.',
    code: 'A-06',
    roles: [ROLE.ADMIN],
  },
  {
    path: 'staff',
    label: 'Nhân viên',
    description: 'Tạo tài khoản Staff và gán sự kiện được soát vé.',
    code: 'A-07',
    roles: [ROLE.ADMIN],
  },
  {
    path: 'checkin',
    label: 'Check-in',
    description: 'Quét QR vé tại cửa, xem số người đã vào trên tổng số vé.',
    code: 'S-01 · S-02 · S-04',
    roles: [ROLE.ADMIN, ROLE.STAFF],
  },
]

export const canUseDashboard = (user) => DASHBOARD_ROLES.includes(user?.role)
