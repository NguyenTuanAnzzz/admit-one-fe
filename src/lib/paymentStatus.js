// Trùng enum PaymentStatus ở backend
export const PAYMENT_STATUS_LABEL = {
  SUCCESS: 'Thành công',
  FAILED: 'Thất bại',
  REFUND_REQUIRED: 'Cần hoàn tiền',
}

export const PAYMENT_STATUS_STYLE = {
  SUCCESS: 'bg-status-on-sale text-status-on-sale-fg',
  FAILED: 'bg-danger-subtle text-danger',
  REFUND_REQUIRED: 'bg-status-upcoming text-status-upcoming-fg',
}
