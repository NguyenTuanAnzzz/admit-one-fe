import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PrimaryButton } from '../../components/Button'
import { PosterViewer } from '../../components/PosterViewer'
import { Spinner } from '../../components/Spinner'
import { getAdminEvent, publishEvent } from '../../api/eventApi'
import { useAuth } from '../../context/AuthContext'
import { EVENT_STATUS, EVENT_STATUS_LABEL, EVENT_STATUS_STYLE } from '../../lib/eventStatus'
import { formatCount, formatMoney, hanoiParts } from '../../lib/format'

const card = 'rounded-card border border-card-line bg-surface p-card'
const smallButton =
  'inline-flex min-h-11 items-center justify-center rounded-pill border-[1.5px] border-button-secondary-line px-4 text-body-sm font-semibold text-button-secondary-fg hover:border-fg hover:bg-button-secondary-hover'

// Trùng enum TicketStatus ở backend
const TICKET_STATUS_LABEL = { ACTIVE: 'Đang bán', INACTIVE: 'Tạm ngưng', SOLD_OUT: 'Hết vé' }
const TICKET_STATUS_STYLE = {
  ACTIVE: 'bg-status-on-sale text-status-on-sale-fg',
  INACTIVE: 'border border-badge-line bg-badge text-badge-fg',
  SOLD_OUT: 'bg-status-sold-out text-status-sold-out-fg',
}

const formatHanoi = (iso) => {
  if (!iso) return '—'
  const p = hanoiParts(iso)
  return `${p.time}, ${p.weekday} ${p.day}/${p.month}/${p.year}`
}

// price là BigDecimal ở backend, JSON có thể ra 3000000.00: đổi sang số trước khi định dạng
const money = (price) => formatMoney(Number(price) || 0)

