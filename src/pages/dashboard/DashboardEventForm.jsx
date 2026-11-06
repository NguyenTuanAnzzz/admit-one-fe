import { useEffect, useId } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, m } from 'framer-motion'
import { PrimaryButton } from '../../components/Button'
import { PosterViewer } from '../../components/PosterViewer'
import { Spinner } from '../../components/Spinner'
import { TextField } from '../../components/TextField'
import useEventForm, { MAX_TICKET_TYPES } from '../../hook/useEventForm'
import { formatMoney } from '../../lib/format'

const card = 'rounded-card border border-card-line bg-surface p-card'
const smallButton =
  'inline-flex min-h-11 cursor-pointer items-center justify-center rounded-pill border-[1.5px] border-button-secondary-line px-4 text-body-sm font-semibold text-button-secondary-fg hover:border-fg hover:bg-button-secondary-hover'

/** Khung ảnh poster: chọn file là tải lên ngay, có ảnh rồi thì bấm vào để xem lớn bằng Viewer.js. */
function PosterField({ poster, onChange, onRemove }) {
  const inputId = useId()
  const hintId = `${inputId}-goi-y`
  const hasImage = Boolean(poster.previewUrl)

  return (
    <div>
      <p className="text-body-sm font-medium text-fg">
        Ảnh poster <span className="font-normal text-fg-muted">(không bắt buộc)</span>
      </p>

      <div className="relative mt-1.5 aspect-[3/4] w-full max-w-[280px]">
        {hasImage ? (
          // Đã lên Cloudinary thì hiện ảnh thật, đang tải thì hiện ảnh trên máy
          <PosterViewer src={poster.url ?? poster.previewUrl} alt="Ảnh poster sự kiện" className="size-full" />
        ) : (
          <div aria-hidden="true" className="flex size-full items-center justify-center rounded-card border border-dashed border-line-strong bg-surface-sunken text-body-sm text-fg-muted">
            Chưa có ảnh
          </div>
        )}
        {poster.status === 'uploading' && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-card bg-overlay text-body-sm font-semibold text-fg-inverse">
            <Spinner />
            Đang tải lên...
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {/* Ô chọn file ẩn đi nhưng vẫn nhận Tab, nhãn bao ngoài vẽ viền focus */}
        <label htmlFor={inputId} className={`${smallButton} focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus ${poster.status === 'uploading' ? 'pointer-events-none opacity-60' : ''}`}>
          {hasImage ? 'Đổi ảnh' : 'Chọn ảnh'}
          <input
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onChange}
            disabled={poster.status === 'uploading'}
            aria-describedby={hintId}
            className="sr-only"
          />
        </label>
        {hasImage && poster.status !== 'uploading' && (
          <button type="button" onClick={onRemove} className={smallButton}>
            Bỏ ảnh
          </button>
        )}
      </div>

      <p id={hintId} className="mt-2 text-body-sm text-fg-muted">
        JPG, PNG hoặc WebP, tối đa 10MB. Nên dùng ảnh dọc tỉ lệ 3:4.
      </p>
      <div aria-live="polite">
        {poster.status === 'done' && <p className="mt-1 text-body-sm font-medium text-success">Đã tải ảnh lên.</p>}
        {poster.error && <p className="mt-1 text-body-sm text-danger">{poster.error}</p>}
      </div>
    </div>
  )
}

const input = (invalid) =>
  `block min-h-11 w-full rounded-input bg-surface px-3 text-body-sm text-fg outline-none placeholder:text-fg-placeholder focus-visible:ring-2 focus-visible:ring-focus ${
    invalid ? 'ring-2 ring-danger' : 'ring-1 ring-input-line'
  }`

