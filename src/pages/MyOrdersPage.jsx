import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getMyOrders } from '../api/orderApi'
import { GhostButton } from '../components/Button'
import { useAuth } from '../context/AuthContext'
import useEventPage from '../hook/useEventPage'
import { formatMinutes, formatMoney, hanoiParts, secondsUntil, useNow } from '../lib/format'
import { ORDER_STATUS, ORDER_STATUS_LABEL, ORDER_STATUS_STYLE } from '../lib/orderStatus'
import { pageWindow } from '../lib/pagination'

const PAGE_SIZE = 10

const FILTERS = ['', ORDER_STATUS.PENDING, ORDER_STATUS.PAID, ORDER_STATUS.EXPIRED, ORDER_STATUS.CANCELLED]

const input =
  'block min-h-11 w-full rounded-input bg-surface px-3 text-body-sm text-fg ring-1 ring-input-line outline-none placeholder:text-fg-placeholder focus-visible:ring-2 focus-visible:ring-focus'
const chip =
  'min-h-11 rounded-pill border border-line bg-surface px-5 text-body-sm font-semibold text-fg transition-colors hover:border-fg aria-pressed:border-chip-active-line aria-pressed:bg-chip-active aria-pressed:text-chip-active-fg'
const ghostLink =
  'inline-flex min-h-11 items-center justify-center rounded-pill border-[1.5px] border-button-secondary-line px-6 text-body-sm font-semibold text-button-secondary-fg hover:border-fg hover:bg-button-secondary-hover'
const pageButton = (active) =>
  `inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill px-3 text-body-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
    active ? 'bg-chip-active text-chip-active-fg' : 'text-fg hover:bg-surface-sunken'
  }`

const formatHanoi = (iso) => {
  const p = hanoiParts(iso)
  return `${p.time}, ${p.weekday} ${p.day}/${p.month}/${p.year}`
}

