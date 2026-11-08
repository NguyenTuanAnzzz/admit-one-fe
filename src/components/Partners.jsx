import { useEffect, useRef } from 'react'
import { animate, m, useInView, useReducedMotion } from 'framer-motion'
import { EASE_OUT, fadeUp, inView } from '../lib/motion'

// Dữ liệu mẫu cho trang chủ (footer có ghi rõ). Khi có dashboard thống kê thì lấy số thật từ backend.
// to: số đích, decimals: số chữ số sau dấu phẩy, suffix: chữ đi sau số
const STATS = [
  { to: 1200, decimals: 0, suffix: '+', label: 'sự kiện đã bán vé', note: 'concert, kịch, lễ hội, hội thảo' },
  { to: 2.4, decimals: 1, suffix: ' triệu', label: 'vé đã phát hành', note: 'mỗi vé một mã QR riêng' },
  { to: 34, decimals: 0, suffix: '', label: 'tỉnh thành có sự kiện', note: 'từ sân vận động tới phòng trà' },
  { to: 99.98, decimals: 2, suffix: '%', label: 'lượt quét vé hợp lệ', note: 'không có vé trùng ở cổng' },
]

// Tên đối tác hư cấu cho bản demo, không dùng tên hay logo của công ty có thật.
// Ảnh minh hoạ lấy từ Unsplash (Unsplash License: dùng miễn phí, kể cả thương mại), mỗi đối tác một ảnh hợp loại hình.
// photo: mã ảnh trên images.unsplash.com, credit: tác giả ảnh
const PARTNERS = [
  { name: 'Sóng Live', kind: 'Tổ chức concert', photo: 'photo-1760539619529-cfd85a2a9cfd', credit: 'BoliviaInteligente' },
  { name: 'Bến Nhạc', kind: 'Lễ hội âm nhạc', photo: 'photo-1666289186874-0d023fe7d002', credit: 'Adrià Sánchez Roqué' },
  { name: 'Mây Production', kind: 'Sân khấu kịch', photo: 'photo-1747079943885-b3c31d5c68a1', credit: 'Frédéric Lo Brutto' },
  { name: 'Hoà Âm Hall', kind: 'Nhà hát', photo: 'photo-1690131053637-04c5841aee83', credit: 'Miguel Alcântara' },
  { name: 'Phố Đêm', kind: 'Phòng trà', photo: 'photo-1541804627596-3b5b9ef58c93', credit: 'Alex Zamora' },
  { name: 'Lửa Trại Fest', kind: 'Lễ hội ngoài trời', photo: 'photo-1758272960434-ac75a29c603e', credit: 'Vitaly Gariev' },
]

