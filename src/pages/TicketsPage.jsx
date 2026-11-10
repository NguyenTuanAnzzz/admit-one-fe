import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { GhostButton, PrimaryButton } from '../components/Button'
import { Spinner } from '../components/Spinner'
import { Perforation } from '../components/ui'
import useMyTickets from '../hook/useMyTickets'
import useOrderDetail from '../hook/useOrderDetail'
import { hanoiParts } from '../lib/format'
import { ORDER_STATUS } from '../lib/orderStatus'

const card = 'rounded-card border border-card-line bg-card p-card'
const textLink = 'inline-flex min-h-11 items-center font-semibold text-title underline underline-offset-4 hover:text-fg-muted'

// Trùng enum IssuedTicketStatus ở backend
const TICKET_STATUS = {
  VALID: { label: 'Chưa sử dụng', style: 'bg-status-on-sale text-status-on-sale-fg' },
  CHECKED_IN: { label: 'Đã vào cửa', style: 'border border-badge-line bg-surface-sunken text-fg-muted' },
  VOID: { label: 'Đã huỷ', style: 'bg-danger-subtle text-danger' },
}

const formatHanoi = (iso) => {
  const p = hanoiParts(iso)
  return `${p.time}, ${p.weekday} ${p.day}/${p.month}/${p.year}`
}

/** Một tấm vé: thông tin sự kiện ở trên, đường xé, QR ở dưới. Khi in mỗi vé nằm trọn một khối, không bị cắt ngang trang */
function TicketCard({ ticket, order, index, total }) {
  const status = TICKET_STATUS[ticket.status] ?? { label: ticket.status, style: '' }
  const usable = ticket.status === 'VALID'

  return (
    <li className="break-inside-avoid overflow-hidden rounded-card border border-card-line bg-card print:border-fg">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-caption font-semibold text-fg-muted">
            Vé {index}/{total}
          </p>
          <span className={`inline-flex rounded-badge px-2.5 py-1 text-caption font-semibold ${status.style}`}>{status.label}</span>
        </div>
        <p className="mt-2 font-display text-subheading font-bold text-title">{order.eventName}</p>
        <p className="text-body-sm text-fg">{formatHanoi(order.eventStartsAt)}</p>
        <p className="text-body-sm text-fg">{order.eventVenue}</p>
        <p className="mt-2 font-semibold text-action">{ticket.ticketName}</p>
      </div>

      <Perforation notchClass="bg-canvas print:bg-white" />

      <div className="flex flex-col items-center px-5 pt-3 pb-5">
        {/* QR chứa qrSecret. Vé đã dùng hoặc đã huỷ thì làm mờ để khỏi đưa nhầm ra cửa */}
        <div className={`rounded-input bg-white p-3 ${usable ? '' : 'opacity-30'}`}>
          <QRCodeSVG value={ticket.qrSecret} size={176} level="M" marginSize={0} title={`Mã QR vé ${ticket.code}`} />
        </div>
        <p className="mt-2 font-mono text-caption text-fg-muted">{ticket.code}</p>
        {ticket.checkedInAt && <p className="mt-1 text-caption text-fg-muted">Vào cửa lúc {formatHanoi(ticket.checkedInAt)}</p>}
      </div>
    </li>
  )
}

/**
 * Trang /orders/:id/tickets: vé điện tử của một đơn đã thanh toán (C-07, C-08). Mỗi vé một QR, Staff quét QR ở cửa.
 * Nút "In vé" gọi window.print(): header, footer và các nút ẩn đi khi in (print:hidden).
 */
export default function TicketsPage() {
  const { id } = useParams()
  const orderState = useOrderDetail(id)
  const ticketState = useMyTickets(id)
  const { order } = orderState
  const { tickets } = ticketState

  useEffect(() => {
    const previous = document.title
    document.title = order ? `Vé đơn ${order.code} · Admit One` : 'Vé của tôi · Admit One'
    return () => {
      document.title = previous
    }
  }, [order])

  if (orderState.loading || ticketState.loading) {
    return (
      <main id="main-content" className="mx-auto max-w-4xl px-gutter py-section-sm">
        <p role="status" className="flex items-center gap-2 text-body-sm text-fg-muted">
          <Spinner /> Đang tải vé...
        </p>
      </main>
    )
  }

  const error = orderState.error || ticketState.error
  if (error) {
    return (
      <main id="main-content" className="mx-auto max-w-4xl px-gutter py-section-sm">
        <div role="alert" className={`${card} text-center`}>
          <p className="text-subheading font-semibold text-title">{orderState.notFound ? 'Không tìm thấy đơn hàng' : error}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {!orderState.notFound && (
              <GhostButton
                type="button"
                onClick={() => {
                  orderState.reload()
                  ticketState.reload()
                }}
              >
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

  const paid = order.status === ORDER_STATUS.PAID

  return (
    <main id="main-content" className="mx-auto max-w-4xl px-gutter py-section-sm print:max-w-none print:p-0">
      <Link to={`/orders/${order.id}`} className="inline-flex min-h-11 items-center text-body-sm font-semibold text-fg-muted hover:text-title print:hidden">
        ← Chi tiết đơn
      </Link>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-heading font-bold text-title">Vé điện tử</h1>
          <p className="mt-1 text-body-sm text-fg-muted">
            Đơn {order.code} · {tickets.length} vé
          </p>
        </div>
        {tickets.length > 0 && (
          <PrimaryButton type="button" onClick={() => window.print()} className="print:hidden">
            In vé
          </PrimaryButton>
        )}
      </div>

      {tickets.length > 0 && (
        <p className="mt-4 rounded-input bg-surface-sunken px-4 py-3 text-body-sm text-fg print:hidden">
          Đưa mã QR cho nhân viên soát vé tại cửa. Mỗi mã chỉ dùng được một lần, đừng chia sẻ ảnh chụp mã QR cho người khác.
        </p>
      )}

      {!paid && (
        <p className={`${card} mt-6 text-center text-body text-fg-muted`}>Đơn chưa thanh toán nên chưa có vé. Thanh toán xong vé sẽ hiện ở đây.</p>
      )}
      {paid && tickets.length === 0 && (
        <div className={`${card} mt-6 text-center`}>
          <p className="text-body text-fg-muted">Đơn đã thanh toán nhưng vé chưa được xuất. Tải lại sau ít phút.</p>
          <GhostButton type="button" onClick={ticketState.reload} className="mt-4">
            Tải lại
          </GhostButton>
        </div>
      )}

      {tickets.length > 0 && (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 print:grid-cols-2 print:gap-4">
          {tickets.map((t, i) => (
            <TicketCard key={t.id} ticket={t} order={order} index={i + 1} total={tickets.length} />
          ))}
        </ul>
      )}
    </main>
  )
}