/** Một đơn: poster nhỏ, sự kiện, các loại vé, tổng tiền, trạng thái. Đơn đang giữ thì đếm ngược tới hạn thanh toán. */
function OrderCard({ order, now }) {
  const left = order.status === ORDER_STATUS.PENDING ? secondsUntil(order.holdDeadline, now) : 0
  const created = hanoiParts(order.createdAt)

  return (
    <li className="flex flex-col gap-4 rounded-card border border-card-line bg-card p-card sm:flex-row">
      {order.eventPosterUrl ? (
        <img src={order.eventPosterUrl} alt="" loading="lazy" className="aspect-[3/4] w-24 shrink-0 rounded-input object-cover" />
      ) : (
        <div aria-hidden="true" className="hidden aspect-[3/4] w-24 shrink-0 rounded-input border border-dashed border-line-strong bg-surface-sunken sm:block" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h2 className="font-display text-subheading font-bold text-title">
              <Link to={`/events/${order.eventId}`} className="hover:underline">
                {order.eventName}
              </Link>
            </h2>
            <p className="text-body-sm text-fg-muted">
              {formatHanoi(order.eventStartsAt)} · {order.eventVenue}
            </p>
          </div>
          <span className={`inline-flex items-center rounded-badge px-2.5 py-1 text-caption font-semibold ${ORDER_STATUS_STYLE[order.status] ?? ''}`}>
            {ORDER_STATUS_LABEL[order.status] ?? order.status}
          </span>
        </div>

        <ul className="mt-3 grid gap-1 text-body-sm">
          {order.items.map((i) => (
            <li key={i.ticketId} className="flex justify-between gap-4">
              <span className="text-fg">
                {i.quantity} × {i.ticketName}
              </span>
              <span className="text-fg-muted tabular-nums">{formatMoney(Number(i.subtotal))}</span>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-t border-line pt-3">
          <p className="text-caption text-fg-muted">
            Mã đơn{' '}
            <Link to={`/orders/${order.id}`} className="font-semibold text-title underline underline-offset-4 hover:text-fg-muted">
              {order.code}
            </Link>{' '}
            · Đặt lúc {created.time} {created.day}/{created.month}/{created.year}
          </p>
          <p className="font-display text-subheading font-bold text-action tabular-nums">{formatMoney(Number(order.totalAmount))}</p>
        </div>

        {order.status === ORDER_STATUS.PENDING &&
          (left > 0 ? (
            <p className="mt-2 text-body-sm text-fg-muted">
              Giữ vé còn <span className="font-semibold text-title tabular-nums">{formatMinutes(left)}</span>. Thanh toán trước khi hết giờ, quá giờ đơn tự huỷ.
            </p>
          ) : (
            <p className="mt-2 text-body-sm text-fg-muted">Đã hết thời gian giữ vé, đơn sẽ chuyển sang Hết hạn trong giây lát.</p>
          ))}

        <Link to={`/orders/${order.id}`} className="mt-1 inline-flex min-h-11 items-center text-body-sm font-semibold text-title underline underline-offset-4 hover:text-fg-muted">
          Xem chi tiết đơn<span className="sr-only"> {order.code}</span>
        </Link>
      </div>
    </li>
  )
}

/**
 * Trang /orders (C-08): đơn của khách đang đăng nhập, lọc theo trạng thái, tìm theo mã đơn hoặc tên sự kiện, có phân trang.
 * Chỉ CUSTOMER vào được (route bọc ProtectRole). Bộ lọc nằm trên URL (?status=&keyword=&page=) nên F5 vẫn giữ.
 */
export default function MyOrdersPage() {
  const { fetchWithAuth } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const now = useNow()

  const status = searchParams.get('status') ?? ''
  const q = searchParams.get('keyword') ?? ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const params = useMemo(() => ({ status, keyword: q, page: page - 1, size: PAGE_SIZE }), [status, q, page])
  const { data, error, loading, reload } = useEventPage((p) => getMyOrders(fetchWithAuth, p), params)

  // Gõ tới đâu hiện tới đó, chỉ gọi backend khi ngừng gõ 400ms
  const [qInput, setQInput] = useState(q)
  useEffect(() => {
    if (qInput.trim() === q) return
    const id = setTimeout(() => update({ keyword: qInput.trim() }), 400)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput])

  // Đổi bộ lọc: ghi lên URL, bỏ tham số rỗng, quay về trang 1 (trừ khi chính là đổi trang)
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
    document.title = 'Đơn của tôi · Admit One'
    return () => {
      document.title = previous
    }
  }, [])

  const hasFilter = Boolean(status || q)
  const items = data?.items ?? []

  return (
    <main id="main-content" className="mx-auto w-full max-w-4xl px-gutter py-section-sm">
      <h1 className="font-display text-heading font-bold text-title md:text-heading-lg">Đơn của tôi</h1>
      <p className="mt-2 text-body text-fg-muted">Các đơn bạn đã giữ vé hoặc đã thanh toán, mới nhất lên trước.</p>

      <div role="group" aria-label="Lọc theo trạng thái" className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((s) => (
          <button key={s || 'all'} type="button" aria-pressed={status === s} onClick={() => update({ status: s })} className={chip}>
            {s ? ORDER_STATUS_LABEL[s] : 'Tất cả'}
          </button>
        ))}
      </div>

      <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-4 max-w-md">
        <label htmlFor="tim-don" className="text-caption font-semibold text-fg-muted">
          Tìm theo mã đơn hoặc tên sự kiện
        </label>
        <input id="tim-don" type="search" className={`${input} mt-1`} placeholder="AO1762..., VŨ..." value={qInput} maxLength={100} onChange={(e) => setQInput(e.target.value)} />
      </form>

      <div className="mt-3 flex min-h-11 flex-wrap items-center justify-between gap-2 text-body-sm text-fg-muted">
        <p aria-live="polite">{data ? (data.totalItems ? `${data.totalItems} đơn` : 'Không có đơn nào') : 'Đang tải...'}</p>
        {hasFilter && (
          <button type="button" onClick={clearFilters} className="inline-flex min-h-11 items-center font-semibold text-title underline underline-offset-4 hover:text-fg-muted">
            Xoá bộ lọc
          </button>
        )}
      </div>

      <div aria-busy={loading} className={`mt-3 transition-opacity ${loading && data ? 'opacity-60' : ''}`}>
        {loading && !data && (
          <ul aria-hidden="true" className="grid gap-4">
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-44 animate-pulse rounded-card bg-surface-sunken" />
            ))}
          </ul>
        )}

        {error && (
          <div role="alert" className="rounded-card border border-card-line bg-card px-6 py-10 text-center">
            <p className="text-subheading font-semibold text-title">{error}</p>
            <GhostButton type="button" onClick={reload} className="mt-6">
              Tải lại
            </GhostButton>
          </div>
        )}

        {!error && data && data.totalItems === 0 && (
          <div className="rounded-card border border-card-line bg-card px-6 py-10 text-center">
            <p className="text-subheading font-semibold text-title">{hasFilter ? 'Không có đơn phù hợp' : 'Bạn chưa có đơn nào'}</p>
            <p className="mt-2 text-body text-fg-muted">{hasFilter ? 'Thử từ khoá khác hoặc bỏ bộ lọc.' : 'Chọn một sự kiện đang bán để giữ vé.'}</p>
            {hasFilter ? (
              <GhostButton type="button" onClick={clearFilters} className="mt-6">
                Xem tất cả đơn
              </GhostButton>
            ) : (
              <Link to="/events" className={`${ghostLink} mt-6`}>
                Xem sự kiện
              </Link>
            )}
          </div>
        )}

        {!error && items.length > 0 && (
          <ul className="grid gap-4">
            {items.map((order) => (
              <OrderCard key={order.id} order={order} now={now} />
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
