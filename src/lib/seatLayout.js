/**
 * Sinh ghế và hình khu, giống hệt SeatMapService ở backend (SEAT_GAP, ARC_INNER_RADIUS, rowLabel, gridPosition, arcPosition).
 * FE chỉ dùng để xem trước khi admin đang chỉnh; bấm Lưu thì backend sinh lại và đó mới là số liệu thật.
 * Đổi công thức ở đây thì phải đổi cả backend, không thì xem trước lệch với ghế được lưu.
 */

export const SEAT_GAP = 24
export const ARC_INNER_RADIUS = 300
export const SEAT_RADIUS = 8

// Trùng giới hạn trong ZoneRequest và SeatMapService
export const MAX_ROWS = 50
export const MAX_SEATS_PER_ROW = 100
export const MAX_SEATS_PER_EVENT = 50000

/** 0 → "A", 25 → "Z", 26 → "AA", 27 → "AB" */
export function rowLabel(index) {
  let label = ''
  let n = index
  do {
    label = String.fromCharCode(65 + (n % 26)) + label
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return label
}

function gridPosition(row, col) {
  return [col * SEAT_GAP + SEAT_GAP / 2, row * SEAT_GAP + SEAT_GAP / 2]
}

function arcSpan(seatsPerRow) {
  return ((seatsPerRow - 1) * SEAT_GAP) / ARC_INNER_RADIUS
}

function arcPosition(row, col, seatsPerRow) {
  const radius = ARC_INNER_RADIUS + row * SEAT_GAP
  const span = arcSpan(seatsPerRow)
  const angle = seatsPerRow === 1 ? 0 : -span / 2 + col * (span / (seatsPerRow - 1))
  return [radius * Math.sin(angle), radius * Math.cos(angle) - ARC_INNER_RADIUS]
}

/** Mọi ghế của một khu, toạ độ tương đối với khu: [{ rowLabel, seatNumber, x, y }] */
export function generateSeats(zone) {
  const seats = []
  for (let row = 0; row < zone.rowCount; row++) {
    const label = rowLabel(row)
    for (let col = 0; col < zone.seatsPerRow; col++) {
      const [x, y] = zone.seatLayout === 'ARC' ? arcPosition(row, col, zone.seatsPerRow) : gridPosition(row, col)
      seats.push({ rowLabel: label, seatNumber: col + 1, x, y })
    }
  }
  return seats
}

/**
 * Viền khu tự tính từ số hàng, số ghế và kiểu xếp, để admin không phải vẽ đa giác bằng tay.
 * GRID: chữ nhật ôm vừa các ghế. ARC: dải cong giữa cung trong và cung ngoài, lấy mẫu nhiều điểm cho mượt.
 */
export function zoneShape(zone) {
  if (zone.seatLayout !== 'ARC') {
    const w = zone.seatsPerRow * SEAT_GAP
    const h = zone.rowCount * SEAT_GAP
    return [
      [0, 0],
      [w, 0],
      [w, h],
      [0, h],
    ]
  }

  const inner = ARC_INNER_RADIUS - SEAT_GAP / 2
  const outer = ARC_INNER_RADIUS + (zone.rowCount - 1) * SEAT_GAP + SEAT_GAP / 2
  // Nới thêm nửa khoảng ghế ở hai đầu cung để viền không cắt ngang ghế đầu và ghế cuối
  const half = arcSpan(zone.seatsPerRow) / 2 + SEAT_GAP / 2 / ARC_INNER_RADIUS
  const steps = 24
  const at = (r, a) => [r * Math.sin(a), r * Math.cos(a) - ARC_INNER_RADIUS]
  const points = []
  for (let i = 0; i <= steps; i++) points.push(at(outer, -half + (2 * half * i) / steps))
  for (let i = steps; i >= 0; i--) points.push(at(inner, -half + (2 * half * i) / steps))
  return points.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10])
}

/** Hình chữ nhật rộng w, cao h, cho sân khấu, LED, FOH... */
export function rectShape(w, h) {
  return [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ]
}

/** Khung bao của một đa giác, dùng để đặt nhãn và đo kích thước vật thể */
export function bounds(shape) {
  const xs = shape.map((p) => p[0])
  const ys = shape.map((p) => p[1])
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  return { minX, minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY }
}

export const seatKey = (rowLabel, seatNumber) => `${rowLabel}-${seatNumber}`
