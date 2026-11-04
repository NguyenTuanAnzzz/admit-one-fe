import { useEffect } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { GhostButton, PrimaryButton } from '../../components/Button'
import { Spinner } from '../../components/Spinner'
import useTicketTiers, { MAX_PRICE, MAX_QUANTITY, MAX_TIERS } from '../../hook/useTicketTiers'
import { EVENT_STATUS_LABEL, EVENT_STATUS_STYLE } from '../../lib/eventStatus'
import { formatCount, formatMoney } from '../../lib/format'

const card = 'rounded-card border border-card-line bg-surface p-card'
const input = (invalid) =>
  `block min-h-11 w-full rounded-input bg-surface px-3 text-body-sm text-fg tabular-nums outline-none placeholder:text-fg-placeholder focus-visible:ring-2 focus-visible:ring-focus disabled:bg-surface-sunken disabled:text-fg-muted ${
    invalid ? 'ring-2 ring-danger' : 'ring-1 ring-input-line'
  }`
const smallButton =
  'inline-flex min-h-11 cursor-pointer items-center justify-center rounded-pill border-[1.5px] border-button-secondary-line px-4 text-body-sm font-semibold text-button-secondary-fg hover:border-fg hover:bg-button-secondary-hover disabled:cursor-not-allowed disabled:opacity-50'
const iconButton =
  'inline-flex size-11 items-center justify-center rounded-pill text-fg-muted hover:bg-surface-sunken hover:text-title disabled:cursor-not-allowed disabled:opacity-30'

// Cột của hàng tiêu đề và từng dòng giống nhau để thẳng hàng: thứ tự, màu, tên, giá, số lượng, đã bán, xoá
const ROW_COLUMNS = 'md:grid-cols-[44px_44px_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_80px_44px]'

const numberValue = (v) => (v === '' ? '' : Number(v))

function TierRow({ tier, index, count, error = {}, readOnly, onChange, onMove, onRemove }) {
  const label = tier.name.trim() || `hạng ${index + 1}`
  const fieldError = (name) =>
    error[name] && (
      <p id={`${tier.key}-${name}-loi`} className="mt-1 text-caption text-danger">
        {error[name]}
      </p>
    )
  const described = (name) => (error[name] ? `${tier.key}-${name}-loi` : undefined)

  return (
    <li className={`grid grid-cols-[44px_44px_minmax(0,1fr)] gap-x-3 gap-y-3 border-t border-line py-4 first:border-t-0 md:items-start ${ROW_COLUMNS}`}>
      <div className="flex flex-col">
        <button type="button" aria-label={`Đưa ${label} lên`} className={iconButton} disabled={readOnly || index === 0} onClick={() => onMove(-1)}>
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10l4-4 4 4" />
          </svg>
        </button>
        <button type="button" aria-label={`Đưa ${label} xuống`} className={iconButton} disabled={readOnly || index === count - 1} onClick={() => onMove(1)}>
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6l4 4 4-4" />
          </svg>
        </button>
      </div>

      <div>
        <input
          type="color"
          aria-label={`Màu của ${label}`}
          className="h-11 w-11 cursor-pointer rounded-input ring-1 ring-input-line disabled:cursor-not-allowed"
          value={tier.color}
          disabled={readOnly}
          onChange={(e) => onChange({ color: e.target.value.toUpperCase() })}
        />
      </div>

      <div>
        <label className="text-caption font-semibold text-fg-muted md:sr-only" htmlFor={`${tier.key}-name`}>
          Tên hạng vé
        </label>
        <input
          id={`${tier.key}-name`}
          className={input(error.name)}
          placeholder="VIP, Hạng A, Đứng..."
          maxLength={50}
          value={tier.name}
          disabled={readOnly}
          aria-invalid={Boolean(error.name)}
          aria-describedby={described('name')}
          onChange={(e) => onChange({ name: e.target.value })}
        />
        {fieldError('name')}
      </div>

      {/* Dưới md: giá, số lượng, đã bán, nút xoá xuống dòng dưới tên, có nhãn vì không còn hàng tiêu đề cột */}
      <div className="col-span-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px] gap-3 md:contents">
        <div>
          <label className="text-caption font-semibold text-fg-muted md:sr-only" htmlFor={`${tier.key}-price`}>
            Giá (đồng)
          </label>
          <input
            id={`${tier.key}-price`}
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_PRICE}
            step={1000}
            className={input(error.price)}
            placeholder="1500000"
            value={tier.price}
            disabled={readOnly}
            aria-invalid={Boolean(error.price)}
            aria-describedby={described('price')}
            onChange={(e) => onChange({ price: numberValue(e.target.value) })}
          />
          {fieldError('price') ?? (tier.price !== '' && <p className="mt-1 text-caption text-fg-muted">{formatMoney(Number(tier.price))}</p>)}
        </div>

        <div>
          <label className="text-caption font-semibold text-fg-muted md:sr-only" htmlFor={`${tier.key}-quantity`}>
            Số vé
          </label>
          <input
            id={`${tier.key}-quantity`}
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_QUANTITY}
            className={input(error.quantity)}
            placeholder="500"
            value={tier.quantity}
            disabled={readOnly}
            aria-invalid={Boolean(error.quantity)}
            aria-describedby={described('quantity')}
            onChange={(e) => onChange({ quantity: numberValue(e.target.value) })}
          />
          {fieldError('quantity')}
        </div>

        <p className="hidden min-h-11 items-center text-body-sm text-fg tabular-nums md:flex">{formatCount(tier.sold)}</p>

        <div className="self-end md:self-start">
          {!readOnly && (
            <button type="button" aria-label={`Xoá ${label}`} className={`${iconButton} hover:text-danger`} onClick={onRemove}>
              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          )}
        </div>

        {tier.sold > 0 && <p className="col-span-3 text-caption text-fg-muted md:hidden">Đã bán {formatCount(tier.sold)} vé</p>}
      </div>
    </li>
  )
}

