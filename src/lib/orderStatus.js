// Trùng enum OrderStatus ở backend
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
}

export const ORDER_STATUS_LABEL = {
  [ORDER_STATUS.PENDING]: 'Đang giữ vé',
  [ORDER_STATUS.PAID]: 'Đã thanh toán',
  [ORDER_STATUS.EXPIRED]: 'Hết hạn',
  [ORDER_STATUS.CANCELLED]: 'Đã huỷ',
}

// Dùng lại màu nhãn trạng thái sự kiện: đang giữ như "sắp mở bán", đã trả tiền như "đang bán"
export const ORDER_STATUS_STYLE = {
  [ORDER_STATUS.PENDING]: 'bg-status-upcoming text-status-upcoming-fg',
  [ORDER_STATUS.PAID]: 'bg-status-on-sale text-status-on-sale-fg',
  [ORDER_STATUS.EXPIRED]: 'border border-badge-line bg-surface-sunken text-fg-muted',
  [ORDER_STATUS.CANCELLED]: 'bg-danger-subtle text-danger',
}
