import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { cancelMyOrder } from '../api/orderApi'
import { GhostButton, PrimaryButton } from '../components/Button'
import { Spinner } from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import { useConfirm } from '../context/ConfirmContext'
import useOrderDetail from '../hook/useOrderDetail'
import { formatMinutes, formatMoney, hanoiParts, secondsUntil, useNow } from '../lib/format'
import { ORDER_STATUS, ORDER_STATUS_LABEL, ORDER_STATUS_STYLE } from '../lib/orderStatus'

const card = 'rounded-card border border-card-line bg-card p-card'
const textLink = 'inline-flex min-h-11 items-center font-semibold text-title underline underline-offset-4 hover:text-fg-muted'

const formatHanoi = (iso) => {
  const p = hanoiParts(iso)
  return `${p.time}, ${p.weekday} ${p.day}/${p.month}/${p.year}`
}

/** Lời nhắn theo trạng thái đơn (trừ PENDING, có khung đếm ngược riêng) */
function statusMessage(order) {
  switch (order.status) {
    case ORDER_STATUS.PAID:
      return order.paidAt ? `Đã thanh toán lúc ${formatHanoi(order.paidAt)}.` : 'Đơn đã thanh toán.'
    case ORDER_STATUS.EXPIRED:
      return 'Đơn đã hết thời gian giữ vé nên vé đã được trả lại. Bạn có thể đặt lại nếu sự kiện còn vé.'
    case ORDER_STATUS.CANCELLED:
      return 'Đơn đã bị huỷ, vé đã được trả lại.'
    default:
      return null
  }
}

/**
 * Trang /orders/:id: chi tiết một đơn của khách (C-08). Đơn đang giữ thì đếm ngược tới hạn thanh toán.
 * Nút Thanh toán tắt vì API thanh toán chưa làm. Đơn không có hoặc của người khác: backend trả 404.
 */
