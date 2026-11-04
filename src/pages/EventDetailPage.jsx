import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { GhostButton, PrimaryButton } from '../components/Button'
import { PosterViewer } from '../components/PosterViewer'
import { SeatPicker } from '../components/seatmap/SeatPicker'
import { Spinner } from '../components/Spinner'
import useEventDetail, { MAX_SELECTED } from '../hook/useEventDetail'
import { EVENT_STATUS_LABEL, EVENT_STATUS_STYLE } from '../lib/eventStatus'
import { formatCount, formatDuration, formatMoney, hanoiParts, secondsUntil, useNow } from '../lib/format'

const card = 'rounded-card border border-card-line bg-card p-card'
const textLink = 'inline-flex min-h-11 items-center font-semibold text-title underline underline-offset-4 hover:text-fg-muted'
const smallButton =
  'inline-flex min-h-11 items-center justify-center rounded-pill border-[1.5px] border-button-secondary-line px-4 text-body-sm font-semibold text-button-secondary-fg hover:border-fg hover:bg-button-secondary-hover disabled:cursor-not-allowed disabled:opacity-50'

const formatHanoi = (iso) => {
  const p = hanoiParts(iso)
  return `${p.time}, ${p.weekday} ${p.day}/${p.month}/${p.year}`
}

const seatName = (s) => `${s.rowLabel}-${String(s.seatNumber).padStart(2, '0')}`

/** Lời nhắn theo trạng thái: chưa mở bán thì vẫn xem sơ đồ được nhưng chưa chọn ghế */
function saleMessage(event, untilSale) {
  switch (event.status) {
    case 'UPCOMING':
      return untilSale > 0 ? 'Chưa mở bán. Bạn xem trước sơ đồ được, tới giờ mở bán mới chọn ghế.' : 'Sắp mở bán, tải lại trang sau ít phút.'
    case 'SOLD_OUT':
      return 'Sự kiện đã bán hết vé. Ghế được nhả lại (khi người khác hết thời gian giữ ghế) sẽ hiện trên sơ đồ.'
    case 'CANCELLED':
      return 'Sự kiện đã bị huỷ. Đơn đã thanh toán sẽ được hoàn tiền.'
    default:
      return null
  }
}