/**
 * Dashboard › Sự kiện › Hạng vé (A-02, A-03): mỗi hạng có tên, giá, số vé, màu. Lưu cả danh sách một lần.
 * Bán theo số lượng, không có ghế: khách chọn hạng và số vé, mỗi vé một mã QR.
 */
export default function DashboardEventTiers() {
  const { id } = useParams()
  const location = useLocation()
  const editor = useTicketTiers(id)
  const { tiers, event, loadError, reload, readOnly, dirty, saving, errors, savedAt, totals, addTier, updateTier, removeTier, moveTier, save } = editor
  const { hasSaved, publishAction, publishing, publish } = editor
  // Tên lấy từ trang trước gửi sang cho nhanh, mở thẳng bằng link thì đợi API trả về
  const eventName = location.state?.eventName ?? event?.name
  // Công bố cần hạng vé đã lưu trên backend và không còn thay đổi dở, để khách thấy đúng giá đang nhìn
  const publishBlocked = !hasSaved ? 'Lưu hạng vé trước khi công bố.' : dirty ? 'Còn thay đổi chưa lưu.' : null

  useEffect(() => {
    const previous = document.title
    document.title = `Hạng vé${eventName ? ` · ${eventName}` : ''} · Dashboard · Admit One`
    return () => {
      document.title = previous
    }
  }, [eventName])

  return (
    <div className="pb-28">
      <Link to="/dashboard/events" className="inline-flex min-h-11 items-center text-body-sm font-semibold text-fg-muted hover:text-title">
        ← Danh sách sự kiện
      </Link>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-heading font-bold text-title">Hạng vé{eventName ? `: ${eventName}` : ''}</h1>
        {event && <span className={`inline-flex items-center rounded-badge px-2.5 py-1 text-caption font-semibold ${EVENT_STATUS_STYLE[event.status] ?? ''}`}>{EVENT_STATUS_LABEL[event.status] ?? event.status}</span>}
      </div>
      <p className="mt-2 text-body-sm text-fg-muted">Khách chọn hạng vé và số lượng, không chọn ghế. Thứ tự ở đây là thứ tự khách thấy trên trang sự kiện.</p>
      {location.state?.created && <p className="mt-3 rounded-input bg-success-subtle px-4 py-3 text-body-sm text-fg">Đã tạo sự kiện. Thêm hạng vé rồi bấm Lưu.</p>}

      {loadError && (
        <div role="alert" className={`${card} mt-6 text-center`}>
          <p className="text-body-sm text-danger">{loadError}</p>
          <button type="button" onClick={reload} className={`${smallButton} mt-3`}>
            Thử lại
          </button>
        </div>
      )}

      {!loadError && !tiers && (
        <p role="status" className="mt-6 flex items-center gap-2 text-body-sm text-fg-muted">
          <Spinner /> Đang tải hạng vé...
        </p>
      )}

      {tiers && (
        <>
          {readOnly && <p className="mt-4 rounded-input bg-surface-sunken px-4 py-3 text-body-sm text-fg">Sự kiện đã công bố nên hạng vé chỉ xem được, không sửa được. Khách có thể đã mua vé theo giá này.</p>}

          <section aria-label="Danh sách hạng vé" className={`${card} mt-6 py-2`}>
            <div aria-hidden="true" className={`hidden gap-x-3 border-b border-line py-3 text-caption font-semibold text-fg-muted md:grid ${ROW_COLUMNS}`}>
              <span>Thứ tự</span>
              <span>Màu</span>
              <span>Tên hạng vé</span>
              <span>Giá (đồng)</span>
              <span>Số vé</span>
              <span>Đã bán</span>
              <span />
            </div>

            {tiers.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-body font-semibold text-title">Chưa có hạng vé nào</p>
                <p className="mt-1 text-body-sm text-fg-muted">Ví dụ: VIP 3.000.000đ × 200 vé, Hạng A 1.500.000đ × 800 vé.</p>
              </div>
            ) : (
              <ul>
                {tiers.map((t, i) => (
                  <TierRow
                    key={t.key}
                    tier={t}
                    index={i}
                    count={tiers.length}
                    error={errors.rows[t.key]}
                    readOnly={readOnly}
                    onChange={(patch) => updateTier(t.key, patch)}
                    onMove={(step) => moveTier(t.key, step)}
                    onRemove={() => removeTier(t.key)}
                  />
                ))}
              </ul>
            )}

            {!readOnly && (
              <div className="flex flex-wrap items-center gap-3 border-t border-line py-4">
                <button type="button" className={smallButton} disabled={tiers.length >= MAX_TIERS} onClick={addTier}>
                  + Thêm hạng vé
                </button>
                {tiers.length >= MAX_TIERS && <span className="text-caption text-fg-muted">Tối đa {MAX_TIERS} hạng vé.</span>}
              </div>
            )}
          </section>

          {/* Thanh lưu dính đáy: luôn thấy tổng số vé và nút Lưu dù danh sách dài */}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur md:left-60">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-gutter py-3 md:px-10">
              <p className="text-body-sm text-fg">
                <span className="font-semibold">{tiers.length}</span> hạng · <span className="font-semibold">{formatCount(totals.quantity)}</span> vé
                {totals.sold > 0 && <> · đã bán {formatCount(totals.sold)}</>}
                <span className="text-fg-muted"> · bán hết thu {formatMoney(totals.revenue)}</span>
              </p>
              <div aria-live="polite" className="text-body-sm">
                {errors.form && <span className="text-danger">{errors.form}</span>}
                {!errors.form && dirty && <span className="text-fg-muted">Có thay đổi chưa lưu</span>}
                {!errors.form && !dirty && savedAt && <span className="text-success">Đã lưu lúc {savedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>}
              </div>
              {!readOnly && (
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  {publishAction && publishBlocked && <span className="text-caption text-fg-muted">{publishBlocked}</span>}
                  <PrimaryButton type="button" disabled={saving || !dirty} onClick={save}>
                    {saving && <Spinner />}
                    {saving ? 'Đang lưu...' : 'Lưu hạng vé'}
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
