import { useEffect } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { GhostButton, PrimaryButton } from '../components/Button'
import { PosterViewer } from '../components/PosterViewer'
import { Spinner } from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import useCreateOrder from '../hook/useCreateOrder'
import useEventDetail from '../hook/useEventDetail'
import { EVENT_STATUS_LABEL, EVENT_STATUS_STYLE } from '../lib/eventStatus'
import { formatCount, formatDuration, formatMinutes, formatMoney, hanoiParts, secondsUntil, useNow } from '../lib/format'
import { ROLE } from '../lib/roles'

const card = 'rounded-card border border-card-line bg-card p-card'
const textLink = 'inline-flex min-h-11 items-center font-semibold text-title underline underline-offset-4 hover:text-fg-muted'
const smallButton =
  'inline-flex min-h-11 items-center justify-center rounded-pill border-[1.5px] border-button-secondary-line px-4 text-body-sm font-semibold text-button-secondary-fg hover:border-fg hover:bg-button-secondary-hover disabled:cursor-not-allowed disabled:opacity-50'

const stepButton = 'inline-flex size-11 items-center justify-center rounded-pill text-subheading font-semibold text-title hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-30'

const formatHanoi = (iso) => {
  const p = hanoiParts(iso)
  return `${p.time}, ${p.weekday} ${p.day}/${p.month}/${p.year}`
}

/** Lời nhắn theo trạng thái: chưa mở bán thì vẫn xem giá được nhưng chưa chọn vé */
function saleMessage(event, untilSale) {
  switch (event.status) {
    case 'UPCOMING':
      return untilSale > 0 ? 'Chưa mở bán. Bạn xem trước giá vé được, tới giờ mở bán mới chọn vé.' : 'Sắp mở bán, tải lại trang sau ít phút.'
    case 'SOLD_OUT':
      return 'Sự kiện đã bán hết vé. Vé được nhả lại (khi người khác hết thời gian giữ vé) sẽ hiện ở đây.'
    case 'ENDED':
      return 'Sự kiện đã diễn ra, không còn bán vé. Vé bạn đã mua vẫn xem lại được trong mục Vé của tôi.'
    case 'CANCELLED':
      return 'Sự kiện đã bị huỷ. Đơn đã thanh toán sẽ được hoàn tiền.'
    default:
      return null
  }
}

/**
 * Trang chi tiết sự kiện cho khách (C-03, C-04, C-05): thông tin, đếm ngược tới giờ mở bán, chọn hạng vé và số lượng.
 * Header và footer do PublicLayout lo. Giữ vé = tạo đơn PENDING (POST /orders), chỉ tài khoản CUSTOMER.
 */
