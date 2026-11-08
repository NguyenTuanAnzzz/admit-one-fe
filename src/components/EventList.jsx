import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, m } from 'framer-motion'
import { getPublicEvents } from '../api/publicEventApi'
import { EVENT_STATUS, EVENT_STATUS_LABEL, EVENT_STATUS_STYLE } from '../lib/eventStatus'
import { formatDuration, formatMoney, hanoiParts, secondsUntil, useNow } from '../lib/format'
import { EASE_OUT } from '../lib/motion'
import { GhostButton } from './Button'
import { FloatingNote, Mascot } from './Mascot'
import { Perforation, SectionHeading } from './ui'

// Số thẻ trên trang chủ. Xem hết ở /events
const LIMIT = 8

// '' là tất cả. Lọc ở backend qua tham số status của GET /api/events
const FILTERS = ['', EVENT_STATUS.ON_SALE, EVENT_STATUS.UPCOMING, EVENT_STATUS.SOLD_OUT]

/**
 * Thẻ hiện lần lượt ngay khi được gắn vào trang (lúc tải và mỗi lần đổi bộ lọc), mờ đi khi bị bộ lọc loại ra.
 * Không chờ cuộn tới (IntersectionObserver): danh sách ở gần đầu trang, thẻ không được phép có lúc vô hình.
 */
const cardMotion = {
  hidden: { opacity: 0, y: 20 },
  show: (i) => ({ opacity: 1, y: 0, transition: { delay: Math.min(i, 6) * 0.06, duration: 0.45, ease: EASE_OUT } }),
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.18 } },
}

const seeAllLink = 'inline-flex min-h-11 items-center font-semibold text-title underline underline-offset-4 hover:text-fg-muted'