export default function OrderDetailPage() {
  const { id } = useParams()
  const now = useNow()
  const { loading, order, error, notFound, reload } = useOrderDetail(id)
  const { fetchWithAuth } = useAuth()
  const confirm = useConfirm()
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState(null)

  // Hỏi lại trước khi huỷ (không hoàn tác được). Huỷ xong tải lại đơn để thấy trạng thái Đã huỷ
  async function handleCancel() {
    const ok = await confirm({
      title: `Huỷ đơn ${order.code}?`,
      message: 'Vé đang giữ sẽ được trả lại cho người khác mua. Không hoàn tác được.',
      confirmLabel: 'Huỷ đơn',
      cancelLabel: 'Giữ lại',
      tone: 'danger',
    })
    if (!ok) return

    setCancelling(true)
    setCancelError(null)
    try {
      await cancelMyOrder(fetchWithAuth, order.id)
      reload()
    } catch (err) {
      setCancelError(err.message)
    } finally {
      setCancelling(false)
    }
  }

  useEffect(() => {
    const previous = document.title
    document.title = order ? `Đơn ${order.code} · Admit One` : 'Đơn hàng · Admit One'
    return () => {
      document.title = previous
    }
  }, [order])

  if (loading) {
    return (
      <main id="main-content" className="mx-auto max-w-3xl px-gutter py-section-sm">
        <p role="status" className="flex items-center gap-2 text-body-sm text-fg-muted">
          <Spinner /> Đang tải đơn hàng...
        </p>
      </main>
    )
  }

  if (error) {
    return (
      <main id="main-content" className="mx-auto max-w-3xl px-gutter py-section-sm">
        <div role="alert" className={`${card} text-center`}>
          <p className="text-subheading font-semibold text-title">{notFound ? 'Không tìm thấy đơn hàng' : error}</p>
          <p className="mt-2 text-body text-fg-muted">{notFound ? 'Đơn không tồn tại hoặc không thuộc tài khoản của bạn.' : 'Kiểm tra kết nối mạng rồi thử lại.'}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {!notFound && (
              <GhostButton type="button" onClick={reload}>
                Tải lại
              </GhostButton>
            )}
            <Link to="/orders" className={textLink}>
              Về danh sách đơn
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const left = order.status === ORDER_STATUS.PENDING ? secondsUntil(order.holdDeadline, now) : 0
  const message = statusMessage(order)

  return (
    <main id="main-content" className="mx-auto max-w-3xl px-gutter py-section-sm">
      <Link to="/orders" className="inline-flex min-h-11 items-center text-body-sm font-semibold text-fg-muted hover:text-title">
        ← Đơn của tôi
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-heading font-bold text-title">Đơn {order.code}</h1>
        <span className={`inline-flex items-center rounded-badge px-2.5 py-1 text-caption font-semibold ${ORDER_STATUS_STYLE[order.status] ?? ''}`}>
          {ORDER_STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>
      <p className="mt-1 text-body-sm text-fg-muted">Đặt lúc {formatHanoi(order.createdAt)}</p>

      {order.status === ORDER_STATUS.PENDING && (
        <section aria-label="Thanh toán" className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-card bg-surface-sunken px-5 py-4">
          {left > 0 ? (
            <div>
              <p className="text-body-sm text-fg-muted">Giữ vé còn</p>
              <p className="font-display text-heading font-bold text-title tabular-nums" aria-live="off">
                {formatMinutes(left)}
              </p>
              <p className="text-body-sm text-fg-muted">Thanh toán trước {formatHanoi(order.expiresAt)}, quá giờ đơn tự huỷ.</p>
            </div>
          ) : (
            <p className="text-body-sm text-fg">Đã hết thời gian giữ vé, đơn sẽ chuyển sang Hết hạn trong giây lát.</p>
          )}
          <div className="flex flex-wrap items-start gap-3">
            <GhostButton type="button" onClick={handleCancel} disabled={cancelling}>
              {cancelling && <Spinner />}
              Huỷ đơn
            </GhostButton>
            {/* TODO: nối POST /orders/{id}/pay khi làm xong thanh toán */}
            <div className="flex flex-col items-end">
              <PrimaryButton type="button" disabled>
                Thanh toán {formatMoney(Number(order.totalAmount))}
              </PrimaryButton>
              <span className="mt-1 text-caption text-fg-muted">Thanh toán trực tuyến sắp có</span>
            </div>
          </div>
          {cancelError && (
            <p role="alert" className="basis-full text-body-sm text-danger">
              {cancelError}
            </p>
          )}
        </section>
      )}
      {message && <p className="mt-6 rounded-input bg-surface-sunken px-4 py-3 text-body-sm text-fg">{message}</p>}

      <section aria-labelledby="su-kien" className={`${card} mt-6 flex gap-4`}>
        {order.eventPosterUrl && <img src={order.eventPosterUrl} alt="" className="aspect-[3/4] w-20 shrink-0 rounded-input object-cover sm:w-24" />}
        <div className="min-w-0">
          <h2 id="su-kien" className="text-caption font-semibold text-fg-muted">
            Sự kiện
          </h2>
          <p className="mt-1 font-display text-subheading font-bold text-title">
            <Link to={`/events/${order.eventId}`} className="hover:underline">
              {order.eventName}
            </Link>
          </p>
          <p className="mt-1 text-body-sm text-fg">{formatHanoi(order.eventStartsAt)}</p>
          <p className="text-body-sm text-fg">{order.eventVenue}</p>
        </div>
      </section>

      <section aria-labelledby="ve-trong-don" className={`${card} mt-4`}>
        <h2 id="ve-trong-don" className="font-display text-subheading font-bold text-title">
          Vé trong đơn
        </h2>
        <ul className="mt-3 divide-y divide-line">
          {order.items.map((i) => (
            <li key={i.ticketId} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
              <div>
                <p className="font-semibold text-title">{i.ticketName}</p>
                <p className="text-body-sm text-fg-muted tabular-nums">
                  {i.quantity} × {formatMoney(Number(i.unitPrice))}
                </p>
              </div>
              <p className="font-semibold text-fg tabular-nums">{formatMoney(Number(i.subtotal))}</p>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-line pt-3">
          <p className="font-semibold text-title">Tổng cộng</p>
          <p className="font-display text-heading-sm font-bold text-action tabular-nums">{formatMoney(Number(order.totalAmount))}</p>
        </div>
      </section>
    </main>
  )
}