/** Danh sách chọn ghế bằng HTML cạnh sơ đồ: chọn hàng rồi chọn ghế, dùng được bằng bàn phím và trình đọc màn hình. */
function SeatList({ seats, selectedIds, canSelect, onToggle }) {
  const rows = useMemo(() => {
    const byRow = new Map()
    seats.forEach((s) => byRow.set(s.rowLabel, [...(byRow.get(s.rowLabel) ?? []), s]))
    return [...byRow.entries()]
  }, [seats])
  const [row, setRow] = useState(rows[0]?.[0] ?? '')
  const current = rows.find(([label]) => label === row)?.[1] ?? []

  return (
    <div className="mt-4">
      <label htmlFor="chon-hang" className="text-caption font-semibold text-fg-muted">
        Chọn hàng
      </label>
      <select id="chon-hang" value={row} onChange={(e) => setRow(e.target.value)} className="mt-1 block min-h-11 w-full max-w-xs rounded-input bg-surface px-3 text-body-sm ring-1 ring-input-line">
        {rows.map(([label, list]) => (
          <option key={label} value={label}>
            Hàng {label} (còn {list.filter((s) => s.status === 'AVAILABLE').length})
          </option>
        ))}
      </select>
      <ul aria-label={`Ghế hàng ${row}`} className="mt-3 flex flex-wrap gap-2">
        {current.map((s) => {
          const isSelected = selectedIds.has(s.id)
          const available = s.status === 'AVAILABLE'
          return (
            <li key={s.id}>
              <button
                type="button"
                aria-pressed={isSelected}
                disabled={!isSelected && (!canSelect || !available)}
                onClick={() => onToggle(s)}
                className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-input border px-2 text-body-sm font-semibold tabular-nums disabled:cursor-not-allowed ${
                  isSelected ? 'border-fg bg-inverse text-fg-inverse' : available ? 'border-line-strong bg-surface text-fg hover:border-fg' : 'border-line bg-surface-sunken text-fg-muted line-through'
                }`}
              >
                {s.seatNumber}
                <span className="sr-only">{isSelected ? ', đang chọn' : available ? ', còn trống' : ', không chọn được'}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * Trang chi tiết sự kiện cho khách (C-03, C-04, C-05): thông tin, đếm ngược tới giờ mở bán, bảng giá, sơ đồ chọn ghế.
 * Header và footer do PublicLayout lo. Giữ ghế (giai đoạn 2, Redis) chưa làm nên nút Giữ ghế ghi rõ "sắp có".
 */
export default function EventDetailPage() {
  const { id } = useParams()
  const now = useNow()
  const viewRef = useRef(null)
  const detail = useEventDetail(id)
  const { loading, error, notFound, reload, event, seatMap, tiersById, zonesById, canSelect, zoneSeats, activeZoneId, openZone, reloadZone, selected, selectError, toggleSeat, clearSelection, total } = detail
  const selectedIds = useMemo(() => new Set(selected.map((s) => s.seatId)), [selected])

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
  const activeZone = activeZoneId ? zonesById[activeZoneId] : null
  const activeSeats = activeZone ? zoneSeats[activeZone.id] : null

  // Bảng giá: mỗi hạng vé kèm số ghế còn trống, cộng từ các khu thuộc hạng đó
  const tierRows = seatMap.tiers.map((t) => {
    const zones = seatMap.zones.filter((z) => z.tierId === t.id)
    return { ...t, available: zones.reduce((n, z) => n + z.availableSeats, 0), total: zones.reduce((n, z) => n + z.totalSeats, 0) }
  })

  return (
    <main id="main-content" className={`mx-auto max-w-page px-gutter py-section-sm ${selected.length ? 'pb-40' : ''}`}>
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

      {tierRows.length > 0 && (
        <section aria-labelledby="bang-gia" className="mt-10">
          <h2 id="bang-gia" className="font-display text-heading-sm font-bold text-title">
            Giá vé theo hạng
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tierRows.map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-card border border-card-line bg-card px-4 py-3">
                <span aria-hidden="true" className="size-4 shrink-0 rounded-full" style={{ background: t.color }} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-title">{t.name}</p>
                  <p className="text-body-sm text-fg-muted">
                    {t.areaGroup ? `${t.areaGroup} · ` : ''}
                    {t.available ? `còn ${formatCount(t.available)}/${formatCount(t.total)} ghế` : 'hết vé'}
                  </p>
                </div>
                <p className="font-display text-subheading font-bold text-action tabular-nums">{formatMoney(t.price)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="so-do-ghe" className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="so-do-ghe" className="font-display text-heading-sm font-bold text-title">
            {activeZone ? `Khu ${activeZone.label} · ${tiersById[activeZone.tierId]?.name ?? ''}` : 'Sơ đồ ghế'}
          </h2>
          {seatMap.zones.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {activeZone && (
                <button type="button" className={smallButton} onClick={() => openZone(null)}>
                  ← Xem toàn bộ sơ đồ
                </button>
              )}
              <button type="button" aria-label="Thu nhỏ" className={smallButton} onClick={() => viewRef.current?.zoomOut()}>
                −
              </button>
              <button type="button" aria-label="Phóng to" className={smallButton} onClick={() => viewRef.current?.zoomIn()}>
                +
              </button>
            </div>
          )}
        </div>

        {message && event.status !== 'CANCELLED' && <p className="mt-3 rounded-input bg-surface-sunken px-4 py-3 text-body-sm text-fg">{message}</p>}

        {seatMap.zones.length === 0 ? (
          <p className={`${card} mt-4 text-body-sm text-fg-muted`}>Sự kiện chưa có sơ đồ ghế. Ban tổ chức sẽ cập nhật trước giờ mở bán.</p>
        ) : (
          <>
            <p className="mt-2 text-body-sm text-fg-muted">
              {activeZone ? 'Bấm vào ghế để chọn hoặc bỏ chọn.' : 'Bấm vào một khu để xem ghế.'} Cuộn chuột để phóng to, kéo để di chuyển.
            </p>
            <div className="mt-3">
              <SeatPicker
                seatMap={seatMap}
                tiersById={tiersById}
                activeZoneId={activeZoneId}
                zoneSeats={zoneSeats}
                selectedIds={selectedIds}
                canSelect={canSelect}
                viewRef={viewRef}
                onOpenZone={openZone}
                onToggleSeat={toggleSeat}
              />
            </div>

            <ul aria-label="Chú thích ghế" className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-body-sm">
              <li className="inline-flex items-center gap-2">
                <span aria-hidden="true" className="size-3 rounded-full border border-line-strong bg-badge" /> Còn trống (màu theo hạng vé)
              </li>
              <li className="inline-flex items-center gap-2">
                <span aria-hidden="true" className="size-3 rounded-full border-2 border-dashed border-fg-muted bg-surface" /> Có người đang giữ
              </li>
              <li className="inline-flex items-center gap-2">
                <span aria-hidden="true" className="size-2 rounded-full bg-line-strong" /> Đã bán
              </li>
              <li className="inline-flex items-center gap-2">
                <span aria-hidden="true" className="size-3 rounded-[2px] bg-line-strong" /> Không bán
              </li>
              <li className="inline-flex items-center gap-2">
                <span aria-hidden="true" className="size-3 rounded-full bg-inverse ring-2 ring-surface" /> Bạn đang chọn
              </li>
            </ul>

            {/* Chọn khu và ghế bằng nút HTML: cùng tác dụng với bấm trên sơ đồ, cho bàn phím, trình đọc màn hình và màn hình nhỏ */}
            <div className={`${card} mt-6`}>
              <p id="chon-khu" className="text-body-sm font-semibold text-title">
                Chọn khu
              </p>
              <ul aria-labelledby="chon-khu" className="mt-2 flex flex-wrap gap-2">
                {seatMap.zones.map((z) => (
                  <li key={z.id}>
                    <button
                      type="button"
                      aria-pressed={z.id === activeZoneId}
                      onClick={() => openZone(z.id === activeZoneId ? null : z.id)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-pill border border-line px-3 text-body-sm font-semibold text-fg hover:border-line-strong aria-pressed:border-chip-active-line aria-pressed:bg-chip-active aria-pressed:text-chip-active-fg"
                    >
                      <span aria-hidden="true" className="size-3 rounded-full" style={{ background: tiersById[z.tierId]?.color }} />
                      {z.label}
                      <span className="font-normal">{z.availableSeats ? `còn ${formatCount(z.availableSeats)}` : 'hết'}</span>
                    </button>
                  </li>
                ))}
              </ul>

              {activeZone && activeZone.seatingMode === 'GENERAL' && (
                <p className="mt-4 text-body-sm text-fg-muted">Khu này bán theo số lượng: bạn chọn số vé, hệ thống tự xếp ghế. Chọn số lượng sẽ có ở bước giữ vé.</p>
              )}
              {activeZone && activeZone.seatingMode !== 'GENERAL' && activeSeats?.loading && (
                <p role="status" className="mt-4 flex items-center gap-2 text-body-sm text-fg-muted">
                  <Spinner /> Đang tải ghế...
                </p>
              )}
              {activeZone && activeSeats?.error && (
                <p role="alert" className="mt-4 text-body-sm text-danger">
                  {activeSeats.error}{' '}
                  <button type="button" onClick={() => reloadZone(activeZone.id)} className="font-semibold underline underline-offset-2">
                    Thử lại
                  </button>
                </p>
              )}
              {activeZone && activeZone.seatingMode !== 'GENERAL' && activeSeats?.seats && (
                <SeatList key={activeZone.id} seats={activeSeats.seats} selectedIds={selectedIds} canSelect={canSelect} onToggle={(s) => toggleSeat(activeZone.id, s)} />
              )}
            </div>
          </>
        )}
      </section>

      {/* Ghế đang chọn: dính đáy màn hình để luôn thấy tổng tiền */}
      {selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur">
          <div className="mx-auto flex max-w-page flex-wrap items-center gap-x-4 gap-y-2 px-gutter py-3">
            <div className="min-w-0 flex-1">
              <p className="text-body-sm text-fg-muted">
                {selected.length}/{MAX_SELECTED} ghế
              </p>
              <p className="truncate font-semibold text-title">{selected.map((s) => `${s.zoneLabel} ${seatName(s)}`).join(', ')}</p>
            </div>
            <p className="font-display text-subheading font-bold text-action tabular-nums">{formatMoney(total)}</p>
            <button type="button" onClick={clearSelection} className={smallButton}>
              Bỏ chọn
            </button>
            {/* TODO: giữ ghế 10 phút bằng Redis (giai đoạn 2). Chưa có API nên nút tắt và ghi rõ */}
            <div className="flex flex-col items-end">
              <PrimaryButton type="button" disabled>
                Giữ ghế
              </PrimaryButton>
              <span className="mt-1 text-caption text-fg-muted">Sắp có</span>
            </div>
          </div>
          {selectError && (
            <p role="alert" className="mx-auto max-w-page px-gutter pb-3 text-body-sm text-danger">
              {selectError}
            </p>
          )}
        </div>
      )}
    </main>
  )
}