/** Lưới sự kiện trên trang chủ (C-02): sự kiện đã công bố từ GET /api/events, lọc theo trạng thái ở backend. */
export function EventList() {
  const [filter, setFilter] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  // key = bộ lọc đã tải xong: đổi bộ lọc thì tự coi là đang tải, không phải setState trong effect
  const [result, setResult] = useState({ key: null, events: [], error: null })
  const now = useNow()

  const key = `${filter}#${reloadKey}`

  useEffect(() => {
    let cancelled = false
    getPublicEvents({ status: filter, page: 0, size: LIMIT })
      .then((data) => !cancelled && setResult({ key, events: data.items, error: null }))
      .catch((err) => !cancelled && setResult({ key, events: [], error: err.message }))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // Đang tải bộ lọc mới vẫn giữ thẻ cũ (làm mờ) để lưới không nháy trắng
  const loading = result.key !== key
  const firstLoad = loading && result.key === null
  const { events, error } = result

  return (
    <section id="events" aria-labelledby="events-tieu-de" className="px-gutter py-section-sm md:py-section">
      <div className="mx-auto max-w-page">
        <SectionHeading
          id="events-tieu-de"
          title={
            <span className="inline-flex items-end gap-2">
              {/* Linh vật ca sĩ đứng cạnh tiêu đề, chỉ trang trí */}
              <Mascot pose="singer" className="-mb-1 h-20 w-auto shrink-0 md:h-24" />
              Sự kiện nổi bật
              <FloatingNote delay={0.6} className="mb-8 hidden w-6 sm:block" />
            </span>
          }
        >
          <div role="group" aria-label="Lọc theo trạng thái" className="flex flex-wrap gap-2">
            {FILTERS.map((s) => (
              <button
                key={s || 'all'}
                type="button"
                aria-pressed={filter === s}
                onClick={() => setFilter(s)}
                className="min-h-11 rounded-pill border border-line bg-surface px-5 text-body-sm font-semibold text-fg transition-colors hover:border-fg hover:underline aria-pressed:border-chip-active-line aria-pressed:bg-chip-active aria-pressed:text-chip-active-fg"
              >
                {s ? EVENT_STATUS_LABEL[s] : 'Tất cả'}
              </button>
            ))}
          </div>
        </SectionHeading>

        <div className={`mt-6 transition-opacity ${loading && !firstLoad ? 'opacity-60' : ''}`} aria-live="polite" aria-busy={loading}>
          {firstLoad && <LoadingCards />}

          {!loading && error && (
            <div className="rounded-card border border-card-line bg-card px-6 py-10 text-center">
              <p className="text-subheading font-semibold text-title">{error}</p>
              <p className="mt-2 text-body text-fg-muted">Kiểm tra kết nối mạng rồi thử lại. Vé bạn đang giữ (nếu có) không bị ảnh hưởng.</p>
              <GhostButton type="button" onClick={() => setReloadKey((k) => k + 1)} className="mt-6">
                Tải lại danh sách
              </GhostButton>
            </div>
          )}

          {!firstLoad && !error && events.length === 0 && (
            <div className="rounded-card border border-card-line bg-card px-6 py-10 text-center">
              <Mascot pose="ticket" className="mx-auto h-28 w-auto" />
              <p className="mt-2 text-subheading font-semibold text-title">{filter ? `Chưa có sự kiện ${EVENT_STATUS_LABEL[filter].toLowerCase()}` : 'Chưa có sự kiện nào được công bố'}</p>
              <p className="mt-2 text-body text-fg-muted">Lịch mới thường được công bố trước ngày mở bán ít nhất hai tuần.</p>
              {filter && (
                <GhostButton type="button" onClick={() => setFilter('')} className="mt-6">
                  Xem tất cả sự kiện
                </GhostButton>
              )}
            </div>
          )}

          {!firstLoad && !error && events.length > 0 && (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {events.map((e, i) => (
                  <EventCard key={e.id} index={i} event={e} now={now} />
                ))}
              </AnimatePresence>
            </ul>
          )}

          {!firstLoad && !error && (
            <p className="mt-6 text-right">
              <Link to={filter ? `/events?status=${filter}` : '/events'} className={seeAllLink}>
                Xem tất cả sự kiện →
              </Link>
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function EventCard({ ref, index, event: e, now }) {
  const d = hanoiParts(e.startsAt)
  const untilSale = secondsUntil(e.saleOpensAt, now)
  const soldOut = e.status === EVENT_STATUS.SOLD_OUT
  const price = e.priceFrom != null ? formatMoney(Number(e.priceFrom)) : null

  return (
    <m.li
      ref={ref}
      custom={index}
      variants={cardMotion}
      initial="hidden"
      animate="show"
      exit="exit"
      whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 26 } }}
      className="relative flex flex-col overflow-hidden rounded-card border border-card-line bg-card transition-shadow focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus hover:border-card-line-hover hover:shadow-card-hover"
    >
      <div className="relative">
        {e.posterUrl ? (
          <img src={e.posterUrl} alt="" width="1024" height="1024" loading="lazy" className="aspect-[4/3] w-full object-cover" />
        ) : (
          // Sự kiện chưa có poster: một cuống vé in ngày diễn, cùng mô-típ vé giấy với logo và phiếu giữ vé
          <div aria-hidden="true" className="flex aspect-[4/3] w-full items-center justify-center bg-surface-sunken">
            <div className={`relative flex w-3/4 max-w-56 rounded-input border border-line bg-ticket ${soldOut ? 'text-fg-muted' : 'text-title'}`}>
              <span className="absolute top-1/2 -left-2 size-4 -translate-y-1/2 rounded-full bg-surface-sunken shadow-notch-left" />
              <span className="absolute top-1/2 -right-2 size-4 -translate-y-1/2 rounded-full bg-surface-sunken shadow-notch-right" />
              <div className="flex flex-col items-center justify-center border-r border-dashed border-ticket-perforation px-4 py-3">
                <span className="font-display text-heading-lg leading-none font-extrabold tabular-nums">{d.day}</span>
                <span className="mt-1 text-caption font-semibold">Tháng {d.month}</span>
              </div>
              <div className="flex min-w-0 flex-col justify-center px-3 py-3 text-caption">
                <span className="font-semibold">{d.weekday}</span>
                <span className="text-fg-muted">{d.time}</span>
              </div>
            </div>
          </div>
        )}
        <span className={`absolute top-4 left-5 inline-flex items-center rounded-badge px-2.5 py-1 text-caption font-semibold ${EVENT_STATUS_STYLE[e.status] ?? ''}`}>
          {EVENT_STATUS_LABEL[e.status] ?? e.status}
        </span>
      </div>

      <Perforation notchClass="bg-canvas" />

      <div className="flex flex-1 flex-col px-5 pt-2 pb-5">
        {/* Tên là link duy nhất của thẻ; lớp after phủ cả thẻ nên bấm chỗ nào trên thẻ cũng mở trang chi tiết */}
        <h3 className={`font-display text-heading-sm font-bold ${soldOut ? 'text-fg-muted' : 'text-title'}`}>
          <Link to={`/events/${e.id}`} className="after:absolute after:inset-0 hover:underline focus-visible:outline-none">
            {e.name}
          </Link>
        </h3>
        <p className="mt-1 text-body-sm text-fg">
          {d.time}, {d.weekday} {d.day}/{d.month}/{d.year}
        </p>
        <p className="text-body-sm text-fg">{e.venue}</p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          {e.status === EVENT_STATUS.UPCOMING && untilSale > 0 ? (
            <div className="text-body-sm">
              <p className="text-fg-muted">Mở bán sau</p>
              <p className="font-display text-subheading font-bold text-title tabular-nums">{formatDuration(untilSale)}</p>
            </div>
          ) : (
            <div className="text-body-sm">
              <p className="text-fg-muted">Giá từ</p>
              <p className={`font-display text-subheading font-bold tabular-nums ${soldOut ? 'text-fg-muted line-through' : 'text-action'}`}>{price ?? 'Đang cập nhật'}</p>
            </div>
          )}
          <span aria-hidden="true" className="inline-flex min-h-11 shrink-0 items-center gap-1 px-1 text-body-sm font-semibold text-fg underline underline-offset-4">
            Chi tiết →
          </span>
        </div>
      </div>
    </m.li>
  )
}

function LoadingCards() {
  return (
    <div>
      <p className="sr-only">Đang tải danh sách sự kiện</p>
      <ul aria-hidden="true" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="overflow-hidden rounded-card border border-card-line bg-card">
            <div className="aspect-[4/3] animate-pulse bg-surface-sunken motion-reduce:animate-none" />
            <div className="space-y-2 p-card">
              <div className="h-5 w-3/4 animate-pulse rounded-input bg-surface-sunken motion-reduce:animate-none" />
              <div className="h-4 w-1/2 animate-pulse rounded-input bg-surface-sunken motion-reduce:animate-none" />
              <div className="h-6 w-1/3 animate-pulse rounded-input bg-surface-sunken motion-reduce:animate-none" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
