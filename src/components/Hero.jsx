import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import { getPublicEvents } from '../api/publicEventApi'
import { EVENT_STATUS, EVENT_STATUS_LABEL, EVENT_STATUS_STYLE } from '../lib/eventStatus'
import { formatDuration, formatMoney, hanoiParts, secondsUntil, useNow } from '../lib/format'
import { EASE_OUT } from '../lib/motion'

// Số sự kiện xoay vòng và thời gian mỗi sự kiện đứng trên màn hình
const SLIDE_COUNT = 5
const SLIDE_MS = 6000

const buyLink =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-pill border-[1.5px] border-button-primary bg-button-primary px-7 text-body font-semibold text-button-primary-fg transition-colors hover:border-button-primary-hover hover:bg-button-primary-hover'
const controlButton = 'inline-flex size-11 items-center justify-center rounded-full text-fg-muted hover:bg-surface-sunken hover:text-title'

const shell = 'mx-auto grid max-w-page items-center gap-8 rounded-card border border-line bg-surface p-5 sm:p-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-12'

/** Một dòng nhỏ dưới nhãn trạng thái: còn bao lâu tới giờ mở bán, hoặc đã mở bán từ lúc nào */
function SaleNote({ event, now }) {
  const untilSale = secondsUntil(event.saleOpensAt, now)
  const sale = hanoiParts(event.saleOpensAt)
  if (event.status === EVENT_STATUS.UPCOMING && untilSale > 0) {
    return (
      <p className="text-body-sm text-fg-muted">
        Mở bán sau <span className="font-semibold text-title tabular-nums">{formatDuration(untilSale)}</span>
      </p>
    )
  }
  if (event.status === EVENT_STATUS.SOLD_OUT) return <p className="text-body-sm text-fg-muted">Đã bán hết vé</p>
  return (
    <p className="text-body-sm text-fg-muted">
      Đang mở bán từ {sale.time}, {sale.day}/{sale.month}/{sale.year}
    </p>
  )
}