// Ảnh 600px, Unsplash tự chọn WebP/AVIF nếu trình duyệt hỗ trợ (auto=format), mỗi ảnh khoảng 30-90KB
const photoUrl = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=70`

// Kiểu số Việt Nam: 1.200 và 2,4
const formatNumber = (n, decimals) => n.toLocaleString('vi-VN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

/**
 * Con số chạy từ 0 lên khi cuộn tới, một lần. Ghi thẳng vào DOM qua ref trong lúc chạy
 * nên React không phải vẽ lại 60 lần mỗi giây. Trình đọc màn hình chỉ nghe số cuối (span sr-only),
 * phần số đang chạy aria-hidden. Máy bật giảm chuyển động thì hiện luôn số cuối.
 */
function CountUp({ to, decimals, suffix }) {
  const ref = useRef(null)
  const visible = useInView(ref, { once: true, amount: 0.6 })
  const reduceMotion = useReducedMotion()
  const final = `${formatNumber(to, decimals)}${suffix}`

  useEffect(() => {
    const el = ref.current
    if (!el || !visible) return
    if (reduceMotion) {
      el.textContent = final
      return
    }
    const controls = animate(0, to, {
      duration: 1.6,
      ease: EASE_OUT,
      onUpdate: (v) => {
        el.textContent = `${formatNumber(v, decimals)}${suffix}`
      },
    })
    return () => controls.stop()
  }, [visible, reduceMotion, to, decimals, suffix, final])

  return (
    <>
      <span ref={ref} aria-hidden="true">
        {reduceMotion ? final : `${formatNumber(0, decimals)}${suffix}`}
      </span>
      <span className="sr-only">{final}</span>
    </>
  )
}

/** Thẻ ảnh: ảnh phủ kín thẻ, dải tối dần ở đáy để chữ trắng đọc rõ trên mọi ảnh. Ảnh chỉ trang trí (alt rỗng), tên nằm ở chữ */
function PartnerCard({ partner }) {
  return (
    <>
      <img src={photoUrl(partner.photo)} alt="" loading="lazy" decoding="async" width="600" height="450" className="absolute inset-0 size-full object-cover" />
      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[rgba(20,17,15,0.88)] via-[rgba(20,17,15,0.3)] to-transparent" />
      <span className="relative mt-auto p-4">
        <span className="block font-display text-subheading leading-tight font-extrabold text-fg-inverse">{partner.name}</span>
        <span className="mt-0.5 block text-caption text-fg-inverse/85">{partner.kind}</span>
      </span>
    </>
  )
}

// Rộng cố định để băng chạy đều, tỉ lệ 4:3 như thẻ sự kiện
const partnerItem = 'relative flex aspect-[4/3] w-64 shrink-0 flex-col overflow-hidden rounded-input border border-line bg-surface-sunken'

/** Phần dựng niềm tin giữa danh sách sự kiện và cách mua vé: con số đã làm được và các đối tác chiến lược. */
export function Partners() {
  return (
    <section aria-labelledby="doi-tac-tieu-de" className="px-gutter pb-section-sm md:pb-section">
      <div className="mx-auto max-w-page overflow-hidden rounded-card border border-card-line bg-surface px-5 py-8 sm:px-8 md:py-10">
        <div className="max-w-2xl">
          <h2 id="doi-tac-tieu-de" className="font-display text-heading-sm font-bold text-title md:text-heading">
            Nơi ban tổ chức chọn để bán vé
          </h2>
          <p className="mt-2 text-body text-fg-muted">
            Từ đêm nhạc vài trăm khách tới lễ hội hàng chục nghìn người, vé được giữ đúng 10 phút, thanh toán xong là có mã QR.
          </p>
        </div>

        {/* Cả lưới hiện một lần: hiện từng ô thì nền xám làm đường kẻ giữa các ô lộ ra như ô trống trong lúc chờ */}
        <m.dl {...inView} variants={fadeUp} className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-input border border-line bg-line lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col bg-surface px-4 py-4 sm:px-5 sm:py-5">
              {/* dt đứng trước dd trong HTML để trình đọc màn hình đọc "sự kiện đã bán vé: 1.200+". order đưa con số lên trên cùng */}
              <dt className="order-2 mt-1 text-body-sm font-semibold text-fg">{s.label}</dt>
              <dd className="order-1 font-display text-heading-sm font-extrabold text-title tabular-nums sm:text-heading">
                <CountUp to={s.to} decimals={s.decimals} suffix={s.suffix} />
              </dd>
              <dd className="order-3 mt-1 text-body-sm text-fg-muted">{s.note}</dd>
            </div>
          ))}
        </m.dl>

        <div className="mt-10">
          <h3 className="text-body-sm font-semibold text-fg-muted">Đối tác chiến lược</h3>
          {/*
            Băng chạy ngang lặp vô hạn: danh sách in hai lần liền nhau, cả dải trượt sang trái đúng một nửa rồi lặp lại
            nên không thấy chỗ nối. Hai mép mờ dần bằng mask. Rê chuột hoặc Tab vào thì dừng để đọc.
            Máy bật giảm chuyển động: không chạy, bản sao bị ẩn, danh sách xuống dòng như lưới.
          */}
          <div className="group mt-3 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] motion-reduce:[mask-image:none]">
            <ul className="flex w-max gap-3 animate-[partners-marquee_32s_linear_infinite] group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:w-auto motion-reduce:flex-wrap motion-reduce:animate-none">
              {PARTNERS.map((p) => (
                <li key={p.name} className={partnerItem}>
                  <PartnerCard partner={p} />
                </li>
              ))}
              {/* Bản sao để vòng lặp liền mạch: trình đọc màn hình bỏ qua */}
              {PARTNERS.map((p) => (
                <li key={`${p.name}-copy`} aria-hidden="true" className={`${partnerItem} motion-reduce:hidden`}>
                  <PartnerCard partner={p} />
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-2 text-caption text-fg-muted">Ảnh minh hoạ: {PARTNERS.map((p) => p.credit).join(', ')} trên Unsplash.</p>
        </div>
      </div>
    </section>
  )
}