/** Một ô nhập của loại vé, có nhãn và dòng lỗi gắn với ô qua aria-describedby */
function TicketInput({ id, label, error, hint, className = '', ...props }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-caption font-semibold text-fg-muted">
        {label}
      </label>
      <input id={id} className={`${input(error)} mt-1`} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-loi` : undefined} {...props} />
      {error ? (
        <p id={`${id}-loi`} className="mt-1 text-caption text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-caption text-fg-muted">{hint}</p>
      )}
    </div>
  )
}

/** Loại vé của sự kiện mới: tên, giá, số lượng, mô tả. Backend bắt buộc ít nhất một loại */
function TicketSection({ tickets, errors, onAdd, onUpdate, onRemove }) {
  const totalQuantity = tickets.reduce((n, t) => n + (Number(t.quantity) || 0), 0)
  return (
    <section aria-labelledby="loai-ve" className="mt-8 border-t border-line pt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="loai-ve" className="text-subheading font-bold text-title">
            Loại vé
          </h2>
          <p className="mt-1 text-body-sm text-fg-muted">Ít nhất một loại. Khách chọn loại vé và số lượng, không chọn ghế.</p>
        </div>
        <p className="text-body-sm text-fg">
          {tickets.length} loại · <span className="font-semibold">{totalQuantity.toLocaleString('vi-VN')}</span> vé
        </p>
      </div>

      <ul className="mt-4 space-y-3">
        {tickets.map((t, i) => {
          const e = errors[t.key] ?? {}
          const label = t.name.trim() || `loại vé ${i + 1}`
          return (
            <li key={t.key} className="rounded-card border border-line bg-surface-sunken/40 p-4">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)]">
                <TicketInput id={`${t.key}-name`} label="Tên loại vé" placeholder="VIP, Hạng A, Vé đứng..." maxLength={100} value={t.name} error={e.name} onChange={(ev) => onUpdate(t.key, { name: ev.target.value })} />
                <TicketInput
                  id={`${t.key}-price`}
                  label="Giá (đồng)"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1000}
                  placeholder="1500000"
                  value={t.price}
                  error={e.price}
                  hint={t.price !== '' && Number(t.price) >= 0 ? formatMoney(Number(t.price)) : null}
                  onChange={(ev) => onUpdate(t.key, { price: ev.target.value })}
                />
                <TicketInput id={`${t.key}-quantity`} label="Số lượng" type="number" inputMode="numeric" min={1} step={1} placeholder="500" value={t.quantity} error={e.quantity} onChange={(ev) => onUpdate(t.key, { quantity: ev.target.value })} />
              </div>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <TicketInput
                  id={`${t.key}-description`}
                  label="Mô tả (không bắt buộc)"
                  className="min-w-0 flex-1 basis-60"
                  placeholder="Khu đứng sát sân khấu, tặng kèm lightstick..."
                  value={t.description}
                  onChange={(ev) => onUpdate(t.key, { description: ev.target.value })}
                />
                {tickets.length > 1 && (
                  <button type="button" onClick={() => onRemove(t.key)} aria-label={`Xoá ${label}`} className="inline-flex min-h-11 items-center rounded-pill px-3 text-body-sm font-semibold text-danger hover:bg-danger-subtle">
                    Xoá
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onAdd} disabled={tickets.length >= MAX_TICKET_TYPES} className={`${smallButton} disabled:cursor-not-allowed disabled:opacity-50`}>
          + Thêm loại vé
        </button>
        {tickets.length >= MAX_TICKET_TYPES && <span className="text-caption text-fg-muted">Tối đa {MAX_TICKET_TYPES} loại vé.</span>}
      </div>
    </section>
  )
}

/**
 * Dashboard › Sự kiện › Thêm sự kiện (/events/new) hoặc Sửa sự kiện (/events/:id/edit), cùng một form (A-01).
 * Tạo: nhập luôn các loại vé trong cùng form, gửi một lần. Xong quay về danh sách.
 */
export default function DashboardEventForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const form = useEventForm(id)
  const { values, error, loading, poster, loaded, loadError, handleChange, handlePosterChange, handleRemovePoster, handleSubmit } = form
  const pageTitle = isEdit ? 'Sửa sự kiện' : 'Thêm sự kiện'

  useEffect(() => {
    const previous = document.title
    document.title = `${pageTitle} · Dashboard · Admit One`
    return () => {
      document.title = previous
    }
  }, [pageTitle])

  const field = (name) => ({ name, value: values[name], onChange: handleChange, error: error[name] })
  const uploading = poster.status === 'uploading'

  return (
    <div>
      <Link to="/dashboard/events" className="inline-flex min-h-11 items-center text-body-sm font-semibold text-fg-muted hover:text-title">
        ← Danh sách sự kiện
      </Link>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-heading font-bold text-title">{pageTitle}</h1>
      </div>
      <p className="mt-2 text-body-sm text-fg-muted">
        {isEdit
          ? 'Sửa thông tin hiển thị cho khách. Trạng thái đổi ở danh sách sự kiện.'
          : 'Sự kiện mới là bản nháp, khách chưa thấy cho tới khi bạn công bố. Nhập thông tin và các loại vé rồi bấm Tạo.'}
      </p>

      {loadError && (
        <p role="alert" className="mt-6 rounded-input bg-danger-subtle px-4 py-3 text-body-sm text-danger">
          {loadError}
        </p>
      )}

      {!loadError && !loaded && (
        <p role="status" className="mt-6 flex items-center gap-2 text-body-sm text-fg-muted">
          <Spinner /> Đang tải sự kiện...
        </p>
      )}

      {loaded && (
      <form onSubmit={handleSubmit} noValidate className={`${card} mt-6`}>
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <PosterField poster={poster} onChange={handlePosterChange} onRemove={handleRemovePoster} />

          <div className="space-y-4">
            <TextField label="Tên sự kiện" required placeholder="VŨ. Live Concert" {...field('name')} />
            <TextField label="Địa điểm" required placeholder="Cung Thể thao Quần Ngựa" {...field('venue')} />
            <TextField label="Địa chỉ" optional placeholder="Văn Cao, Ba Đình, Hà Nội" {...field('address')} />
            <TextField
              label="Link Google Maps"
              optional
              type="url"
              inputMode="url"
              placeholder="https://maps.app.goo.gl/..."
              hint="Trên Google Maps, mở địa điểm rồi bấm Chia sẻ › Sao chép đường liên kết."
              {...field('googleMapsUrl')}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Giờ diễn" required type="datetime-local" hint="Giờ Hà Nội." {...field('startsAt')} />
              <TextField label="Giờ mở bán" required type="datetime-local" hint="Phải trước giờ diễn." {...field('saleOpensAt')} />
            </div>
            <div>
              <label htmlFor="mo-ta-su-kien" className="text-body-sm font-medium text-fg">
                Mô tả <span className="font-normal text-fg-muted">(không bắt buộc)</span>
              </label>
              <textarea
                id="mo-ta-su-kien"
                name="description"
                rows={5}
                value={values.description}
                onChange={handleChange}
                placeholder="Giới thiệu nghệ sĩ, chương trình, lưu ý khi vào cửa..."
                className="mt-1.5 block w-full rounded-input bg-surface px-4 py-3 text-body text-fg ring-1 ring-input-line outline-none placeholder:text-fg-placeholder focus-visible:ring-2 focus-visible:ring-focus"
              />
            </div>
          </div>
        </div>

        {!isEdit && <TicketSection tickets={form.tickets} errors={form.ticketErrors} onAdd={form.addTicket} onUpdate={form.updateTicket} onRemove={form.removeTicket} />}

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <PrimaryButton type="submit" disabled={loading || uploading}>
            {loading && <Spinner />}
            {isEdit ? (loading ? 'Đang lưu...' : 'Lưu thay đổi') : loading ? 'Đang tạo...' : 'Tạo sự kiện'}
          </PrimaryButton>
          <Link to="/dashboard/events" className={smallButton}>
            Huỷ
          </Link>
          {uploading && <p className="text-body-sm text-fg-muted">Chờ ảnh tải xong rồi {isEdit ? 'lưu' : 'tạo'}.</p>}
        </div>

        <AnimatePresence>
          {error.form && (
            <m.p
              role="alert"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 rounded-input bg-danger-subtle px-4 py-3 text-body-sm text-danger"
            >
              {error.form}
            </m.p>
          )}
        </AnimatePresence>
      </form>
      )}
    </div>
  )
}
