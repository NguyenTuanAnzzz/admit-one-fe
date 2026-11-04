import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { GhostButton, PrimaryButton } from '../../components/Button'
import { SeatMapCanvas } from '../../components/seatmap/SeatMapCanvas'
import { Spinner } from '../../components/Spinner'
import useSeatMapEditor from '../../hook/useSeatMapEditor'
import { EVENT_STATUS_LABEL, EVENT_STATUS_STYLE } from '../../lib/eventStatus'
import { formatCount, formatMoney } from '../../lib/format'
import { MAX_ROWS, MAX_SEATS_PER_ROW } from '../../lib/seatLayout'

const card = 'rounded-card border border-card-line bg-surface p-card'
const input =
  'block min-h-11 w-full rounded-input bg-surface px-3 text-body-sm text-fg ring-1 ring-input-line outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:bg-surface-sunken disabled:text-fg-muted'
const smallButton =
  'inline-flex min-h-11 cursor-pointer items-center justify-center rounded-pill border-[1.5px] border-button-secondary-line px-4 text-body-sm font-semibold text-button-secondary-fg hover:border-fg hover:bg-button-secondary-hover disabled:cursor-not-allowed disabled:opacity-50'
const dangerLink = 'inline-flex min-h-11 items-center text-body-sm font-semibold text-danger hover:underline disabled:opacity-50'

const OBJECT_TYPES = [
  ['STAGE', 'Sân khấu'],
  ['SCREEN', 'Màn LED'],
  ['FOH', 'FOH'],
  ['CLOSED_AREA', 'Khối đóng'],
  ['LABEL', 'Chữ ghi chú'],
]

/** Ô nhập nhỏ có nhãn, dùng trong bảng điều khiển (TextField chuẩn quá to cho cột hẹp) */
function Field({ label, hint, className = '', children }) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="text-caption font-semibold text-fg-muted">
        {label}
      </label>
      <div className="mt-1">{children(id)}</div>
      {hint && <p className="mt-1 text-caption text-fg-muted">{hint}</p>}
    </div>
  )
}

