import { useEffect, useState } from 'react'
import { m } from 'framer-motion'
import { DEMO_USER, SAMPLE_HOLD } from '../lib/api'
import { formatMinutes, formatMoney } from '../lib/format'
import { fadeUp, inView, stagger } from '../lib/motion'
import { GhostButton } from './Button'
import { Perforation } from './ui'

const STEPS = [
  {
    title: 'Vào phòng chờ khi mở bán',
    body: 'Mỗi tài khoản giữ một chỗ trong hàng. Mở thêm tab không làm bạn lên nhanh hơn, vị trí được tính theo lúc bạn vào hàng.',
  },
  {
    title: 'Chọn tối đa 4 ghế trên sơ đồ',
    body: 'Ghế người khác vừa giữ hoặc vừa mua đổi màu ngay trên màn hình của bạn, không cần tải lại trang.',
  },
  {
    title: 'Ghế được giữ cho bạn 10 phút',
    body: 'Nhiều ghế được giữ cùng lúc hoặc không ghế nào, không có chuyện giữ được một nửa. Đổi ý thì bấm hủy để nhả ghế cho người sau.',
  },
  {
    title: 'Thanh toán qua VNPay hoặc MoMo',
    body: 'Hết 10 phút mà chưa thanh toán, ghế tự trở lại sơ đồ.',
  },
  {
    title: 'Nhận vé qua email, mỗi ghế một mã QR',
    body: 'Vé cũng nằm trong mục Đơn của tôi để tải lại bất cứ lúc nào. Mã đã quét ở cổng thì không dùng lại được.',
  },
]

export function BuyingFlow() {
  return (
    <section id="cach-mua" aria-labelledby="cach-mua-tieu-de" className="px-gutter pb-section-sm md:pb-section">
      <div className="mx-auto grid max-w-page gap-10 rounded-card bg-surface px-5 py-8 border border-card-line sm:px-8 md:py-10 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
        <div>
          <h2 id="cach-mua-tieu-de" className="font-display text-heading-sm font-bold text-title md:text-heading">
            Từ lúc mở bán tới lúc có vé trong email
          </h2>
          <m.ol {...inView} variants={stagger(0.1)} className="mt-6 divide-y divide-line border-y border-line">
            {STEPS.map((s, i) => (
              <m.li key={s.title} variants={fadeUp} className="flex gap-4 py-4">
                <span aria-hidden="true" className="w-9 shrink-0 font-display text-heading-sm leading-none font-bold text-fg-muted tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="text-body font-semibold text-title">{s.title}</h3>
                  <p className="mt-0.5 max-w-[48ch] text-body-sm text-fg-muted">{s.body}</p>
                </div>
              </m.li>
            ))}
          </m.ol>
        </div>

        <HoldReceipt />
      </div>
    </section>
  )
}

/** Phiếu giữ ghế mẫu với đồng hồ 10 phút chạy thật, minh họa bước 3 và 4. */
function HoldReceipt() {
  const order = SAMPLE_HOLD
  const [left, setLeft] = useState(order.remainingSeconds)
  const expired = left === 0
  const urgent = left > 0 && left <= 60

  useEffect(() => {
    if (expired) return
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [expired])

  const unit = order.total / order.seats.length

  return (
    <m.figure {...inView} variants={fadeUp} className="self-start lg:mt-6" aria-labelledby="phieu-giu-ghe">
      <figcaption id="phieu-giu-ghe" className="mb-3 text-body-sm text-fg-muted">
        Ví dụ: phiếu giữ ghế của một đơn hàng mẫu
      </figcaption>
      <div className="rounded-card border border-card-line bg-ticket">
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
          <div>
            <p className="text-caption text-fg-muted">Đơn {order.id}</p>
            <p className="mt-1 font-display text-subheading font-bold text-title">{expired ? 'Đã hết hạn giữ ghế' : 'Đang giữ ghế'}</p>
          </div>
          <div className="text-right">
            <p className="text-caption text-fg-muted">Còn lại</p>
            <p
              role="timer"
              aria-live="off"
              className={`mt-1 font-display text-heading-sm font-bold tabular-nums ${urgent ? 'text-timer-urgent-fg' : expired ? 'text-fg-muted' : 'text-fg'}`}
            >
              {formatMinutes(left)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 border-t border-line px-5 py-4 sm:grid-cols-2 sm:px-6">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-caption font-bold text-title">
              VŨ
            </span>
            <div className="min-w-0">
              <p className="text-caption text-fg-muted">Sự kiện</p>
              <p className="truncate text-body-sm font-semibold">VŨ. Live Concert</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-avatar text-caption font-bold text-avatar-fg">
              {DEMO_USER.initials}
            </span>
            <div className="min-w-0">
              <p className="text-caption text-fg-muted">Người mua</p>
              <p className="truncate text-body-sm font-semibold">{DEMO_USER.name}</p>
            </div>
          </div>
        </div>

        <table className="w-full border-t border-line text-body-sm">
          <caption className="sr-only">Ghế trong đơn</caption>
          <thead>
            <tr className="text-left text-caption text-fg-muted">
              <th scope="col" className="px-5 pt-4 pb-2 font-semibold sm:px-6">Ghế</th>
              <th scope="col" className="px-5 pt-4 pb-2 text-right font-semibold sm:px-6">Giá</th>
            </tr>
          </thead>
          <tbody>
            {order.seats.map((s) => (
              <tr key={s} className={expired ? 'text-fg-muted line-through' : ''}>
                <td className="px-5 py-1.5 sm:px-6">{s}</td>
                <td className="px-5 py-1.5 text-right tabular-nums sm:px-6">{formatMoney(unit)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold">
              <td className="px-5 pt-3 pb-4 sm:px-6">Tổng</td>
              <td className="px-5 pt-3 pb-4 text-right font-display text-subheading font-bold text-action tabular-nums sm:px-6">{formatMoney(order.total)}</td>
            </tr>
          </tfoot>
        </table>

        <Perforation notchClass="bg-surface" />

        <div className="px-5 pt-2 pb-5 sm:px-6">
          {expired ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-body-sm text-fg-muted">Hai ghế đã trở lại sơ đồ cho người khác chọn.</p>
              <GhostButton type="button" onClick={() => setLeft(order.remainingSeconds)}>
                Chạy lại ví dụ
              </GhostButton>
            </div>
          ) : (
            <ul className="flex flex-col gap-2 text-body-sm sm:flex-row sm:gap-5">
              <li className="font-semibold">Thanh toán qua VNPay hoặc MoMo</li>
              <li className="text-fg-muted">Hết giờ thì ghế tự nhả</li>
            </ul>
          )}
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        {!expired && (
          <button type="button" onClick={() => setLeft(0)} className="min-h-11 rounded-full px-3 text-body-sm text-fg-muted underline underline-offset-4 hover:text-fg">
            Xem khi hết giờ
          </button>
        )}
      </div>
    </m.figure>
  )
}
