import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getOrderPayments } from '../../api/orderApi'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components/Spinner'
import { formatMoney, hanoiParts } from '../../lib/format'
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE } from '../../lib/orderStatus'
import { PAYMENT_STATUS_LABEL, PAYMENT_STATUS_STYLE } from '../../lib/paymentStatus'

const card = 'rounded-card border border-card-line bg-surface p-card'
const detailButton =
  'inline-flex min-h-9 items-center rounded-pill border-[1.5px] border-button-secondary-line px-3 text-caption font-semibold text-button-secondary-fg hover:border-fg hover:bg-button-secondary-hover'

function formatDay(iso) {
  const p = hanoiParts(iso)
  return `${p.time} · ${p.day}/${p.month}/${p.year}`
}

function PaymentRow({ payment }) {
  const [showPayload, setShowPayload] = useState(false)
  return (
    <li className="border-t border-line py-4 first:border-t-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-title">
            {payment.gateway} · {payment.gatewayTxnRef}
          </p>
          <p className="text-body-sm text-fg-muted">{formatDay(payment.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-title">{formatMoney(payment.amount)}</span>
          <span className={`rounded-badge px-2 py-0.5 text-caption font-semibold ${PAYMENT_STATUS_STYLE[payment.status] ?? ''}`}>{PAYMENT_STATUS_LABEL[payment.status] ?? payment.status}</span>
        </div>
      </div>
      {payment.rawPayload && (
        <div className="mt-2">
          <button type="button" className={detailButton} onClick={() => setShowPayload((v) => !v)}>
            {showPayload ? 'Ẩn dữ liệu gốc' : 'Xem dữ liệu gốc'}
          </button>
          {showPayload && <pre className="mt-2 overflow-x-auto rounded-input bg-surface-sunken p-3 text-caption text-fg-muted">{payment.rawPayload}</pre>}
        </div>
      )}
    </li>
  )
}

/**
 * Dashboard › Đơn hàng › Log thanh toán (A-06): log các lần cổng thanh toán báo về cho một đơn.
 * Thông tin đơn (mã, khách, sự kiện...) nhận qua location.state từ trang danh sách, khỏi gọi thêm API.
 */
export default function DashboardOrderPayments() {
  const { id } = useParams()
  const { fetchWithAuth } = useAuth()
  const location = useLocation()
  const order = location.state?.order ?? null

  const [payments, setPayments] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setPayments(null)
    setError(null)
    getOrderPayments(fetchWithAuth, id)
      .then((data) => !cancelled && setPayments(data))
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    const previous = document.title
    document.title = `Log thanh toán${order ? ` ${order.code}` : ''} · Dashboard · Admit One`
    return () => {
      document.title = previous
    }
  }, [order])

  return (
    <div>
      <Link to="/dashboard/orders" className="inline-flex min-h-11 items-center text-body-sm font-semibold text-fg-muted hover:text-title">
        ← Danh sách đơn hàng
      </Link>
      <h1 className="mt-1 font-display text-heading font-bold text-title">Log thanh toán{order && <span className="font-normal text-fg-muted"> · {order.code}</span>}</h1>

      {order ? (
        <div className={`mt-4 ${card}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-title">
                {order.customerName} · {order.customerEmail}
              </p>
              <p className="text-body-sm text-fg-muted">{order.eventName}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-title">{formatMoney(order.totalAmount)}</p>
              <span className={`mt-1 inline-block rounded-badge px-2 py-0.5 text-caption font-semibold ${ORDER_STATUS_STYLE[order.status] ?? ''}`}>{ORDER_STATUS_LABEL[order.status] ?? order.status}</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-body-sm text-fg-muted">Vào thẳng đường dẫn này không kèm thông tin đơn - mở lại từ danh sách để thấy đủ thông tin.</p>
      )}

      <h2 className="mt-6 text-subheading font-bold text-title">Các lần thanh toán</h2>

      {!payments && !error && (
        <p role="status" className="mt-4 flex items-center gap-2 text-body-sm text-fg-muted">
          <Spinner /> Đang tải log...
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-input bg-danger-subtle px-4 py-3 text-body-sm text-danger">
          {error}
        </p>
      )}

      {payments && payments.length === 0 && <p className="mt-4 rounded-input bg-surface-sunken px-4 py-3 text-body-sm text-fg-muted">Chưa có lần thanh toán nào ghi nhận cho đơn này.</p>}

      {payments && payments.length > 0 && (
        <section aria-label="Log thanh toán" className={`mt-4 ${card}`}>
          <ul>
            {payments.map((p) => (
              <PaymentRow key={p.id} payment={p} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