function Section({ title, action, children }) {
  return (
    <section className={card}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-body font-bold text-title">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

const numberValue = (v) => (v === '' ? '' : Number(v))

function MapSection({ editor }) {
  const { map, readOnly, setMapField, uploadBackground, uploadingBg } = editor
  const fileId = useId()
  return (
    <Section title="Mặt bằng">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Rộng">
          {(id) => <input id={id} type="number" min={200} max={5000} className={input} value={map.mapWidth} disabled={readOnly} onChange={(e) => setMapField('mapWidth', numberValue(e.target.value) || 200)} />}
        </Field>
        <Field label="Cao">
          {(id) => <input id={id} type="number" min={200} max={5000} className={input} value={map.mapHeight} disabled={readOnly} onChange={(e) => setMapField('mapHeight', numberValue(e.target.value) || 200)} />}
        </Field>
      </div>
      <p className="mt-3 text-caption text-fg-muted">Ảnh mặt bằng hiện mờ làm nền để đặt khu cho khớp. Khách không thấy ảnh này.</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label htmlFor={fileId} className={`${smallButton} focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus ${readOnly || uploadingBg ? 'pointer-events-none opacity-50' : ''}`}>
          {uploadingBg ? <Spinner /> : null}
          {uploadingBg ? 'Đang tải...' : map.mapBackgroundUrl ? 'Đổi ảnh nền' : 'Tải ảnh nền'}
          <input
            id={fileId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={readOnly || uploadingBg}
            onChange={(e) => {
              uploadBackground(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </label>
        {map.mapBackgroundUrl && !readOnly && (
          <button type="button" className={dangerLink} onClick={() => setMapField('mapBackgroundUrl', '')}>
            Bỏ ảnh nền
          </button>
        )}
      </div>
    </Section>
  )
}

function TierSection({ editor }) {
  const { map, readOnly, summary, addTier, updateTier, removeTier } = editor
  const [error, setError] = useState(null)
  return (
    <Section
      title="Hạng vé"
      action={
        !readOnly && (
          <button type="button" className={smallButton} onClick={addTier}>
            + Thêm
          </button>
        )
      }
    >
      {map.tiers.length === 0 && <p className="text-body-sm text-fg-muted">Chưa có hạng vé. Thêm hạng vé trước, rồi mới thêm khu.</p>}
      <ul className="space-y-4">
        {map.tiers.map((t) => (
          <li key={t.key} className="border-t border-line pt-4 first:border-t-0 first:pt-0">
            <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-3">
              <Field label="Màu">
                {(id) => <input id={id} type="color" className="h-11 w-11 cursor-pointer rounded-input ring-1 ring-input-line" value={t.color} disabled={readOnly} onChange={(e) => updateTier(t.key, { color: e.target.value.toUpperCase() })} />}
              </Field>
              <Field label="Tên hạng vé">{(id) => <input id={id} className={input} value={t.name} disabled={readOnly} onChange={(e) => updateTier(t.key, { name: e.target.value })} />}</Field>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Giá (đồng)">
                {(id) => <input id={id} type="number" min={0} step={1000} className={input} value={t.price} disabled={readOnly} onChange={(e) => updateTier(t.key, { price: numberValue(e.target.value) })} />}
              </Field>
              <Field label="Nhóm khu vực">
                {(id) => <input id={id} className={input} placeholder="Lòng sân" value={t.areaGroup} disabled={readOnly} onChange={(e) => updateTier(t.key, { areaGroup: e.target.value })} />}
              </Field>
            </div>
            <div className="mt-2 flex items-center justify-between text-caption text-fg-muted">
              <span>
                {formatCount(summary.byTier[t.key] ?? 0)} ghế{t.price !== '' && ` · ${formatMoney(Number(t.price))}`}
              </span>
              {!readOnly && (
                <button type="button" className={dangerLink} onClick={() => setError(removeTier(t.key))}>
                  Xoá
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="mt-3 text-body-sm text-danger">
          {error}
        </p>
      )}
    </Section>
  )
}

function ZoneEditor({ editor, zone }) {
  const { map, readOnly, updateZone, removeZone } = editor
  const set = (patch) => updateZone(zone.key, patch)
  return (
    <div className="mt-4 space-y-3 rounded-input bg-surface-sunken p-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tên khu">{(id) => <input id={id} className={input} value={zone.label} disabled={readOnly} onChange={(e) => set({ label: e.target.value })} />}</Field>
        <Field label="Hạng vé">
          {(id) => (
            <select id={id} className={input} value={zone.tierKey} disabled={readOnly} onChange={(e) => set({ tierKey: e.target.value })}>
              {map.tiers.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`Số hàng (tối đa ${MAX_ROWS})`}>
          {(id) => <input id={id} type="number" min={1} max={MAX_ROWS} className={input} value={zone.rowCount} disabled={readOnly} onChange={(e) => set({ rowCount: e.target.value })} />}
        </Field>
        <Field label={`Ghế mỗi hàng (tối đa ${MAX_SEATS_PER_ROW})`}>
          {(id) => <input id={id} type="number" min={1} max={MAX_SEATS_PER_ROW} className={input} value={zone.seatsPerRow} disabled={readOnly} onChange={(e) => set({ seatsPerRow: e.target.value })} />}
        </Field>
      </div>
      <fieldset>
        <legend className="text-caption font-semibold text-fg-muted">Kiểu xếp ghế</legend>
        <div className="mt-1 flex gap-4">
          {[
            ['GRID', 'Hàng thẳng'],
            ['ARC', 'Vòng cung'],
          ].map(([value, label]) => (
            <label key={value} className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-body-sm text-fg">
              <input type="radio" name={`layout-${zone.key}`} value={value} checked={zone.seatLayout === value} disabled={readOnly} onChange={() => set({ seatLayout: value })} className="size-4 accent-action" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Xoay (độ)">
          {(id) => <input id={id} type="number" step={5} className={input} value={zone.rotation} disabled={readOnly} onChange={(e) => set({ rotation: numberValue(e.target.value) || 0 })} />}
        </Field>
        <Field label="X">{(id) => <input id={id} type="number" className={input} value={zone.x} disabled={readOnly} onChange={(e) => set({ x: numberValue(e.target.value) || 0 })} />}</Field>
        <Field label="Y">{(id) => <input id={id} type="number" className={input} value={zone.y} disabled={readOnly} onChange={(e) => set({ y: numberValue(e.target.value) || 0 })} />}</Field>
      </div>
      <Field label="Cách bán" hint={zone.seatingMode === 'GENERAL' ? 'Khách chỉ chọn số lượng, hệ thống tự xếp ghế.' : 'Khách bấm chọn từng ghế.'}>
        {(id) => (
          <select id={id} className={input} value={zone.seatingMode} disabled={readOnly} onChange={(e) => set({ seatingMode: e.target.value })}>
            <option value="RESERVED">Chọn từng ghế</option>
            <option value="GENERAL">Chọn theo khu</option>
          </select>
        )}
      </Field>
      {!readOnly && (
        <button type="button" className={dangerLink} onClick={() => removeZone(zone.key)}>
          Xoá khu này
        </button>
      )}
    </div>
  )
}

function ZoneSection({ editor }) {
  const { map, readOnly, selected, setSelected, addZone } = editor
  const tiersByKey = useMemo(() => Object.fromEntries(map.tiers.map((t) => [t.key, t])), [map.tiers])
  const current = selected?.kind === 'zone' ? map.zones.find((z) => z.key === selected.key) : null
  return (
    <Section
      title="Khu"
      action={
        !readOnly && (
          <button type="button" className={smallButton} onClick={addZone} disabled={!map.tiers.length}>
            + Thêm khu
          </button>
        )
      }
    >
      {map.zones.length === 0 && <p className="text-body-sm text-fg-muted">{map.tiers.length ? 'Chưa có khu nào.' : 'Cần ít nhất một hạng vé để thêm khu.'}</p>}
      <ul className="flex flex-wrap gap-2">
        {map.zones.map((z) => {
          const active = current?.key === z.key
          return (
            <li key={z.key}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => setSelected(active ? null : { kind: 'zone', key: z.key })}
                className={`inline-flex min-h-11 items-center gap-2 rounded-pill border px-3 text-body-sm font-semibold ${active ? 'border-chip-active-line bg-chip-active text-chip-active-fg' : 'border-line text-fg hover:border-line-strong'}`}
              >
                <span aria-hidden="true" className="size-3 rounded-full" style={{ background: tiersByKey[z.tierKey]?.color }} />
                {z.label}
                <span className="font-normal opacity-80">{formatCount((Number(z.rowCount) || 0) * (Number(z.seatsPerRow) || 0))}</span>
              </button>
            </li>
          )
        })}
      </ul>
      {current && <ZoneEditor editor={editor} zone={current} />}
    </Section>
  )
}

function ObjectSection({ editor }) {
  const { map, readOnly, selected, setSelected, addObject, updateObject, removeObject } = editor
  const current = selected?.kind === 'object' ? map.objects.find((o) => o.key === selected.key) : null
  const labelOf = (type) => OBJECT_TYPES.find(([t]) => t === type)?.[1] ?? type
  return (
    <Section title="Sân khấu và vật thể">
      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          {OBJECT_TYPES.map(([type, label]) => (
            <button key={type} type="button" className={smallButton} onClick={() => addObject(type)}>
              + {label}
            </button>
          ))}
        </div>
      )}
      {map.objects.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {map.objects.map((o) => {
            const active = current?.key === o.key
            return (
              <li key={o.key}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelected(active ? null : { kind: 'object', key: o.key })}
                  className={`inline-flex min-h-11 items-center rounded-pill border px-3 text-body-sm font-semibold ${active ? 'border-chip-active-line bg-chip-active text-chip-active-fg' : 'border-line text-fg hover:border-line-strong'}`}
                >
                  {o.label || labelOf(o.type)}
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {current && (
        <div className="mt-4 space-y-3 rounded-input bg-surface-sunken p-3">
          <p className="text-caption font-semibold text-fg-muted">{labelOf(current.type)}</p>
          <Field label="Chữ hiện trên sơ đồ">{(id) => <input id={id} className={input} value={current.label} disabled={readOnly} onChange={(e) => updateObject(current.key, { label: e.target.value })} />}</Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Rộng">{(id) => <input id={id} type="number" min={10} className={input} value={current.width} disabled={readOnly} onChange={(e) => updateObject(current.key, { width: Math.max(10, numberValue(e.target.value) || 10) })} />}</Field>
            <Field label="Cao">{(id) => <input id={id} type="number" min={10} className={input} value={current.height} disabled={readOnly} onChange={(e) => updateObject(current.key, { height: Math.max(10, numberValue(e.target.value) || 10) })} />}</Field>
            <Field label="Xoay">{(id) => <input id={id} type="number" step={5} className={input} value={current.rotation} disabled={readOnly} onChange={(e) => updateObject(current.key, { rotation: numberValue(e.target.value) || 0 })} />}</Field>
          </div>
          {!readOnly && (
            <button type="button" className={dangerLink} onClick={() => removeObject(current.key)}>
              Xoá vật thể này
            </button>
          )}
        </div>
      )}
    </Section>
  )
}

/** Dashboard › Sự kiện › Sơ đồ ghế (A-02, A-03, A-05): dựng mặt bằng, hạng vé, khu, khoá ghế khách mời rồi lưu cả sơ đồ. */
export default function DashboardEventSeatMap() {
  const { id } = useParams()
  const location = useLocation()
  const editor = useSeatMapEditor(id)
  const { map, eventStatus, loadError, reload, readOnly, dirty, saving, saveError, savedAt, selected, setSelected, mode, setMode, summary } = editor
  const { hasSavedMap, publishAction, publishing, publish } = editor
  // Tên lấy từ trang trước gửi sang cho nhanh, mở thẳng bằng link thì đợi API trả về
  const eventName = location.state?.eventName ?? editor.event?.name
  // Công bố cần sơ đồ đã lưu trên backend và không còn thay đổi dở, để khách thấy đúng sơ đồ đang nhìn
  const publishBlocked = !hasSavedMap ? 'Lưu sơ đồ trước khi công bố.' : dirty ? 'Còn thay đổi chưa lưu.' : null
  const viewRef = useRef(null)
  const tiersByKey = useMemo(() => (map ? Object.fromEntries(map.tiers.map((t) => [t.key, t])) : {}), [map])

  useEffect(() => {
    const previous = document.title
    document.title = `Sơ đồ ghế${eventName ? ` · ${eventName}` : ''} · Dashboard · Admit One`
    return () => {
      document.title = previous
    }
  }, [eventName])

  return (
    <div className="pb-24">
      <Link to="/dashboard/events" className="inline-flex min-h-11 items-center text-body-sm font-semibold text-fg-muted hover:text-title">
        ← Danh sách sự kiện
      </Link>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-heading font-bold text-title">Sơ đồ ghế{eventName ? `: ${eventName}` : ''}</h1>
        {eventStatus && (
          <span className={`inline-flex items-center rounded-badge px-2.5 py-1 text-caption font-semibold ${EVENT_STATUS_STYLE[eventStatus] ?? ''}`}>{EVENT_STATUS_LABEL[eventStatus] ?? eventStatus}</span>
        )}
      </div>
      {location.state?.created && <p className="mt-3 rounded-input bg-success-subtle px-4 py-3 text-body-sm text-fg">Đã tạo sự kiện. Dựng sơ đồ ghế rồi bấm Lưu.</p>}

      {loadError && (
        <div role="alert" className={`${card} mt-6 text-center`}>
          <p className="text-body-sm text-danger">{loadError}</p>
          <button type="button" onClick={reload} className={`${smallButton} mt-3`}>
            Thử lại
          </button>
        </div>
      )}

      {!loadError && !map && (
        <p role="status" className="mt-6 flex items-center gap-2 text-body-sm text-fg-muted">
          <Spinner /> Đang tải sơ đồ...
        </p>
      )}

      {map && (
        <>
          {readOnly && (
            <p className="mt-4 rounded-input bg-surface-sunken px-4 py-3 text-body-sm text-fg">
              Sự kiện đã công bố nên sơ đồ chỉ xem được, không sửa được. Ghế đã có thể có người giữ hoặc mua.
            </p>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
            {/* Màn hẹp: bản vẽ lên trước (order-1), bảng điều khiển xuống dưới. Từ lg: bảng điều khiển bên trái */}
            <div className="order-2 space-y-4 lg:order-1">
              <MapSection editor={editor} />
              <TierSection editor={editor} />
              <ZoneSection editor={editor} />
              <ObjectSection editor={editor} />
            </div>

            <div className="order-1 lg:sticky lg:top-[88px] lg:order-2">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div role="group" aria-label="Chế độ" className="inline-flex rounded-pill border border-line bg-surface p-1">
                  {[
                    ['move', 'Di chuyển, chọn'],
                    ['block', 'Khoá ghế'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={mode === value}
                      disabled={readOnly && value === 'block'}
                      onClick={() => {
                        setMode(value)
                        setSelected(null)
                      }}
                      className={`inline-flex min-h-9 items-center rounded-pill px-4 text-body-sm font-semibold disabled:opacity-50 ${mode === value ? 'bg-chip-active text-chip-active-fg' : 'text-fg-muted hover:text-title'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="ml-auto flex gap-1">
                  <button type="button" aria-label="Thu nhỏ" className={smallButton} onClick={() => viewRef.current?.zoomOut()}>
                    −
                  </button>
                  <button type="button" aria-label="Phóng to" className={smallButton} onClick={() => viewRef.current?.zoomIn()}>
                    +
                  </button>
                  <button type="button" className={smallButton} onClick={() => viewRef.current?.reset()}>
                    Vừa khung
                  </button>
                </div>
              </div>

              <SeatMapCanvas
                map={map}
                tiersByKey={tiersByKey}
                selected={selected}
                mode={mode}
                readOnly={readOnly}
                viewRef={viewRef}
                onSelect={setSelected}
                onChangeZone={editor.updateZone}
                onChangeObject={editor.updateObject}
                onToggleSeat={editor.toggleSeat}
              />

              <p className="mt-2 text-caption text-fg-muted">
                {mode === 'block'
                  ? 'Bấm vào ghế để khoá (ghế khách mời, ghế kỹ thuật) hoặc mở lại. Ghế khoá là ô vuông xám.'
                  : 'Kéo khu để đặt vị trí, bấm khu rồi kéo tay cầm tròn để xoay. Cuộn chuột để phóng to, kéo nền để di chuyển.'}
              </p>
              {map.tiers.length > 0 && (
                <ul aria-label="Chú thích hạng vé" className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-body-sm">
                  {map.tiers.map((t) => (
                    <li key={t.key} className="inline-flex items-center gap-2">
                      <span aria-hidden="true" className="size-3 rounded-full" style={{ background: t.color }} />
                      {t.name}
                      {t.price !== '' && <span className="text-fg-muted">{formatMoney(Number(t.price))}</span>}
                    </li>
                  ))}
                  <li className="inline-flex items-center gap-2">
                    <span aria-hidden="true" className="size-3 rounded-[2px] border border-fg bg-line-strong" />
                    Ghế khoá
                  </li>
                </ul>
              )}
            </div>
          </div>

          {/* Thanh lưu dính đáy: luôn thấy tổng số ghế và nút Lưu dù đang cuộn bảng điều khiển */}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur md:left-60">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-gutter py-3 md:px-10">
              <p className="text-body-sm text-fg">
                <span className="font-semibold">{map.tiers.length}</span> hạng · <span className="font-semibold">{map.zones.length}</span> khu ·{' '}
                <span className="font-semibold">{formatCount(summary.total)}</span> ghế · {formatCount(summary.blocked)} khoá ·{' '}
                <span className="font-semibold">{formatCount(summary.sellable)}</span> bán được
              </p>
              <div aria-live="polite" className="text-body-sm">
                {saveError && <span className="text-danger">{saveError}</span>}
                {!saveError && dirty && <span className="text-fg-muted">Có thay đổi chưa lưu</span>}
                {!saveError && !dirty && savedAt && <span className="text-success">Đã lưu lúc {savedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>}
              </div>
              {!readOnly && (
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  {publishAction && publishBlocked && <span className="text-caption text-fg-muted">{publishBlocked}</span>}
                  <PrimaryButton type="button" disabled={saving || !dirty} onClick={editor.save}>
                    {saving && <Spinner />}
                    {saving ? 'Đang lưu...' : 'Lưu sơ đồ'}
                  </PrimaryButton>
                  {publishAction && (
                    <GhostButton type="button" disabled={Boolean(publishBlocked) || publishing || saving} onClick={publish}>
                      {publishing && <Spinner />}
                      {publishing ? 'Đang công bố...' : publishAction.target === 'ON_SALE' ? 'Công bố và mở bán' : 'Công bố'}
                    </GhostButton>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
