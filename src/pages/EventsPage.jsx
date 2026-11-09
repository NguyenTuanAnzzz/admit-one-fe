import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getPublicEvents } from '../api/publicEventApi'
import { GhostButton } from '../components/Button'
import { Perforation } from '../components/ui'
import useEventPage from '../hook/useEventPage'
import { EVENT_STATUS, EVENT_STATUS_LABEL, EVENT_STATUS_STYLE } from '../lib/eventStatus'
import { formatDuration, formatMoney, hanoiParts, secondsUntil, useNow } from '../lib/format'
import { pageWindow } from '../lib/pagination'

const PAGE_SIZE = 12

// Khách chỉ thấy 3 trạng thái này (backend lọc bỏ bản nháp và đã huỷ)
const FILTERS = ['', EVENT_STATUS.ON_SALE, EVENT_STATUS.UPCOMING, EVENT_STATUS.SOLD_OUT]

const input =
  'block min-h-11 w-full rounded-input bg-surface px-3 text-body-sm text-fg ring-1 ring-input-line outline-none placeholder:text-fg-placeholder focus-visible:ring-2 focus-visible:ring-focus'
const chip =
  'min-h-11 rounded-pill border border-line bg-surface px-5 text-body-sm font-semibold text-fg transition-colors hover:border-fg aria-pressed:border-chip-active-line aria-pressed:bg-chip-active aria-pressed:text-chip-active-fg'
const pageButton = (active) =>
  `inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill px-3 text-body-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
    active ? 'bg-chip-active text-chip-active-fg' : 'text-fg hover:bg-surface-sunken'
  }`