/** Một loại vé: tên, mô tả, giá, thanh đã bán / tổng số vé, trạng thái */
function TicketRow({ ticket }) {
  const sold = ticket.soldQuantity ?? 0
  const percent = ticket.quantity ? Math.min(100, Math.round((sold / ticket.quantity) * 100)) : 0
  return (
    <li className="grid gap-x-6 gap-y-3 border-t border-line py-4 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_140px_200px_100px] sm:items-center">
      <div className="min-w-0">
        <p className="font-semibold text-title">{ticket.name}</p>
        {ticket.description && <p className="mt-0.5 text-body-sm text-fg-muted">{ticket.description}</p>}
      </div>
      <p className="font-display text-subheading font-bold text-action tabular-nums">{money(ticket.price)}</p>
      <div>
        <p className="text-body-sm text-fg tabular-nums">
          <span className="text-fg-muted sm:hidden">Đã bán: </span>
          {formatCount(sold)} / {formatCount(ticket.quantity)} vé
        </p>
        <div role="progressbar" aria-label={`Đã bán ${ticket.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-surface-sunken">
          <div className="h-full rounded-pill bg-action" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <span className={`inline-flex w-fit items-center rounded-badge px-2.5 py-1 text-caption font-semibold ${TICKET_STATUS_STYLE[ticket.status] ?? ''}`}>
        {TICKET_STATUS_LABEL[ticket.status] ?? ticket.status}
      </span>
    </li>
  )
}

/**
 * Dashboard › Sự kiện › Chi tiết (/dashboard/events/:id): GET /admin/events/{id} trả EventDetailResponse kèm tickets.
 * Xem thông tin, poster, các loại vé và số đã bán. Bản nháp thì công bố được ngay ở đây.
 */
export default function DashboardEventDetail() {
  const { id } = useParams()
  const { fetchWithAuth } = useAuth()
  // key = id đã tải xong: đổi sự kiện thì tự coi là đang tải, không setState trong effect
  const [result, setResult] = useState({ key: null, event: null, error: null })
  const [reloadKey, setReloadKey] = useState(0)
  const [publishing, setPublishing] = useState(false)
  const [notice, setNotice] = useState(null)

  const key = `${id}#${reloadKey}`

  useEffect(() => {
    let cancelled = false
    getAdminEvent(fetchWithAuth, id)
      .then((event) => !cancelled && setResult({ key, event, error: null }))
      .catch((err) => !cancelled && setResult({ key, event: null, error: err.message }))
    return () => {
      cancelled = true
    }
    // fetchWithAuth đổi mỗi khi làm mới token, không tải lại vì thế
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const loading = result.key !== key
  // Tải lại cùng sự kiện (sau khi công bố) vẫn giữ nội dung cũ trên màn hình, không nháy trắng
  const event = result.event?.id === id ? result.event : null

  useEffect(() => {
    const previous = document.title
    document.title = `${event ? event.name : 'Chi tiết sự kiện'} · Dashboard · Admit One`
    return () => {
      document.title = previous
    }
  }, [event])

  async function handlePublish() {
    if (!window.confirm(`Công bố "${event.name}"? Khách sẽ thấy sự kiện này.`)) return
    setPublishing(true)
    setNotice(null)
    try {
      await publishEvent(fetchWithAuth, id)
      setNotice({ type: 'success', text: `Đã công bố ${event.name}.` })
      // publish trả EventResponse không có tickets: tải lại chi tiết để giữ danh sách vé
      setReloadKey((k) => k + 1)
    } catch (err) {
      setNotice({ type: 'error', text: err.message })
    } finally {
      setPublishing(false)
    }
  }

  const tickets = event?.tickets ?? []
  const totals = tickets.reduce(
    (sum, t) => ({
      quantity: sum.quantity + (t.quantity ?? 0),
      sold: sum.sold + (t.soldQuantity ?? 0),
      revenue: sum.revenue + (t.soldQuantity ?? 0) * (Number(t.price) || 0),
    }),
    { quantity: 0, sold: 0, revenue: 0 },
  )

  return (
    <div>
      <Link to="/dashboard/events" className="inline-flex min-h-11 items-center text-body-sm font-semibold text-fg-muted hover:text-title">
        ← Danh sách sự kiện
      </Link>

      {loading && !event && (
        <p role="status" className="mt-4 flex items-center gap-2 text-body-sm text-fg-muted">
          <Spinner /> Đang tải sự kiện...
        </p>
      )}

      {!loading && result.error && (
        <div role="alert" className={`${card} mt-4 text-center`}>
          <p className="text-body-sm text-danger">{result.error}</p>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className={`${smallButton} mt-3`}>
            Thử lại
          </button>
        </div>
      )}

      {notice && (
        <p
          role={notice.type === 'error' ? 'alert' : 'status'}
          className={`mt-4 rounded-input px-4 py-3 text-body-sm ${notice.type === 'error' ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-fg'}`}
        >
          {notice.text}
        </p>
      )}

      {event && (
        <>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <span className={`inline-flex items-center rounded-badge px-2.5 py-1 text-caption font-semibold ${EVENT_STATUS_STYLE[event.status] ?? ''}`}>
                {EVENT_STATUS_LABEL[event.status] ?? event.status}
              </span>
              <h1 className="mt-2 font-display text-heading font-bold text-title">{event.name}</h1>
            </div>
            {event.status === EVENT_STATUS.DRAFT && (
              <PrimaryButton type="button" disabled={publishing} onClick={handlePublish}>
                {publishing && <Spinner />}
                {publishing ? 'Đang công bố...' : 'Công bố'}
              </PrimaryButton>
            )}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
            {event.posterUrl ? (
              <PosterViewer src={event.posterUrl} alt={`Poster ${event.name}`} className="aspect-[3/4] w-full max-w-[240px]" />
            ) : (
              <div className="flex aspect-[3/4] w-full max-w-[240px] items-center justify-center rounded-card border border-dashed border-line-strong bg-surface-sunken text-body-sm text-fg-muted">
                Chưa có poster
              </div>
            )}

            <section aria-labelledby="thong-tin" className={card}>
              <h2 id="thong-tin" className="text-subheading font-bold text-title">
                Thông tin
              </h2>
              <dl className="mt-4 grid gap-x-6 gap-y-3 text-body sm:grid-cols-[140px_minmax(0,1fr)]">
                <dt className="text-fg-muted">Giờ diễn</dt>
                <dd className="font-semibold text-fg">{formatHanoi(event.startsAt)}</dd>
                <dt className="text-fg-muted">Mở bán</dt>
                <dd className="text-fg">{formatHanoi(event.saleOpensAt)}</dd>
                <dt className="text-fg-muted">Địa điểm</dt>
                <dd className="text-fg">
                  {event.venue}
                  {event.address && <span className="block text-body-sm text-fg-muted">{event.address}</span>}
                  {event.googleMapsUrl && (
                    <a href={event.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-11 items-center text-body-sm font-semibold text-action-fg underline underline-offset-2 hover:text-fg">
                      Mở Google Maps
                      <span className="sr-only"> (mở trang mới)</span>
                    </a>
                  )}
                </dd>
                <dt className="text-fg-muted">Tạo lúc</dt>
                <dd className="text-body-sm text-fg">{formatHanoi(event.createdAt)}</dd>
                <dt className="text-fg-muted">Sửa lần cuối</dt>
                <dd className="text-body-sm text-fg">{formatHanoi(event.updatedAt)}</dd>
              </dl>
              {event.description && (
                <>
                  <h3 className="mt-6 text-body font-semibold text-title">Mô tả</h3>
                  <p className="mt-2 text-body whitespace-pre-line text-fg">{event.description}</p>
                </>
              )}
            </section>
          </div>

          <section aria-labelledby="loai-ve" className={`${card} mt-6`}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="loai-ve" className="text-subheading font-bold text-title">
                Loại vé
              </h2>
              {tickets.length > 0 && (
                <p className="text-body-sm text-fg">
                  Đã bán <span className="font-semibold tabular-nums">{formatCount(totals.sold)}</span> / {formatCount(totals.quantity)} vé · Doanh thu{' '}
                  <span className="font-semibold tabular-nums">{formatMoney(totals.revenue)}</span>
                </p>
              )}
            </div>

            {tickets.length === 0 ? (
              <p className="mt-4 rounded-input bg-surface-sunken px-4 py-3 text-body-sm text-fg-muted">Sự kiện chưa có loại vé nào.</p>
            ) : (
              <>
                <div aria-hidden="true" className="mt-4 hidden gap-x-6 border-b border-line pb-3 text-caption font-semibold text-fg-muted sm:grid sm:grid-cols-[minmax(0,1fr)_140px_200px_100px]">
                  <span>Tên loại vé</span>
                  <span>Giá</span>
                  <span>Đã bán</span>
                  <span>Trạng thái</span>
                </div>
                <ul>
                  {tickets.map((t) => (
                    <TicketRow key={t.id} ticket={t} />
                  ))}
                </ul>
              </>
            )}
          </section>
        </>
      )}
    </div>
  )
}
