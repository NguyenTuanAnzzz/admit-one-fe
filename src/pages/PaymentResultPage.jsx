import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { startPayment, syncPayment } from '../api/orderApi'
import { PrimaryButton } from '../components/Button'
import { Spinner } from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import useOrderDetail from '../hook/useOrderDetail'
import { formatMinutes, formatMoney, hanoiParts, secondsUntil, useNow } from '../lib/format'
import { ORDER_STATUS } from '../lib/orderStatus'

const card = 'rounded-card border border-card-line bg-card p-card'
const ghostLink =
  'inline-flex min-h-11 items-center justify-center rounded-pill border-[1.5px] border-button-secondary-line px-6 text-body-sm font-semibold text-button-secondary-fg hover:border-fg hover:bg-button-secondary-hover'

// Webhook payOS có thể về sau khi khách quay lại vài giây: hỏi lại đơn mỗi 3 giây, tối đa 1 phút
const POLL_MS = 3000
const POLL_MAX = 20

const formatHanoi = (iso) => {
  const p = hanoiParts(iso)
  return `${p.time}, ${p.weekday} ${p.day}/${p.month}/${p.year}`
}

function ResultIcon({ tone }) {
  const style = {
    success: 'bg-status-on-sale text-status-on-sale-fg',
    fail: 'bg-danger-subtle text-danger',
    wait: 'bg-surface-sunken text-fg-muted',
  }[tone]
  return (
    <span aria-hidden="true" className={`mx-auto flex size-16 items-center justify-center rounded-full ${style}`}>
      {tone === 'wait' ? (
        <span className="size-7 animate-spin rounded-full border-[3px] border-line border-t-action" />
      ) : (
        <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {tone === 'success' ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <path d="M7 7l10 10M17 7 7 17" />}
        </svg>
      )}
    </span>
  )
}

