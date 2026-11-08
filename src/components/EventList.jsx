import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { STATUS, STATUS_LABEL, fetchEvents } from '../lib/api'
import { formatCount, formatDuration, formatMoney, hanoiParts, secondsUntil, useNow } from '../lib/format'
import { EASE_OUT } from '../lib/motion'
import { GhostButton } from './Button'
import { Perforation, SectionHeading, StatusBadge } from './ui'

const FILTERS = [
  { id: 'tat-ca', label: 'Tất cả' },
  { id: STATUS.ON_SALE, label: STATUS_LABEL[STATUS.ON_SALE] },
  { id: STATUS.UPCOMING, label: STATUS_LABEL[STATUS.UPCOMING] },
  { id: STATUS.SOLD_OUT, label: STATUS_LABEL[STATUS.SOLD_OUT] },
]

/**
 * Thẻ hiện lần lượt ngay khi được gắn vào trang (lúc tải và mỗi lần đổi bộ lọc), mờ đi khi bị bộ lọc loại ra.
 * Không chờ cuộn tới (IntersectionObserver): danh sách ở gần đầu trang, thẻ không được phép có lúc vô hình.
 */
const cardMotion = {
  hidden: { opacity: 0, y: 20 },
  show: (i) => ({ opacity: 1, y: 0, transition: { delay: Math.min(i, 6) * 0.06, duration: 0.45, ease: EASE_OUT } }),
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.18 } },
}

const normalize = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

