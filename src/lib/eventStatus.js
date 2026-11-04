// Trùng enum EventStatus ở backend
export const EVENT_STATUS = {
  DRAFT: 'DRAFT',
  UPCOMING: 'UPCOMING',
  ON_SALE: 'ON_SALE',
  SOLD_OUT: 'SOLD_OUT',
  CANCELLED: 'CANCELLED',
}

export const EVENT_STATUS_LABEL = {
  [EVENT_STATUS.DRAFT]: 'Bản nháp',
  [EVENT_STATUS.UPCOMING]: 'Sắp mở bán',
  [EVENT_STATUS.ON_SALE]: 'Đang bán',
  [EVENT_STATUS.SOLD_OUT]: 'Hết vé',
  [EVENT_STATUS.CANCELLED]: 'Đã huỷ',
}

// Cùng màu với nhãn trạng thái ở trang chủ (StatusBadge), thêm bản nháp và đã huỷ
export const EVENT_STATUS_STYLE = {
  [EVENT_STATUS.DRAFT]: 'border border-badge-line bg-badge text-badge-fg',
  [EVENT_STATUS.UPCOMING]: 'bg-status-upcoming text-status-upcoming-fg',
  [EVENT_STATUS.ON_SALE]: 'bg-status-on-sale text-status-on-sale-fg',
  [EVENT_STATUS.SOLD_OUT]: 'bg-status-sold-out text-status-sold-out-fg',
  [EVENT_STATUS.CANCELLED]: 'bg-danger-subtle text-danger',
}

/**
 * Nút đổi trạng thái được hiện cho một sự kiện, khớp TRANSITIONS trong EventService ở backend.
 * Công bố bản nháp: giờ mở bán còn ở tương lai thì sang Sắp mở bán, đã qua thì mở bán luôn.
 * tone "danger" cho thao tác không quay lại được (huỷ sự kiện).
 */
export function statusActions(event, now = Date.now()) {
  const huy = {
    key: 'cancel',
    label: 'Huỷ sự kiện',
    target: EVENT_STATUS.CANCELLED,
    tone: 'danger',
    confirm: `Huỷ "${event.name}"? Sự kiện bị ẩn khỏi trang khách và không mở lại được. Đơn đã thanh toán sẽ cần hoàn tiền.`,
  }
  switch (event.status) {
    case EVENT_STATUS.DRAFT: {
      const saleLater = new Date(event.saleOpensAt).getTime() > now
      return [
        {
          key: 'publish',
          label: 'Công bố',
          target: saleLater ? EVENT_STATUS.UPCOMING : EVENT_STATUS.ON_SALE,
          tone: 'primary',
          confirm: saleLater
            ? `Công bố "${event.name}"? Khách sẽ thấy sự kiện ở trạng thái Sắp mở bán. Sau khi công bố không sửa được sơ đồ ghế nữa.`
            : `Công bố và mở bán "${event.name}" ngay? Giờ mở bán đã qua nên khách giữ ghế được luôn. Sau khi công bố không sửa được sơ đồ ghế nữa.`,
        },
      ]
    }
    case EVENT_STATUS.UPCOMING:
      return [
        { key: 'open', label: 'Mở bán ngay', target: EVENT_STATUS.ON_SALE, tone: 'primary', confirm: `Mở bán "${event.name}" ngay, không chờ tới giờ mở bán đã đặt?` },
        huy,
      ]
    case EVENT_STATUS.ON_SALE:
      return [huy]
    case EVENT_STATUS.SOLD_OUT:
      return [{ key: 'reopen', label: 'Mở bán lại', target: EVENT_STATUS.ON_SALE, tone: 'primary', confirm: `Mở bán lại "${event.name}"?` }, huy]
    default:
      return []
  }
}