/** Tóm tắt đơn dưới phần kết quả: sự kiện, vé, tổng tiền */
function OrderSummary({ order }) {
  return (
    <section aria-label="Thông tin đơn" className={`${card} mt-6 text-left`}>
      <p className="text-caption text-fg-muted">
        Mã đơn <span className="font-semibold text-fg">{order.code}</span>
      </p>
      <p className="mt-1 font-display text-subheading font-bold text-title">{order.eventName}</p>
      <p className="text-body-sm text-fg">
        {formatHanoi(order.eventStartsAt)} · {order.eventVenue}
      </p>
      <ul className="mt-3 grid gap-1 border-t border-line pt-3 text-body-sm">
        {order.items.map((i) => (
          <li key={i.ticketId} className="flex justify-between gap-4">
            <span className="text-fg">
              {i.quantity} × {i.ticketName}
            </span>
            <span className="text-fg-muted tabular-nums">{formatMoney(Number(i.subtotal))}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-line pt-3">
        <p className="font-semibold text-title">Tổng cộng</p>
        <p className="font-display text-subheading font-bold text-action tabular-nums">{formatMoney(Number(order.totalAmount))}</p>
      </div>
    </section>
  )
}

/**
 * Trang /orders/:id/payment: payOS đưa khách về đây sau khi thanh toán (?result=success) hoặc huỷ (?result=cancel).
 * Không tin ?result=success: đơn chỉ thành công khi backend đã nhận webhook và đơn chuyển PAID.
 * Đơn còn PENDING thì hỏi lại mỗi 3 giây cho tới khi PAID hoặc hết 1 phút.
 */
export default function PaymentResultPage() {
  const { id } = useParams()
  const now = useNow()
  const [searchParams] = useSearchParams()
  const result = searchParams.get('result')
  const { fetchWithAuth } = useAuth()
  const { loading, refreshing, order, error, notFound, reload } = useOrderDetail(id)
  const [pollCount, setPollCount] = useState(0)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState(null)

  const pending = order?.status === ORDER_STATUS.PENDING
  // Đơn đang giữ: hỏi tới khi PAID hoặc hết 1 phút. Đơn đã hết hạn/huỷ (có thể khách trả tiền muộn): hỏi 1 lần
  const waiting =
    result === 'success' && order != null && order.status !== ORDER_STATUS.PAID && pollCount < (pending ? POLL_MAX : 1)

  // Mỗi lượt: nhờ backend đối soát với payOS (phòng webhook bị lỡ) rồi tải lại đơn. Lượt đầu chạy ngay
  useEffect(() => {
    if (!waiting || refreshing) return
    const timer = setTimeout(
      async () => {
        await syncPayment(fetchWithAuth, id).catch(() => {})
        setPollCount((c) => c + 1)
        reload()
      },
      pollCount === 0 ? 0 : POLL_MS,
    )
    return () => clearTimeout(timer)
    // reload, fetchWithAuth tạo mới mỗi lần render, chỉ cần chạy lại khi trạng thái chờ hoặc số lần hỏi đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waiting, refreshing, pollCount])

  useEffect(() => {
    const previous = document.title
    document.title = 'Kết quả thanh toán · Admit One'
    return () => {
      document.title = previous
    }
  }, [])

  async function handlePayAgain() {
    setPaying(true)
    setPayError(null)
    try {
      const { checkoutUrl } = await startPayment(fetchWithAuth, order.id)
      window.location.assign(checkoutUrl)
    } catch (err) {
      setPayError(err.message)
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <main id="main-content" className="mx-auto max-w-xl px-gutter py-section-sm">
        <p role="status" className="flex items-center gap-2 text-body-sm text-fg-muted">
          <Spinner /> Đang kiểm tra thanh toán...
        </p>
      </main>
    )
  }

  if (error) {
    return (
      <main id="main-content" className="mx-auto max-w-xl px-gutter py-section-sm">
        <div role="alert" className={`${card} text-center`}>
          <p className="text-subheading font-semibold text-title">{notFound ? 'Không tìm thấy đơn hàng' : error}</p>
          <Link to="/orders" className={`${ghostLink} mt-6`}>
            Về danh sách đơn
          </Link>
        </div>
      </main>
    )
  }

  const left = pending ? secondsUntil(order.holdDeadline, now) : 0
  const canPayAgain = pending && left > 0

  // Chọn nội dung theo trạng thái thật của đơn, ?result chỉ để biết khách vừa trả hay vừa huỷ
  let view
  if (order.status === ORDER_STATUS.PAID) {
    view = {
      tone: 'success',
      title: 'Thanh toán thành công',
      body: order.paidAt ? `Đã nhận tiền lúc ${formatHanoi(order.paidAt)}. Cảm ơn bạn đã mua vé!` : 'Cảm ơn bạn đã mua vé!',
    }
  } else if (waiting) {
    view = { tone: 'wait', title: 'Đang xác nhận thanh toán', body: 'Đang chờ ngân hàng báo về, thường chỉ mất vài giây. Đừng đóng trang này.' }
  } else if (result === 'success' && pending) {
    view = {
      tone: 'wait',
      title: 'Chưa nhận được xác nhận',
      body: 'Nếu bạn đã chuyển tiền, hệ thống sẽ tự cập nhật khi ngân hàng báo về. Tải lại sau ít phút hoặc xem trong Đơn của tôi.',
    }
  } else if (pending) {
    view = {
      tone: 'fail',
      title: 'Thanh toán chưa hoàn tất',
      body: canPayAgain ? 'Bạn đã huỷ thanh toán. Vé vẫn được giữ tới hết giờ, bạn có thể thanh toán lại.' : 'Đã hết thời gian giữ vé.',
    }
  } else {
    view = {
      tone: 'fail',
      title: order.status === ORDER_STATUS.CANCELLED ? 'Đơn đã bị huỷ' : 'Đơn đã hết hạn',
      body: 'Vé đã được trả lại. Nếu tiền đã bị trừ, chúng tôi sẽ liên hệ để hoàn tiền.',
    }
  }

  return (
    <main id="main-content" className="mx-auto max-w-xl px-gutter py-section-sm text-center">
      <div role="status" aria-live="polite">
        <ResultIcon tone={view.tone} />
        <h1 className="mt-4 font-display text-heading font-bold text-title">{view.title}</h1>
        <p className="mt-2 text-body text-fg-muted">{view.body}</p>
      </div>

      {canPayAgain && !waiting && (
        <p className="mt-4 text-body-sm text-fg">
          Giữ vé còn <span className="font-semibold text-title tabular-nums">{formatMinutes(left)}</span>
        </p>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {canPayAgain && !waiting && (
          <PrimaryButton type="button" onClick={handlePayAgain} disabled={paying}>
            {paying && <Spinner />}
            Thanh toán lại
          </PrimaryButton>
        )}
        {result === 'success' && pending && !waiting && (
          // Đặt lại số lần hỏi: trang đối soát với payOS và chờ thêm 1 phút
          <button type="button" onClick={() => setPollCount(0)} disabled={refreshing} className={ghostLink}>
            Kiểm tra lại
          </button>
        )}
        <Link to={`/orders/${order.id}`} className={ghostLink}>
          Xem chi tiết đơn
        </Link>
        {order.status === ORDER_STATUS.PAID && (
          <Link to="/events" className={ghostLink}>
            Xem sự kiện khác
          </Link>
        )}
      </div>
      {payError && (
        <p role="alert" className="mt-3 text-body-sm text-danger">
          {payError}
        </p>
      )}

      <OrderSummary order={order} />
    </main>
  )
}
