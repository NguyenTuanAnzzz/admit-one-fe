import { useCallback, useEffect, useState } from 'react'
import { m } from 'framer-motion'
import { FEATURED_EVENT as ev, fetchZones } from '../lib/api'
import { formatCount, formatDuration, formatMoney, hanoiParts, secondsUntil, useNow } from '../lib/format'
import { EASE_OUT } from '../lib/motion'
import { GhostButton, PrimaryButton } from './Button'
import { SectionHeading } from './ui'

/**
 * Sơ đồ tổng quan theo khu (C-03, C-04 cấp 1). Bốn khu xếp hình quạt từ sân khấu ra ngoài.
 * Độ đậm giảm dần theo giá: VIP tím đặc, A tím nhạt, B xám, C viền nét đứt (chưa mở bán).
 */
const ZONE_LOOK = {
  VIP: { width: 'w-[70%] sm:w-[46%]', idle: 'bg-zone-vip text-zone-vip-fg' },
  A: { width: 'w-[80%] sm:w-[66%]', idle: 'bg-zone-a text-zone-a-fg' },
  B: { width: 'w-[90%] sm:w-[84%]', idle: 'bg-zone-b text-zone-b-fg ring-1 ring-inset ring-zone-b-line' },
  C: { width: 'w-full', idle: 'bg-zone-c text-zone-c-fg border border-dashed border-zone-c-line' },
}