/** Lưới thẻ sự kiện kiểu sàn thương mại: lọc theo trạng thái (C-02) và theo từ khóa tìm kiếm ở header. */
export function EventList({ query, onClearQuery }) {
  const [state, setState] = useState({ status: 'loading', events: [], error: null })
  const [filter, setFilter] = useState('tat-ca')
  const [openId, setOpenId] = useState(null)
  const now = useNow()

  const request = useCallback(() => {
    fetchEvents()
      .then((events) => setState({ status: 'ready', events, error: null }))
      .catch((error) => setState({ status: 'error', events: [], error }))
  }, [])

  useEffect(() => {
    request()
  }, [request])

  const retry = () => {
    setState({ status: 'loading', events: [], error: null })
    request()
  }

  const q = normalize(query)
  const visible = state.events.filter(
    (e) => (filter === 'tat-ca' || e.status === filter) && (!q || normalize(`${e.title} ${e.venue} ${e.address}`).includes(q)),
  )

  const clearAll = () => {
    setFilter('tat-ca')
    onClearQuery()
  }

  return (
    <section id="events" aria-labelledby="events-tieu-de" className="px-gutter py-section-sm md:py-section">
      <div className="mx-auto max-w-page">
        <SectionHeading id="events-tieu-de" title="Sự kiện nổi bật">
          <div role="group" aria-label="Lọc theo trạng thái" className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
                className="min-h-11 rounded-pill border border-line bg-surface px-5 text-body-sm font-semibold text-fg transition-colors hover:border-fg hover:underline aria-pressed:border-action aria-pressed:border-chip-active-line aria-pressed:bg-chip-active aria-pressed:text-chip-active-fg"
              >
                {f.label}
              </button>
            ))}
          </div>
        </SectionHeading>

        {query && (
          <p className="mt-4 flex flex-wrap items-center gap-2 text-body-sm text-fg-muted">
            Kết quả cho “<span className="font-semibold text-fg">{query}</span>”
            <button type="button" onClick={onClearQuery} className="min-h-11 rounded-input px-2 font-semibold text-title underline underline-offset-4 hover:text-fg-muted">
              Xóa từ khóa
            </button>
          </p>
        )}

        <div className="mt-6" aria-live="polite" aria-busy={state.status === 'loading'}>
          {state.status === 'loading' && <LoadingCards />}

          {state.status === 'error' && (
            <div className="rounded-card border border-card-line bg-card px-6 py-10 text-center">
              <p className="text-subheading font-semibold text-title">{state.error.message}</p>
              <p className="mt-2 text-body text-fg-muted">Kiểm tra kết nối mạng rồi thử lại. Vé bạn đang giữ (nếu có) không bị ảnh hưởng.</p>
              <GhostButton type="button" onClick={retry} className="mt-6">
                Tải lại danh sách
              </GhostButton>
            </div>
          )}

          {state.status === 'ready' && visible.length === 0 && (
            <div className="rounded-card border border-card-line bg-card px-6 py-10 text-center">
              <p className="text-subheading font-semibold text-title">Không có sự kiện phù hợp</p>
              <p className="mt-2 text-body text-fg-muted">Thử từ khóa khác hoặc bỏ bộ lọc. Lịch mới thường được công bố trước ngày mở bán ít nhất hai tuần.</p>
              <GhostButton type="button" onClick={clearAll} className="mt-6">
                Xem tất cả sự kiện
              </GhostButton>
            </div>
          )}

          {state.status === 'ready' && visible.length > 0 && (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {visible.map((e, i) => (
                  <EventCard key={e.id} index={i} event={e} now={now} open={openId === e.id} onToggle={() => setOpenId(openId === e.id ? null : e.id)} />
                ))}
              </AnimatePresence>
            </ul>
          )}

          {state.status === 'ready' && (
            <p className="mt-5 text-body-sm text-fg-muted">
              Ba sự kiện sau VŨ. Live Concert là dữ liệu mẫu để thử bộ lọc, sẽ được thay bằng dữ liệu thật từ hệ thống.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function EventCard({ ref, index, event: e, now, open, onToggle }) {
  const d = hanoiParts(e.startsAt)
  const sale = hanoiParts(e.saleOpensAt)
  const untilSale = secondsUntil(e.saleOpensAt, now)
  const soldOut = e.status === STATUS.SOLD_OUT
  const panelId = `chi-tiet-${e.id}`

  return (
    <m.li
      ref={ref}
      custom={index}
      variants={cardMotion}
      initial="hidden"
      animate="show"
      exit="exit"
      whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 26 } }}
      className="flex flex-col overflow-hidden rounded-card border border-card-line bg-card transition-shadow hover:border-card-line-hover hover:shadow-card-hover"
    >
      <div className="relative">
        {e.poster ? (
          <img src={e.poster} alt="" width="1024" height="1024" loading="lazy" className="aspect-[4/3] w-full object-cover" />
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
        <StatusBadge status={e.status} className="absolute top-4 left-5" />
      </div>

      <Perforation notchClass="bg-canvas" />

      <div className="flex flex-1 flex-col px-5 pt-2 pb-5">
        <h3 className={`font-display text-heading-sm font-bold ${soldOut ? 'text-fg-muted' : 'text-title'}`}>{e.title}</h3>
        <p className="mt-1 text-body-sm text-fg">
          {d.time}, {d.weekday} {d.day}/{d.month}
        </p>
        <p className="text-body-sm text-fg">{e.venue}</p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          {e.status === STATUS.UPCOMING ? (
            <div className="text-body-sm">
              <p className="text-fg-muted">Mở bán sau</p>
              <p className="font-display text-subheading font-bold text-title tabular-nums">{formatDuration(untilSale)}</p>
            </div>
          ) : (
            <div className="text-body-sm">
              <p className="text-fg-muted">Giá từ</p>
              <p className={`font-display text-subheading font-bold tabular-nums ${soldOut ? 'text-fg-muted line-through' : 'text-action'}`}>{formatMoney(e.priceFrom)}</p>
            </div>
          )}
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={panelId}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-pill px-3 text-body-sm font-semibold text-fg underline underline-offset-4 hover:text-title"
          >
            {open ? 'Thu gọn' : 'Chi tiết'}
            <svg aria-hidden="true" viewBox="0 0 16 16" className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="m4 6 4 4 4-4" />
            </svg>
          </button>
        </div>

        {open && (
          <div id={panelId} className="mt-3 border-t border-line pt-3">
            <dl className="space-y-2 text-body-sm">
              <div>
                <dt className="text-fg-muted">Địa chỉ</dt>
                <dd>{e.address}</dd>
              </div>
              <div>
                <dt className="text-fg-muted">Giá vé</dt>
                <dd>
                  {formatMoney(e.priceFrom)} đến {formatMoney(e.priceTo)}, {formatCount(e.seats)} vé
                </dd>
              </div>
              <div>
                <dt className="text-fg-muted">{untilSale > 0 ? 'Giờ mở bán' : 'Đã mở bán từ'}</dt>
                <dd>
                  {sale.time}, {sale.day}/{sale.month}/{sale.year}
                </dd>
              </div>
            </dl>
            {e.featured ? (
              <a href="/events" className="mt-3 inline-flex min-h-11 items-center text-body-sm font-semibold text-title underline underline-offset-4 hover:text-fg-muted">
                Xem giá vé
              </a>
            ) : (
              <p className="mt-3 text-body-sm text-fg-muted">Trang chi tiết của sự kiện này chưa được dựng trong bản demo.</p>
            )}
          </div>
        )}
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
