/**
 * API giả lập cho bản demo. Mỗi hàm fetch* sẽ được thay bằng lời gọi backend thật (spec.md mục 9).
 * Thêm ?loi=1 vào URL để xem trạng thái lỗi của các khối tải dữ liệu.
 */

export const STATUS = {
  ON_SALE: 'dang-ban',
  UPCOMING: 'sap-mo',
  SOLD_OUT: 'het-ve',
}

export const STATUS_LABEL = {
  [STATUS.ON_SALE]: 'Đang bán',
  [STATUS.UPCOMING]: 'Sắp mở bán',
  [STATUS.SOLD_OUT]: 'Hết vé',
}

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

export const FEATURED_EVENT = {
  id: 'vu-live-2026',
  title: 'VŨ. Live Concert',
  subtitle: 'Bảo tàng của nuối tiếc',
  startsAt: '2026-11-15T19:30:00+07:00',
  doorsOpen: '18:00',
  venue: 'Cung Thể thao Quần Ngựa',
  address: 'Văn Cao, Ba Đình, Hà Nội',
  // Theo BASE_URL để ảnh vẫn đúng khi trang được deploy trong thư mục con
  poster: `${import.meta.env.BASE_URL}poster.jpg`,
  saleNote: 'Đang mở bán đợt 1 từ 10:00, 25/10/2026',
  priceFrom: 750000,
  priceTo: 1250000,
  stats: { total: 8400, available: 3996 },
}

/** Ba sự kiện sau sự kiện chính là dữ liệu giả để thử bộ lọc trạng thái (C-02). */
const EVENTS = [
  {
    id: FEATURED_EVENT.id,
    title: FEATURED_EVENT.title,
    startsAt: FEATURED_EVENT.startsAt,
    venue: FEATURED_EVENT.venue,
    address: FEATURED_EVENT.address,
    status: STATUS.ON_SALE,
    saleOpensAt: '2026-10-25T10:00:00+07:00',
    priceFrom: 750000,
    priceTo: 1250000,
    seats: 8400,
    poster: FEATURED_EVENT.poster,
    featured: true,
  },
  {
    id: 'mua-thu-2026',
    title: 'Đêm nhạc Mùa thu',
    startsAt: '2026-12-06T20:00:00+07:00',
    venue: 'Nhà hát Lớn Hà Nội',
    address: '1 Tràng Tiền, Hoàn Kiếm, Hà Nội',
    status: STATUS.UPCOMING,
    saleOpensAt: '2026-11-10T10:00:00+07:00',
    priceFrom: 500000,
    priceTo: 1800000,
    seats: 598,
  },
  {
    id: 'giao-thua-2027',
    title: 'Hòa nhạc Giao thừa',
    startsAt: '2026-12-31T21:00:00+07:00',
    venue: 'Cung Văn hóa Hữu nghị',
    address: '91 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội',
    status: STATUS.UPCOMING,
    saleOpensAt: '2026-11-20T10:00:00+07:00',
    priceFrom: 600000,
    priceTo: 1500000,
    seats: 1200,
  },
  {
    id: 'acoustic-0711',
    title: 'Acoustic tối thứ Sáu',
    startsAt: '2026-11-07T20:00:00+07:00',
    venue: 'Trung tâm Hội nghị Quốc gia',
    address: 'Đại lộ Thăng Long, Nam Từ Liêm, Hà Nội',
    status: STATUS.SOLD_OUT,
    saleOpensAt: '2026-10-12T10:00:00+07:00',
    priceFrom: 450000,
    priceTo: 900000,
    seats: 3500,
  },
]

function simulate(data, delay, errorMessage) {
  const shouldFail = new URLSearchParams(window.location.search).has('loi')
  return new Promise((resolve, reject) => {
    setTimeout(() => (shouldFail ? reject(new Error(errorMessage)) : resolve(data)), delay)
  })
}

/** GET /events */
export const fetchEvents = () => simulate(EVENTS, 700, 'Không tải được danh sách sự kiện.')