export default function EventDetailPage() {
  const { id } = useParams()
  const now = useNow()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const detail = useEventDetail(id)
  const { loading, error, notFound, reload, event, tiers, canSelect, canPick, maxTickets, counts, totalCount, maxFor, setCount, clearSelection, selected, total } = detail
  const hold = useCreateOrder()
  const isCustomer = user?.role === ROLE.CUSTOMER

  async function handleHold() {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }
    const order = await hold.submit(event.id, selected)
    if (order) {
      clearSelection()
      // Tải lại để số vé còn của từng loại khớp với backend
      reload()
    }
  }

  useEffect(() => {
    const previous = document.title
    document.title = event ? `${event.name} · Admit One` : 'Sự kiện · Admit One'
    return () => {
      document.title = previous
    }
  }, [event])

  if (loading) {
    return (
      <main id="main-content" className="mx-auto max-w-page px-gutter py-section-sm">
        <p role="status" className="flex items-center gap-2 text-body-sm text-fg-muted">
          <Spinner /> Đang tải sự kiện...
        </p>
      </main>
    )
  }

  if (error) {
    return (
      <main id="main-content" className="mx-auto max-w-page px-gutter py-section-sm">
        <div role="alert" className={`${card} text-center`}>
          <p className="text-subheading font-semibold text-title">{notFound ? 'Không tìm thấy sự kiện' : error}</p>
          <p className="mt-2 text-body text-fg-muted">{notFound ? 'Sự kiện không tồn tại hoặc chưa được công bố.' : 'Kiểm tra kết nối mạng rồi thử lại.'}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {!notFound && (
              <GhostButton type="button" onClick={reload}>
                Tải lại
              </GhostButton>
            )}
            <Link to="/events" className={textLink}>
              Xem các sự kiện khác
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const untilSale = secondsUntil(event.saleOpensAt, now)
  const message = saleMessage(event, untilSale)
  return (
    <main id="main-content" className={`mx-auto max-w-page px-gutter py-section-sm ${totalCount ? 'pb-40' : ''}`}>
      <Link to="/events" className="inline-flex min-h-11 items-center text-body-sm font-semibold text-fg-muted hover:text-title">
        ← Tất cả sự kiện
      </Link>

      <div className="mt-2 grid gap-8 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        {event.posterUrl ? (
          <PosterViewer src={event.posterUrl} alt={`Poster ${event.name}`} className="aspect-[3/4] w-full max-w-[280px]" />
        ) : (
          <div aria-hidden="true" className="hidden aspect-[3/4] w-full max-w-[280px] rounded-card border border-dashed border-line-strong bg-surface-sunken md:block" />
        )}

        <div>
          <span className={`inline-flex items-center rounded-badge px-2.5 py-1 text-caption font-semibold ${EVENT_STATUS_STYLE[event.status] ?? ''}`}>{EVENT_STATUS_LABEL[event.status]}</span>
          <h1 className="mt-3 font-display text-heading font-bold text-title md:text-heading-lg">{event.name}</h1>
          <dl className="mt-4 grid gap-x-6 gap-y-2 text-body sm:grid-cols-[auto_1fr]">
            <dt className="text-fg-muted">Giờ diễn</dt>
            <dd className="font-semibold text-fg">{formatHanoi(event.startsAt)}</dd>
            <dt className="text-fg-muted">Địa điểm</dt>
            <dd className="text-fg">
              {event.venue}
              {event.address && <span className="block text-body-sm text-fg-muted">{event.address}</span>}
            </dd>
            <dt className="text-fg-muted">Mở bán</dt>
            <dd className="text-fg">{formatHanoi(event.saleOpensAt)}</dd>
          </dl>
          {event.googleMapsUrl && (
            <a href={event.googleMapsUrl} target="_blank" rel="noopener noreferrer" className={`${smallButton} mt-4`}>
              Chỉ đường trên Google Maps
              <span className="sr-only"> (mở trang mới)</span>
            </a>
          )}

          {event.status === 'UPCOMING' && untilSale > 0 && (
            <div className="mt-6 rounded-card bg-surface-sunken px-5 py-4">
              <p className="text-body-sm text-fg-muted">Mở bán sau</p>
              <p className="font-display text-heading font-bold text-title tabular-nums" aria-live="off">
                {formatDuration(untilSale)}
              </p>
            </div>
          )}
          {event.status === 'CANCELLED' && <p className="mt-6 rounded-input bg-danger-subtle px-4 py-3 text-body-sm text-danger">{message}</p>}
        </div>
      </div>

      {event.description && (
        <section aria-labelledby="gioi-thieu" className="mt-10 max-w-3xl">
          <h2 id="gioi-thieu" className="font-display text-heading-sm font-bold text-title">
            Giới thiệu
          </h2>
          <p className="mt-3 text-body whitespace-pre-line text-fg">{event.description}</p>
        </section>
      )}

      <section aria-labelledby="chon-ve" className="mt-10">
        <h2 id="chon-ve" className="font-display text-heading-sm font-bold text-title">
          Chọn vé
        </h2>
        <p className="mt-1 text-body-sm text-fg-muted">Mỗi tài khoản mua tối đa {maxTickets} vé cho sự kiện này, cộng tất cả loại vé. Mỗi vé một mã QR.</p>
        {message && event.status !== 'CANCELLED' && <p className="mt-3 rounded-input bg-surface-sunken px-4 py-3 text-body-sm text-fg">{message}</p>}

        {hold.order && (
          <div role="status" className={`${card} mt-4 border-fg`}>
            <p className="font-semibold text-title">Đã giữ vé · Mã đơn {hold.order.code}</p>
            <p className="mt-1 text-body-sm text-fg">
              {hold.order.items.map((i) => `${i.quantity} × ${i.ticketName}`).join(', ')} · {formatMoney(Number(hold.order.totalAmount))}
            </p>
            {secondsUntil(hold.order.holdDeadline, now) > 0 ? (
              <p className="mt-1 text-body-sm text-fg-muted">
                Giữ vé còn <span className="font-semibold text-title tabular-nums">{formatMinutes(secondsUntil(hold.order.holdDeadline, now))}</span>. Thanh toán trực tuyến sắp có, đơn chưa thanh toán sẽ tự huỷ khi hết giờ.
              </p>
            ) : (
              <p className="mt-1 text-body-sm text-danger">Đã hết thời gian giữ vé.</p>
            )}
            <Link to={`/orders/${hold.order.id}`} className={`${textLink} text-body-sm`}>
              Xem chi tiết đơn
            </Link>
          </div>
        )}

        {tiers.length === 0 ? (
          <p className={`${card} mt-4 text-body-sm text-fg-muted`}>Sự kiện chưa có giá vé. Ban tổ chức sẽ cập nhật trước giờ mở bán.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {tiers.map((t) => {
              const count = counts[t.id] ?? 0
              const max = maxFor(t)
              const soldOut = t.available === 0 || t.status === 'SOLD_OUT'
              // Vé INACTIVE: sự kiện chưa tới giờ mở bán (hoặc vé chưa mở). Khác "Hết vé"
              const note = soldOut ? 'Hết vé' : t.status === 'INACTIVE' ? `Chưa mở bán · ${formatCount(t.available)} vé` : `Còn ${formatCount(t.available)} vé`
              return (
                <li key={t.id} className={`flex flex-wrap items-center gap-x-4 gap-y-3 rounded-card border bg-card px-4 py-3 sm:px-5 ${count ? 'border-fg' : 'border-card-line'}`}>
                  <div className="min-w-40 flex-1">
                    <p className="font-semibold text-title">{t.name}</p>
                    {t.description && <p className="text-body-sm text-fg-muted">{t.description}</p>}
                    <p className={`text-body-sm ${soldOut ? 'text-danger' : 'text-fg-muted'}`}>{note}</p>
                  </div>
                  {/* Màn hẹp: giá và nút chọn số lượng xuống dòng dưới tên, dồn sang phải */}
                  <div className="ml-auto flex items-center gap-4">
                    <p className="font-display text-subheading font-bold text-action tabular-nums">{formatMoney(t.price)}</p>
                    {canPick(t) && (
                      <div role="group" aria-label={`Số vé ${t.name}`} className="inline-flex items-center rounded-pill border border-line-strong">
                        <button type="button" aria-label={`Bớt một vé ${t.name}`} className={stepButton} disabled={count === 0} onClick={() => setCount(t, count - 1)}>
                          −
                        </button>
                        <span aria-live="polite" className="min-w-8 text-center font-semibold text-title tabular-nums">
                          {count}
                        </span>
                        <button type="button" aria-label={`Thêm một vé ${t.name}`} className={stepButton} disabled={count >= max} onClick={() => setCount(t, count + 1)}>
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        {canSelect && totalCount >= maxTickets && <p className="mt-3 text-body-sm text-fg-muted">Bạn đã chọn đủ {maxTickets} vé, mức tối đa cho một tài khoản.</p>}
      </section>

      {/* Vé đang chọn: dính đáy màn hình để luôn thấy tổng tiền */}
      {totalCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur">
          <div className="mx-auto flex max-w-page flex-wrap items-center gap-x-4 gap-y-2 px-gutter py-3">
            <div className="min-w-0 basis-full sm:basis-auto sm:flex-1">
              <p className="text-body-sm text-fg-muted">
                {totalCount}/{maxTickets} vé
              </p>
              <p className="truncate font-semibold text-title">{selected.map((t) => `${t.count} × ${t.name}`).join(', ')}</p>
            </div>
            <p className="mr-auto font-display text-subheading font-bold text-action tabular-nums sm:mr-0">{formatMoney(total)}</p>
            <button type="button" onClick={clearSelection} className={smallButton}>
              Bỏ chọn
            </button>
            {/* Chỉ CUSTOMER giữ được vé. Khách chưa đăng nhập thì đưa sang /login rồi quay lại trang này */}
            <div className="flex flex-col items-end">
              {user && !isCustomer ? (
                <>
                  <PrimaryButton type="button" disabled>
                    Giữ vé
                  </PrimaryButton>
                  <span className="mt-1 text-caption text-fg-muted">Chỉ tài khoản khách hàng mua được vé</span>
                </>
              ) : (
                <PrimaryButton type="button" onClick={handleHold} disabled={authLoading || hold.submitting}>
                  {hold.submitting && <Spinner />}
                  {user ? 'Giữ vé' : 'Đăng nhập để giữ vé'}
                </PrimaryButton>
              )}
            </div>
            {hold.error && (
              <p role="alert" className="basis-full text-body-sm text-danger">
                {hold.error}
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
