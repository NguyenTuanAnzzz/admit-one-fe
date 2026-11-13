import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getAdminOrders } from '../../api/orderApi'
import { useAuth } from '../../context/AuthContext'
import useEventPage from '../../hook/useEventPage'
import { formatMoney, hanoiParts } from '../../lib/format'
import { ORDER_STATUS, ORDER_STATUS_LABEL, ORDER_STATUS_STYLE } from '../../lib/orderStatus'
import { pageWindow } from '../../lib/pagination'

const PAGE_SIZE = 10

const input =
  'block min-h-11 w-full rounded-input bg-surface px-3 text-body-sm text-fg ring-1 ring-input-line outline-none placeholder:text-fg-placeholder focus-visible:ring-2 focus-visible:ring-focus'
const rowAction =
  'inline-flex min-h-11 items-center rounded-pill border-[1.5px] border-button-secondary-line px-4 text-body-sm font-semibold text-button-secondary-fg hover:border-fg hover:bg-button-secondary-hover'
const pageButton = (active) =>
  `inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill px-3 text-body-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
    active ? 'bg-chip-active text-chip-active-fg' : 'text-fg hover:bg-surface-sunken'
  }`
const statusTab = (active) =>
  `inline-flex min-h-11 items-center rounded-pill px-4 text-body-sm font-semibold ${
    active ? 'bg-chip-active text-chip-active-fg' : 'text-fg-muted hover:bg-surface-sunken hover:text-title'
  }`

const STATUS_TABS = [
  { value: '', label: 'Tất cả' },
  { value: ORDER_STATUS.PENDING, label: ORDER_STATUS_LABEL[ORDER_STATUS.PENDING] },
  { value: ORDER_STATUS.PAID, label: ORDER_STATUS_LABEL[ORDER_STATUS.PAID] },
  { value: ORDER_STATUS.EXPIRED, label: ORDER_STATUS_LABEL[ORDER_STATUS.EXPIRED] },
  { value: ORDER_STATUS.CANCELLED, label: ORDER_STATUS_LABEL[ORDER_STATUS.CANCELLED] },
]

// Cột của hàng tiêu đề và từng dòng giống nhau để thẳng hàng: mã đơn + khách, sự kiện, số tiền, trạng thái, nút
const ROW_COLUMNS = 'md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_110px_130px_90px]'

function formatDay(iso) {
  const p = hanoiParts(iso)
  return `${p.time} · ${p.day}/${p.month}/${p.year}`
}

function OrderRow({ order }) {
  return (
    <li className={`grid grid-cols-1 gap-x-4 gap-y-2 border-t border-line py-4 first:border-t-0 md:items-center ${ROW_COLUMNS}`}>
      <div className="min-w-0">
        <p className="truncate font-semibold text-title">{order.code}</p>
        <p className="truncate text-body-sm text-fg-muted">
          {order.customerName} · {order.customerEmail}
        </p>
      </div>
      <p className="truncate text-body-sm text-fg">{order.eventName}</p>
      <p className="text-body-sm font-semibold text-fg">{formatMoney(order.totalAmount)}</p>
      <div>
        <span className={`rounded-badge px-2 py-0.5 text-caption font-semibold ${ORDER_STATUS_STYLE[order.status] ?? ''}`}>{ORDER_STATUS_LABEL[order.status] ?? order.status}</span>
        <p className="mt-1 text-caption text-fg-muted">{formatDay(order.createdAt)}</p>
      </div>
      <div className="md:flex md:justify-end">
        <Link to={order.id} state={{ order }} aria-label={`Xem log thanh toán đơn ${order.code}`} className={rowAction}>
          Xem log
        </Link>
      </div>
    </li>
  )
}

/**
 * Dashboard › Đơn hàng (A-06): tra cứu mọi đơn theo mã/tên sự kiện, lọc theo trạng thái, phân trang ở backend.
 * Bấm "Xem log" vào trang chi tiết log thanh toán của đơn đó (DashboardOrderPayments).
 */