export function ZoneMap({ user, onLogin }) {
  const [state, setState] = useState({ status: 'loading', zones: [], error: null })
  const [selectedId, setSelectedId] = useState('VIP')
  const now = useNow()

  const request = useCallback(() => {
    fetchZones()
      .then((zones) => setState({ status: 'ready', zones, error: null }))
      .catch((error) => setState({ status: 'error', zones: [], error }))
  }, [])

  useEffect(() => {
    request()
  }, [request])

  const retry = () => {
    setState({ status: 'loading', zones: [], error: null })
    request()
  }

  const zones = state.zones
  const zone = zones.find((z) => z.id === selectedId) ?? zones[0]

  return (
    <section id="gia-ve" aria-labelledby="gia-ve-tieu-de" className="px-gutter pb-section-sm md:pb-section">
      <div className="mx-auto max-w-page">
        <SectionHeading id="gia-ve-tieu-de" title="Chọn khu ghế">
          <p className="text-body-sm text-fg-muted">
            {ev.title} · {ev.venue}
          </p>
        </SectionHeading>

        <div className="mt-6" aria-busy={state.status === 'loading'}>
          {state.status === 'loading' && <LoadingMap />}

          {state.status === 'error' && (
            <div role="alert" className="rounded-card bg-surface px-6 py-12 text-center border border-card-line">
              <p className="text-subheading font-semibold">{state.error.message}</p>
              <p className="mt-2 text-body text-fg-muted">Số ghế trống thay đổi liên tục nên trang cần tải lại từ hệ thống.</p>
              <GhostButton type="button" onClick={retry} className="mt-6">
                Tải lại sơ đồ
              </GhostButton>
            </div>
          )}

          {state.status === 'ready' && zones.length === 0 && (
            <div className="rounded-card bg-surface px-6 py-12 text-center border border-card-line">
              <p className="text-subheading font-semibold">Ban tổ chức chưa công bố sơ đồ khu</p>
              <p className="mt-2 text-body text-fg-muted">Giá và vị trí từng khu sẽ hiện ở đây trước giờ mở bán.</p>
            </div>
          )}

          {state.status === 'ready' && zone && (
            <div className="grid items-start gap-4 lg:grid-cols-[1.5fr_1fr]">
              <div className="rounded-card bg-surface px-4 py-8 border border-card-line sm:px-10 sm:py-10">
                <div className="mx-auto mb-6 flex h-11 w-[38%] min-w-36 items-center justify-center rounded-pill bg-stage font-display text-subheading font-semibold text-stage-fg">
                  Sân khấu
                </div>
                <div role="radiogroup" aria-label="Chọn khu ghế" className="flex flex-col items-center gap-2.5">
                  {zones.map((z, i) => {
                    const selected = z.id === zone.id
                    const notOpen = z.opensAt && secondsUntil(z.opensAt, now) > 0
                    return (
                      <m.button
                        key={z.id}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        tabIndex={selected ? 0 : -1}
                        data-zone={z.id}
                        onClick={() => setSelectedId(z.id)}
                        onKeyDown={(e) => {
                          const step = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0
                          if (!step) return
                          e.preventDefault()
                          const next = zones[(i + step + zones.length) % zones.length]
                          setSelectedId(next.id)
                          e.currentTarget.parentElement.querySelector(`[data-zone="${next.id}"]`)?.focus()
                        }}
                        className={`${ZONE_LOOK[z.id]?.width ?? 'w-full'} ${ZONE_LOOK[z.id]?.idle ?? 'bg-surface-sunken text-fg'} flex min-h-16 items-center justify-between gap-3 rounded-card px-4 text-left transition-shadow hover:ring-1 hover:ring-fg hover:ring-inset focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-focus sm:px-5 ${
                          selected ? 'outline-2 outline-offset-2 outline-zone-selected' : ''
                        }`}
                      >
                        <span className="font-display text-subheading font-bold whitespace-nowrap">{z.name}</span>
                        <span className="text-body-sm tabular-nums">{notOpen ? 'Chưa mở' : formatMoney(z.price)}</span>
                      </m.button>
                    )
                  })}
                </div>
                <p className="mt-6 text-center text-body-sm text-fg-muted">Dùng phím mũi tên để chuyển khu. Sơ đồ ghế chi tiết mở sau khi qua phòng chờ.</p>
              </div>

              <ZoneDetail zone={zone} now={now} user={user} onLogin={onLogin} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function ZoneDetail({ zone, now, user, onLogin }) {
  const untilOpen = zone.opensAt ? secondsUntil(zone.opensAt, now) : 0
  const isOpen = untilOpen === 0
  const taken = zone.capacity - zone.available
  const pct = Math.round((taken / zone.capacity) * 100)
  const opens = zone.opensAt ? hanoiParts(zone.opensAt) : null

  return (
    <div aria-live="polite" className="rounded-card border border-card-line bg-surface p-6 sm:p-8 lg:sticky lg:top-32">
      {/* Đổi khu: key mới làm nội dung hiện lại và trồi lên nhẹ, để mắt thấy rõ số liệu vừa đổi.
          Không chờ nội dung cũ biến mất (mode="wait"): khung này vẽ lại mỗi giây vì đồng hồ đếm ngược. */}
      <m.div
        key={zone.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE_OUT }}
        className="flex flex-col"
      >
        <p className="text-body-sm text-fg-muted">{zone.position}</p>
        <h3 className="mt-1 font-display text-heading-sm font-bold text-title">{zone.name}</h3>
        <p className="mt-3 font-display text-heading font-extrabold text-action tabular-nums">
          {formatMoney(zone.price)}
          <span className="ml-2 text-body font-medium text-fg-muted">/ ghế</span>
        </p>

        {isOpen ? (
          <div className="mt-6">
            <div className="flex justify-between text-body-sm">
              <span className="text-fg-muted">Còn trống</span>
              <span className="font-semibold tabular-nums">
                {formatCount(zone.available)} / {formatCount(zone.capacity)} ghế
              </span>
            </div>
            <div
              role="meter"
              aria-label={`Đã bán và đang giữ ${pct}%`}
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-2 h-2 overflow-hidden rounded-full bg-surface-sunken ring-1 ring-inset ring-line"
            >
              <m.div
                className="h-full w-full origin-left rounded-full bg-meter"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: pct / 100 }}
                transition={{ duration: 0.7, ease: EASE_OUT }}
              />
            </div>
            <p className="mt-2 text-body-sm text-fg-muted">{pct}% ghế đã bán hoặc đang có người giữ.</p>
          </div>
        ) : (
          <div className="mt-6 rounded-badge bg-countdown px-4 py-3">
            <p className="text-body-sm text-countdown-fg">
              Mở bán {opens.time}, {opens.day}/{opens.month}/{opens.year}
            </p>
            <p className="mt-1 font-display text-heading-sm font-bold tabular-nums">{formatDuration(untilOpen)}</p>
          </div>
        )}

        <div className="mt-6">
          {!user ? (
            <>
              <PrimaryButton type="button" onClick={onLogin} disabled={!isOpen} className="w-full">
                {isOpen ? `Đăng nhập để giữ ghế ${zone.name}` : 'Khu này chưa mở bán'}
              </PrimaryButton>
              <p className="mt-3 text-body-sm text-fg-muted">Khách chưa đăng nhập vẫn xem được giá và sơ đồ, nhưng chưa giữ ghế được.</p>
            </>
          ) : (
            <>
              {/* TODO: dẫn tới /su-kien/:id/phong-cho khi dựng trang phòng chờ và chọn ghế */}
              <PrimaryButton type="button" disabled className="w-full">
                Phòng chờ và chọn ghế: đang xây
              </PrimaryButton>
              <p className="mt-3 text-body-sm text-fg-muted">Bước tiếp theo của bản demo sẽ dựng trang phòng chờ ảo và sơ đồ ghế từng khu.</p>
            </>
          )}
        </div>
      </m.div>
    </div>
  )
}

function LoadingMap() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <p className="sr-only">Đang tải sơ đồ khu</p>
      <div aria-hidden="true" className="flex flex-col items-center gap-2.5 rounded-card bg-surface px-4 py-12 border border-card-line sm:px-10">
        {['w-[38%]', 'w-[46%]', 'w-[66%]', 'w-[84%]', 'w-full'].map((w) => (
          <div key={w} className={`${w} h-14 animate-pulse rounded-card bg-surface-sunken motion-reduce:animate-none`} />
        ))}
      </div>
      <div aria-hidden="true" className="h-80 animate-pulse rounded-card bg-surface border border-card-line motion-reduce:animate-none" />
    </div>
  )
}