/** Thẻ sự kiện cùng kiểu với trang chủ: poster hoặc cuống vé in ngày diễn, đường xé, nhãn trạng thái. */
function EventCard({ event: e, now }) {
  const d = hanoiParts(e.startsAt)
  const sale = hanoiParts(e.saleOpensAt)
  const untilSale = secondsUntil(e.saleOpensAt, now)
  const ended = e.status === EVENT_STATUS.ENDED
  // Hết vé hoặc đã diễn ra: thẻ xám đi, không mua được nữa
  const soldOut = e.status === EVENT_STATUS.SOLD_OUT || ended

  return (
    <li className="relative flex flex-col overflow-hidden rounded-card border border-card-line bg-card transition-shadow focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus hover:border-card-line-hover hover:shadow-card-hover">
      <div className="relative">
        {e.posterUrl ? (
          <img src={e.posterUrl} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
        ) : (
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
        <h2 className={`font-display text-heading-sm font-bold ${soldOut ? 'text-fg-muted' : 'text-title'}`}>
          <Link to={`/events/${e.id}`} className="after:absolute after:inset-0 hover:underline focus-visible:outline-none">
            {e.name}
          </Link>
        </h2>
        <p className="mt-1 text-body-sm text-fg">
          {d.time}, {d.weekday} {d.day}/{d.month}/{d.year}
        </p>
        <p className="text-body-sm text-fg">{e.venue}</p>
        {e.priceFrom != null && <p className="mt-2 text-body-sm font-semibold text-action-fg">Từ {formatMoney(Number(e.priceFrom))}</p>}

        <div className="mt-auto pt-4 text-body-sm">
          {e.status === EVENT_STATUS.UPCOMING && untilSale > 0 ? (
            <>
              <p className="text-fg-muted">Mở bán sau</p>
              <p className="font-display text-subheading font-bold text-title tabular-nums">{formatDuration(untilSale)}</p>
            </>
          ) : ended ? (
            <p className="font-semibold text-fg-muted">Đã diễn ra</p>
          ) : soldOut ? (
            <p className="font-semibold text-fg-muted">Đã bán hết vé</p>
          ) : (
            <p className="text-fg-muted">
              Mở bán từ {sale.time}, {sale.day}/{sale.month}/{sale.year}
            </p>
          )}
        </div>
      </div>
    </li>
  )
}

/**
 * Trang /events cho khách (C-02): mọi sự kiện đã công bố, lọc theo trạng thái, từ khoá, khoảng ngày diễn, có phân trang.
 * Lọc và phân trang ở backend (GET /api/events), sự kiện sắp diễn lên trước.
 * Bộ lọc nằm trên URL (?status=&keyword=&from=&to=&page=) nên F5 hay gửi link vẫn đúng.
 */
export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const now = useNow()

  const status = searchParams.get('status') ?? ''
  const q = searchParams.get('keyword') ?? ''
  // Khoảng ngày diễn (yyyy-mm-dd), gửi nguyên chuỗi cho from, to
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const params = useMemo(() => ({ status, keyword: q, from, to, page: page - 1, size: PAGE_SIZE }), [status, q, from, to, page])
  const { data, error, loading, reload } = useEventPage(getPublicEvents, params)

  // Ô tìm kiếm trên trang: gõ tới đâu hiện tới đó, chỉ gọi backend khi ngừng gõ 400ms
  const [qInput, setQInput] = useState(q)
  // Tìm từ ô ở header làm đổi keyword trên URL: đưa vào ô trên trang cho khớp
  const [syncedQ, setSyncedQ] = useState(q)
  if (q !== syncedQ) {
    setSyncedQ(q)
    setQInput(q)
  }
  useEffect(() => {
    if (qInput.trim() === q) return
    const id = setTimeout(() => update({ keyword: qInput.trim() }), 400)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput])

  // Đổi một bộ lọc: ghi lên URL, bỏ tham số rỗng, quay về trang 1 (trừ khi chính là đổi trang)
  function update(patch) {
    const next = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
    if (!('page' in patch)) next.delete('page')
    setSearchParams(next, { replace: !('page' in patch) })
  }

  function goToPage(p) {
    update({ page: p > 1 ? String(p) : '' })
    window.scrollTo({ top: 0 })
  }

  function clearFilters() {
    setQInput('')
    setSearchParams({}, { replace: true })
  }

  useEffect(() => {
    const previous = document.title
    document.title = 'Sự kiện · Admit One'
    return () => {
      document.title = previous
    }
  }, [])

  const hasFilter = Boolean(status || q || from || to)
  // Từ ngày sau Đến ngày: báo ngay dưới ô (backend trả danh sách rỗng cho khoảng này)
  const badRange = Boolean(from && to && from > to)
  const items = data?.items ?? []
  const firstShown = data && data.totalItems ? data.page * data.size + 1 : 0
  const lastShown = data ? data.page * data.size + items.length : 0

  // Header, footer do PublicLayout lo. Tìm ở header sang /events?keyword=, trang đọc keyword trên URL nên lọc ngay
  return (
    <main id="main-content" className="mx-auto w-full max-w-page px-gutter py-section-sm">
      <h1 className="font-display text-heading font-bold text-title md:text-heading-lg">Tất cả sự kiện</h1>
      <p className="mt-2 text-body text-fg-muted">Concert, kịch, hòa nhạc đã mở bán hoặc sắp mở bán.</p>

      <div role="group" aria-label="Lọc theo trạng thái" className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((s) => (
          <button key={s || 'all'} type="button" aria-pressed={status === s} onClick={() => update({ status: s })} className={chip}>
            {s ? EVENT_STATUS_LABEL[s] : 'Tất cả'}
          </button>
        ))}
      </div>

      <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
        <div>
          <label htmlFor="tim-su-kien-trang" className="text-caption font-semibold text-fg-muted">
            Tìm theo tên hoặc địa điểm
          </label>
          <input id="tim-su-kien-trang" type="search" className={`${input} mt-1`} placeholder="VŨ, Mỹ Đình..." value={qInput} maxLength={100} onChange={(e) => setQInput(e.target.value)} />
        </div>
        <div>
          <label htmlFor="tu-ngay-trang" className="text-caption font-semibold text-fg-muted">
            Diễn từ ngày
          </label>
          <input id="tu-ngay-trang" type="date" className={`${input} mt-1`} value={from} max={to || undefined} onChange={(e) => update({ from: e.target.value })} />
        </div>
        <div>
          <label htmlFor="den-ngay-trang" className="text-caption font-semibold text-fg-muted">
            Đến ngày
          </label>
          <input id="den-ngay-trang" type="date" className={`${input} mt-1`} value={to} min={from || undefined} onChange={(e) => update({ to: e.target.value })} />
        </div>
      </form>
      {badRange && <p role="alert" className="mt-2 text-body-sm text-danger">"Diễn từ ngày" phải trước hoặc bằng "Đến ngày".</p>}

      <div className="mt-3 flex min-h-11 flex-wrap items-center justify-between gap-2 text-body-sm text-fg-muted">
        <p aria-live="polite">{data ? (data.totalItems ? `Hiển thị ${firstShown}–${lastShown} trên ${data.totalItems} sự kiện` : 'Không có sự kiện nào') : 'Đang tải...'}</p>
        {hasFilter && (
          <button type="button" onClick={clearFilters} className="inline-flex min-h-11 items-center font-semibold text-title underline underline-offset-4 hover:text-fg-muted">
            Xoá bộ lọc
          </button>
        )}
      </div>

      <div aria-busy={loading} className={`mt-3 transition-opacity ${loading && data ? 'opacity-60' : ''}`}>
        {loading && !data && (
          <ul aria-hidden="true" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="h-96 animate-pulse rounded-card bg-surface-sunken" />
            ))}
          </ul>
        )}

        {error && (
          <div role="alert" className="rounded-card border border-card-line bg-card px-6 py-10 text-center">
            <p className="text-subheading font-semibold text-title">{error}</p>
            <GhostButton type="button" onClick={reload} className="mt-6">
              Tải lại danh sách
            </GhostButton>
          </div>
        )}

        {!error && data && data.totalItems === 0 && (
          <div className="rounded-card border border-card-line bg-card px-6 py-10 text-center">
            <p className="text-subheading font-semibold text-title">{hasFilter ? 'Không có sự kiện phù hợp' : 'Chưa có sự kiện nào được công bố'}</p>
            <p className="mt-2 text-body text-fg-muted">
              {hasFilter ? 'Thử từ khoá khác hoặc bỏ bộ lọc.' : 'Lịch mới thường được công bố trước ngày mở bán ít nhất hai tuần.'}
            </p>
            {hasFilter && (
              <GhostButton type="button" onClick={clearFilters} className="mt-6">
                Xem tất cả sự kiện
              </GhostButton>
            )}
          </div>
        )}

        {!error && items.length > 0 && (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((event) => (
              <EventCard key={event.id} event={event} now={now} />
            ))}
          </ul>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <nav aria-label="Phân trang" className="mt-8 flex flex-wrap items-center justify-center gap-1">
          <button type="button" className={pageButton(false)} disabled={page <= 1} onClick={() => goToPage(page - 1)}>
            ← Trước
          </button>
          {pageWindow(page - 1, data.totalPages).map((p) =>
            typeof p === 'string' ? (
              <span key={p} aria-hidden="true" className="px-1 text-fg-muted">
                …
              </span>
            ) : (
              <button key={p} type="button" aria-label={`Trang ${p + 1}`} aria-current={p === page - 1 ? 'page' : undefined} className={pageButton(p === page - 1)} onClick={() => goToPage(p + 1)}>
                {p + 1}
              </button>
            ),
          )}
          <button type="button" className={pageButton(false)} disabled={page >= data.totalPages} onClick={() => goToPage(page + 1)}>
            Sau →
          </button>
        </nav>
      )}
    </main>
  )
}