export default function DashboardOrders() {
  const { fetchWithAuth } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const q = searchParams.get('q') ?? ''
  const status = searchParams.get('status') ?? ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const params = useMemo(() => ({ keyword: q, status, page: page - 1, size: PAGE_SIZE }), [q, status, page])
  const { data, error, loading, reload } = useEventPage((p) => getAdminOrders(fetchWithAuth, p), params)

  // Ô tìm gõ tới đâu hiện tới đó, chỉ gọi backend khi ngừng gõ 400ms
  const [qInput, setQInput] = useState(q)
  useEffect(() => {
    if (qInput.trim() === q) return
    const id = setTimeout(() => update({ q: qInput.trim() }), 400)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput])

  function update(patch) {
    const next = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
    if (!('page' in patch)) next.delete('page')
    setSearchParams(next, { replace: !('page' in patch) })
  }

  useEffect(() => {
    const previous = document.title
    document.title = 'Đơn hàng · Dashboard · Admit One'
    return () => {
      document.title = previous
    }
  }, [])

  const items = data?.items ?? []
  const firstShown = data && data.totalItems ? data.page * data.size + 1 : 0
  const lastShown = data ? data.page * data.size + items.length : 0

  return (
    <div>
      <h1 className="font-display text-heading font-bold text-title">Đơn hàng</h1>
      <p className="mt-2 text-body-sm text-fg-muted">Tra cứu đơn theo mã hoặc tên sự kiện, xem log các lần thanh toán.</p>

      <div role="tablist" aria-label="Lọc theo trạng thái" className="mt-6 flex flex-wrap gap-1">
        {STATUS_TABS.map((tab) => (
          <button key={tab.value || 'all'} type="button" role="tab" aria-selected={status === tab.value} className={statusTab(status === tab.value)} onClick={() => update({ status: tab.value })}>
            {tab.label}
          </button>
        ))}
      </div>

      <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-4 max-w-md">
        <label htmlFor="tim-don-hang" className="text-caption font-semibold text-fg-muted">
          Tìm theo mã đơn hoặc tên sự kiện
        </label>
        <input id="tim-don-hang" type="search" className={`${input} mt-1`} placeholder="AO2026..., tên sự kiện..." value={qInput} maxLength={100} onChange={(e) => setQInput(e.target.value)} />
      </form>

      <div className="mt-3 flex min-h-11 flex-wrap items-center justify-between gap-2 text-body-sm text-fg-muted">
        <p aria-live="polite">{data ? (data.totalItems ? `Hiển thị ${firstShown}–${lastShown} trên ${data.totalItems} đơn` : 'Không có đơn nào') : 'Đang tải...'}</p>
        {q && (
          <button
            type="button"
            onClick={() => {
              setQInput('')
              update({ q: '' })
            }}
            className="inline-flex min-h-11 items-center font-semibold text-action-fg underline underline-offset-2 hover:text-fg"
          >
            Xoá tìm kiếm
          </button>
        )}
      </div>

      <section aria-label="Danh sách đơn hàng" aria-busy={loading} className={`mt-1 rounded-card border border-card-line bg-surface px-card py-2 transition-opacity ${loading && data ? 'opacity-60' : ''}`}>
        <div aria-hidden="true" className={`hidden gap-x-4 border-b border-line py-3 text-caption font-semibold text-fg-muted md:grid ${ROW_COLUMNS}`}>
          <span>Đơn hàng</span>
          <span>Sự kiện</span>
          <span>Số tiền</span>
          <span>Trạng thái</span>
          <span />
        </div>

        {loading && !data && (
          <ul aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className="border-t border-line py-4 first:border-t-0">
                <span className="block h-4 w-1/3 animate-pulse rounded-input bg-surface-sunken" />
              </li>
            ))}
          </ul>
        )}

        {error && (
          <div role="alert" className="py-8 text-center">
            <p className="text-body-sm text-danger">{error}</p>
            <button type="button" onClick={reload} className="mt-3 inline-flex min-h-11 items-center rounded-pill border-[1.5px] border-button-secondary-line px-5 text-body-sm font-semibold text-button-secondary-fg hover:border-fg">
              Thử lại
            </button>
          </div>
        )}

        {!error && data && data.totalItems === 0 && (
          <div className="py-10 text-center">
            <p className="text-body font-semibold text-title">{q || status ? 'Không có đơn nào khớp' : 'Chưa có đơn nào'}</p>
          </div>
        )}

        {!error && items.length > 0 && (
          <ul>
            {items.map((o) => (
              <OrderRow key={o.id} order={o} />
            ))}
          </ul>
        )}
      </section>

      {data && data.totalPages > 1 && (
        <nav aria-label="Phân trang" className="mt-4 flex flex-wrap items-center justify-center gap-1">
          <button type="button" className={pageButton(false)} disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>
            ← Trước
          </button>
          {pageWindow(page - 1, data.totalPages).map((p) =>
            typeof p === 'string' ? (
              <span key={p} aria-hidden="true" className="px-1 text-fg-muted">
                …
              </span>
            ) : (
              <button key={p} type="button" aria-label={`Trang ${p + 1}`} aria-current={p === page - 1 ? 'page' : undefined} className={pageButton(p === page - 1)} onClick={() => update({ page: String(p + 1) })}>
                {p + 1}
              </button>
            ),
          )}
          <button type="button" className={pageButton(false)} disabled={page >= data.totalPages} onClick={() => update({ page: String(page + 1) })}>
            Sau →
          </button>
        </nav>
      )}
    </div>
  )
}