/** Nội dung một sự kiện: thông tin và nút mua bên trái, poster bên phải. Không có poster thì hiện cuống vé in ngày diễn */
function Slide({ event, now, index, total }) {
  const d = hanoiParts(event.startsAt)
  const soldOut = event.status === EVENT_STATUS.SOLD_OUT

  return (
    <m.div
      key={event.id}
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} trên ${total}: ${event.name}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className={shell}
    >
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center rounded-badge px-2.5 py-1 text-caption font-semibold ${EVENT_STATUS_STYLE[event.status] ?? ''}`}>
            {EVENT_STATUS_LABEL[event.status] ?? event.status}
          </span>
          <SaleNote event={event} now={now} />
        </div>

        <h2 className="mt-6 font-display text-heading-lg font-extrabold text-balance text-title sm:text-display">{event.name}</h2>

        <dl className="mt-10 grid gap-6 border-t border-line pt-6 sm:grid-cols-3">
          <div>
            <dt className="text-caption text-fg-muted">Ngày diễn</dt>
            <dd className="mt-1 font-display text-subheading font-semibold text-title">
              {d.day}.{d.month}.{d.year}
            </dd>
            <dd className="text-body-sm text-fg-muted">
              {d.weekday}, {d.time}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-fg-muted">Nơi diễn</dt>
            <dd className="mt-1 font-display text-subheading font-semibold text-title">{event.venue}</dd>
          </div>
          <div>
            <dt className="text-caption text-fg-muted">Giá vé</dt>
            <dd className="mt-1 font-display text-subheading font-semibold text-title tabular-nums">
              {event.priceFrom != null ? `Từ ${formatMoney(Number(event.priceFrom))}` : 'Đang cập nhật'}
            </dd>
            <dd className="text-body-sm text-fg-muted">Tối đa 4 vé mỗi tài khoản</dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link to={`/events/${event.id}`} className={buyLink}>
            {soldOut ? 'Xem sự kiện' : 'Mua vé'}
            <span className="sr-only"> {event.name}</span>
          </Link>
          <p className="text-body-sm text-fg-muted">Vé được giữ 10 phút để bạn thanh toán.</p>
        </div>
      </div>

      {event.posterUrl ? (
        <img
          src={event.posterUrl}
          alt={`Poster ${event.name}`}
          width="1024"
          height="1024"
          // Sự kiện đầu là ảnh chính của trang: tải ngay. Các sự kiện sau chỉ tải khi tới lượt
          fetchPriority={index === 0 ? 'high' : 'auto'}
          className="aspect-[4/3] w-full rounded-card border border-line object-cover lg:aspect-[3/4]"
        />
      ) : (
        <div aria-hidden="true" className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-card border border-dashed border-line-strong bg-surface-sunken text-title lg:aspect-[3/4]">
          <span className="font-display text-display leading-none font-extrabold tabular-nums">{d.day}</span>
          <span className="mt-2 text-body font-semibold">Tháng {d.month}</span>
        </div>
      )}
    </m.div>
  )
}

/**
 * Đầu trang chủ: 5 sự kiện mới công bố (GET /api/events, backend xếp mới nhất lên đầu) hiện lần lượt.
 * Mỗi sự kiện đứng 6 giây rồi mờ đi, sự kiện sau hiện lên, hết thì quay lại sự kiện đầu.
 * Dừng khi bấm Tạm dừng, khi dùng phím Tab đi vào khung, khi tab trình duyệt bị ẩn, và khi máy bật giảm chuyển động
 * (vẫn chuyển được bằng các chấm). Không dừng khi rê chuột: khung chiếm gần hết màn hình, chuột nằm trên đó là chuyện thường.
 * Chấm đang chọn có thanh chạy cho biết còn bao lâu tới sự kiện sau. Chỉ có một sự kiện thì đứng yên, không có chấm.
 */
export function Hero() {
  const now = useNow()
  const reduceMotion = useReducedMotion()
  const [state, setState] = useState({ loading: true, events: [], error: null })
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  // Đang dùng bàn phím (Tab) ở trong khung thì tạm dừng để kịp đọc, rời ra thì chạy tiếp.
  // Bấm chuột vào chấm cũng làm nút được focus nhưng không phải focus-visible, nên không tính
  const [keyboardInside, setKeyboardInside] = useState(false)

  useEffect(() => {
    let cancelled = false
    getPublicEvents({ page: 0, size: SLIDE_COUNT })
      .then((data) => !cancelled && setState({ loading: false, events: data.items, error: null }))
      .catch((err) => !cancelled && setState({ loading: false, events: [], error: err.message }))
    return () => {
      cancelled = true
    }
  }, [])

  const { loading, events, error } = state
  const total = events.length
  const autoplay = total > 1 && !paused && !keyboardInside && !reduceMotion

  useEffect(() => {
    if (!autoplay) return
    const id = setInterval(() => {
      // Tab trình duyệt đang ẩn thì đứng yên, quay lại vẫn thấy đúng sự kiện đang xem dở
      if (document.visibilityState === 'visible') setIndex((i) => (i + 1) % total)
    }, SLIDE_MS)
    return () => clearInterval(id)
  }, [autoplay, total, index])

  if (loading) {
    return (
      <section aria-label="Sự kiện mới nhất" aria-busy="true" className="px-gutter pt-6 md:pt-8">
        <div className={shell}>
          <div className="space-y-4">
            <div className="h-6 w-40 animate-pulse rounded-input bg-surface-sunken motion-reduce:animate-none" />
            <div className="h-14 w-4/5 animate-pulse rounded-input bg-surface-sunken motion-reduce:animate-none" />
            <div className="h-24 w-full animate-pulse rounded-input bg-surface-sunken motion-reduce:animate-none" />
          </div>
          <div className="aspect-[4/3] w-full animate-pulse rounded-card bg-surface-sunken motion-reduce:animate-none lg:aspect-[3/4]" />
        </div>
      </section>
    )
  }

  if (error || total === 0) {
    return (
      <section aria-labelledby="hero-tieu-de" className="px-gutter pt-6 md:pt-8">
        <div className="mx-auto max-w-page rounded-card border border-line bg-surface p-5 text-center sm:p-10">
          <h1 id="hero-tieu-de" className="font-display text-heading font-extrabold text-title sm:text-heading-lg">
            Vé điện tử cho concert và sự kiện
          </h1>
          <p className="mt-3 text-body text-fg-muted">{error ? 'Chưa tải được sự kiện mới nhất. Bạn vẫn xem được danh sách đầy đủ.' : 'Sự kiện mới sẽ xuất hiện ở đây ngay khi được công bố.'}</p>
          <Link to="/events" className={`${buyLink} mt-6`}>
            Xem tất cả sự kiện
          </Link>
        </div>
      </section>
    )
  }

  const current = events[Math.min(index, total - 1)]

  return (
    <section
      aria-roledescription="carousel"
      aria-labelledby="hero-tieu-de"
      className="px-gutter pt-6 md:pt-8"
      onFocus={(e) => e.target.matches(':focus-visible') && setKeyboardInside(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setKeyboardInside(false)}
    >
      {/* Tiêu đề trang cho trình đọc màn hình. Tên từng sự kiện là h2 trong khung */}
      <h1 id="hero-tieu-de" className="sr-only">
        Sự kiện mới nhất
      </h1>

      {/* Khung giữ chỗ bằng ô lưới chồng nhau: sự kiện cũ mờ đi và sự kiện mới hiện lên cùng một chỗ, trang không bị giật */}
      <div className="grid [&>*]:col-start-1 [&>*]:row-start-1" aria-live={autoplay ? 'off' : 'polite'}>
        <AnimatePresence initial={false}>
          <Slide key={current.id} event={current} now={now} index={index} total={total} />
        </AnimatePresence>
      </div>

      {total > 1 && (
        <div className="mx-auto mt-3 flex max-w-page items-center justify-center gap-2">
          <ul className="flex items-center gap-1" aria-label="Chọn sự kiện">
            {events.map((e, i) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Sự kiện ${i + 1}: ${e.name}`}
                  aria-current={i === index ? 'true' : undefined}
                  className="group inline-flex size-11 items-center justify-center"
                >
                  {i === index ? (
                    // Chấm đang chọn: thanh cam chạy đầy trong 6 giây rồi sang sự kiện sau. Tạm dừng thì thanh đứng lại.
                    // key đổi mỗi lần chuyển nên thanh chạy lại từ đầu; không tự chạy thì hiện đầy
                    <span className="block h-2 w-8 overflow-hidden rounded-pill bg-line-strong">
                      <span
                        key={`${index}-${autoplay}`}
                        className={`block h-full rounded-pill bg-action ${autoplay ? 'animate-[hero-progress_6s_linear_forwards]' : 'w-full'}`}
                        style={{ animationPlayState: autoplay ? 'running' : 'paused' }}
                      />
                    </span>
                  ) : (
                    <span className="block h-2 w-2 rounded-pill bg-line-strong group-hover:bg-fg-muted" />
                  )}
                </button>
              </li>
            ))}
          </ul>
          {!reduceMotion && (
            <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Tiếp tục chuyển sự kiện' : 'Tạm dừng chuyển sự kiện'} className={controlButton}>
              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="currentColor">
                {paused ? <path d="M4 2.5v11l9-5.5z" /> : <path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" />}
              </svg>
            </button>
          )}
        </div>
      )}
    </section>
  )
}
