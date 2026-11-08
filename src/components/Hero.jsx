import { m } from 'framer-motion'
import { FEATURED_EVENT as ev, STATUS } from '../lib/api'
import { formatCount, formatMoney, hanoiParts } from '../lib/format'
import { fadeUp, stagger } from '../lib/motion'
import { PrimaryButton } from './Button'
import { StatusBadge } from './ui'

/**
 * Sự kiện nổi bật dạng trang sản phẩm: thông tin và nút mua bên trái, poster dọc bên phải.
 * Cam san hô chỉ xuất hiện ở nút mua. Khi mở trang: các dòng thông tin hiện lần lượt, poster hiện ngay.
 */
export function Hero() {
  const d = hanoiParts(ev.startsAt)

  return (
    <section aria-labelledby="hero-tieu-de" className="px-gutter pt-6 md:pt-8">
      <div className="mx-auto grid max-w-page items-center gap-8 rounded-card border border-line bg-surface p-5 sm:p-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-12">
        <m.div variants={stagger(0.09, 0.15)} initial="hidden" animate="show">
          <m.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
            <StatusBadge status={STATUS.ON_SALE} />
            <p className="text-body-sm text-fg-muted">{ev.saleNote}</p>
          </m.div>

          <m.h1 variants={fadeUp} id="hero-tieu-de" className="mt-6 font-display text-heading-lg font-extrabold text-balance text-title sm:text-display">
            {ev.title}
          </m.h1>
          <m.p variants={fadeUp} className="mt-3 font-display text-heading-sm font-semibold text-fg-muted">{ev.subtitle}</m.p>

          <m.dl variants={fadeUp} className="mt-10 grid gap-6 border-t border-line pt-6 sm:grid-cols-3">
            <div>
              <dt className="text-caption text-fg-muted">Ngày diễn</dt>
              <dd className="mt-1 font-display text-subheading font-semibold text-title">
                {d.day}.{d.month}.{d.year}
              </dd>
              <dd className="text-body-sm text-fg-muted">
                {d.weekday}, {d.time} · mở cửa {ev.doorsOpen}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-fg-muted">Nơi diễn</dt>
              <dd className="mt-1 font-display text-subheading font-semibold text-title">{ev.venue}</dd>
              <dd className="text-body-sm text-fg-muted">{ev.address}</dd>
            </div>
            <div>
              <dt className="text-caption text-fg-muted">Còn trống</dt>
              <dd className="mt-1 font-display text-subheading font-semibold text-title tabular-nums">
                {formatCount(ev.stats.available)} / {formatCount(ev.stats.total)} vé
              </dd>
              <dd className="text-body-sm text-fg-muted">Tối đa 4 vé mỗi tài khoản</dd>
            </div>
          </m.dl>

          <m.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <PrimaryButton as="a" href="#events" className="min-h-12 px-7 text-body">
              Mua vé · từ {formatMoney(ev.priceFrom)}
            </PrimaryButton>
            <p className="text-body-sm text-fg-muted">Vé được giữ 10 phút để bạn thanh toán.</p>
          </m.div>
        </m.div>

        {/* Poster hiện ngay (ảnh chính của trang, không làm mờ lúc đầu). Điện thoại: khung ngang, nằm sau nút mua */}
        <div>
          <img
            src={ev.poster}
            alt={`Poster ${ev.title}`}
            width="1024"
            height="1024"
            fetchPriority="high"
            className="aspect-[4/3] w-full rounded-card border border-line object-cover lg:aspect-[3/4]"
          />
        </div>
      </div>
    </section>
  )
}
