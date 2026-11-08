// Trùng enum EventStatus ở backend: DRAFT, UPCOMING, ON_SALE, SOLD_OUT, CANCELLED.
// PUBLISHED là giá trị cũ, giữ nhãn phòng khi DB còn sự kiện mang giá trị này
export const EVENT_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  UPCOMING: 'UPCOMING',
  ON_SALE: 'ON_SALE',
  SOLD_OUT: 'SOLD_OUT',
  CANCELLED: 'CANCELLED',
}

export const EVENT_STATUS_LABEL = {
  [EVENT_STATUS.DRAFT]: 'Bản nháp',
  [EVENT_STATUS.PUBLISHED]: 'Đã công bố',
  [EVENT_STATUS.UPCOMING]: 'Sắp mở bán',
  [EVENT_STATUS.ON_SALE]: 'Đang bán',
  [EVENT_STATUS.SOLD_OUT]: 'Hết vé',
  [EVENT_STATUS.CANCELLED]: 'Đã huỷ',
}

// Màu nhãn trạng thái dùng chung cho trang khách và dashboard
export const EVENT_STATUS_STYLE = {
  [EVENT_STATUS.DRAFT]: 'border border-badge-line bg-badge text-badge-fg',
  [EVENT_STATUS.PUBLISHED]: 'bg-status-on-sale text-status-on-sale-fg',
  [EVENT_STATUS.UPCOMING]: 'bg-status-upcoming text-status-upcoming-fg',
  [EVENT_STATUS.ON_SALE]: 'bg-status-on-sale text-status-on-sale-fg',
  [EVENT_STATUS.SOLD_OUT]: 'bg-status-sold-out text-status-sold-out-fg',
  [EVENT_STATUS.CANCELLED]: 'bg-danger-subtle text-danger',
}
