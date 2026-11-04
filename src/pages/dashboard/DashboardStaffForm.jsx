import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, m } from 'framer-motion'
import { PrimaryButton } from '../../components/Button'
import { Spinner } from '../../components/Spinner'
import { TextField } from '../../components/TextField'
import useStaffForm from '../../hook/useStaffForm'
import { EVENT_STATUS_LABEL, EVENT_STATUS_STYLE } from '../../lib/eventStatus'
import { hanoiParts } from '../../lib/format'

const card = 'rounded-card border border-card-line bg-surface p-card'
const smallButton =
  'inline-flex min-h-11 items-center justify-center rounded-pill border-[1.5px] border-button-secondary-line px-4 text-body-sm font-semibold text-button-secondary-fg hover:border-fg hover:bg-button-secondary-hover'
const input =
  'block min-h-11 w-full rounded-input bg-surface px-3 text-body-sm text-fg ring-1 ring-input-line outline-none placeholder:text-fg-placeholder focus-visible:ring-2 focus-visible:ring-focus'

const formatDay = (iso) => {
  const p = hanoiParts(iso)
  return `${p.time} · ${p.day}/${p.month}/${p.year}`
}

/**
 * Dashboard › Nhân viên › Thêm (/staff/new) hoặc Sửa (/staff/:id), cùng một form (A-07).
 * Thêm: họ tên, email đăng nhập, điện thoại, mật khẩu ban đầu. Sửa: họ tên, điện thoại (email không đổi).
 * Cả hai đều chọn được sự kiện nhân viên phụ trách soát vé.
 */
export default function DashboardStaffForm() {
  const { id } = useParams()
  const form = useStaffForm(id)
  const { isEdit, values, email, error, saving, loaded, loadError, assigned, isAssigned, toggleEvent, eventQuery, setEventQuery, eventResults, eventResultsError, eventResultsLoading, handleChange, handleSubmit } = form
  const pageTitle = isEdit ? 'Sửa nhân viên' : 'Thêm nhân viên'

  useEffect(() => {
    const previous = document.title
    document.title = `${pageTitle} · Dashboard · Admit One`
    return () => {
      document.title = previous
    }
  }, [pageTitle])

  const field = (name) => ({ name, value: values[name], onChange: handleChange, error: error[name] })

  return (
    <div>
      <Link to="/dashboard/staff" className="inline-flex min-h-11 items-center text-body-sm font-semibold text-fg-muted hover:text-title">
        ← Danh sách nhân viên
      </Link>
      <h1 className="mt-1 font-display text-heading font-bold text-title">{pageTitle}</h1>
      <p className="mt-2 text-body-sm text-fg-muted">
        {isEdit ? 'Sửa thông tin và sự kiện nhân viên phụ trách.' : 'Tài khoản dùng được ngay, không cần xác minh email. Gửi email và mật khẩu ban đầu cho nhân viên.'}
      </p>

      {loadError && (
        <p role="alert" className="mt-6 rounded-input bg-danger-subtle px-4 py-3 text-body-sm text-danger">
          {loadError}
        </p>
      )}

      {!loadError && !loaded && (
        <p role="status" className="mt-6 flex items-center gap-2 text-body-sm text-fg-muted">
          <Spinner /> Đang tải nhân viên...
        </p>
      )}

      {loaded && (
        <form onSubmit={handleSubmit} noValidate className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
          <section aria-labelledby="thong-tin-tai-khoan" className={card}>
            <h2 id="thong-tin-tai-khoan" className="text-subheading font-bold text-title">
              Thông tin tài khoản
            </h2>
            <div className="mt-4 space-y-4">
              <TextField label="Họ và tên" required autoComplete="off" placeholder="Nguyễn Văn An" {...field('fullName')} />
              {isEdit ? (
                <TextField label="Email đăng nhập" type="email" value={email} disabled readOnly hint="Email là tên đăng nhập, không đổi ở đây." />
              ) : (
                <TextField label="Email đăng nhập" required type="email" autoComplete="off" placeholder="nhanvien@gmail.com" {...field('email')} />
              )}
              <TextField label="Số điện thoại" optional type="tel" inputMode="tel" autoComplete="off" placeholder="0912345678" {...field('phone')} />
              {!isEdit && (
                <>
                  {/* new-password: trình duyệt không tự điền mật khẩu của admin vào tài khoản nhân viên */}
                  <TextField label="Mật khẩu ban đầu" required type="password" autoComplete="new-password" hint="Ít nhất 8 ký tự." {...field('password')} />
                  <TextField label="Nhập lại mật khẩu" required type="password" autoComplete="new-password" {...field('confirm')} />
                </>
              )}
            </div>
          </section>

          <section aria-labelledby="su-kien-duoc-gan" className={card}>
            <h2 id="su-kien-duoc-gan" className="text-subheading font-bold text-title">
              Sự kiện được gán
            </h2>
            <p className="mt-1 text-body-sm text-fg-muted">Nhân viên chỉ quét vé được ở các sự kiện này.</p>

            {assigned.length === 0 ? (
              <p className="mt-4 rounded-input bg-surface-sunken px-4 py-3 text-body-sm text-fg-muted">Chưa gán sự kiện nào.</p>
            ) : (
              <ul aria-label="Đã gán" className="mt-4 flex flex-wrap gap-2">
                {assigned.map((e) => (
                  <li key={e.id} className="inline-flex max-w-full items-center gap-1 rounded-pill border border-chip-active-line bg-chip-active py-1 pr-1 pl-3 text-body-sm font-semibold text-chip-active-fg">
                    <span className="truncate">{e.name}</span>
                    <button type="button" onClick={() => toggleEvent(e)} aria-label={`Bỏ gán ${e.name}`} className="inline-flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-overlay/20">
                      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M4 4l8 8M12 4l-8 8" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <label htmlFor="tim-su-kien-gan" className="mt-5 block text-caption font-semibold text-fg-muted">
              Tìm sự kiện để gán
            </label>
            <input id="tim-su-kien-gan" type="search" className={`${input} mt-1`} placeholder="Tên sự kiện hoặc địa điểm" value={eventQuery} maxLength={100} onChange={(e) => setEventQuery(e.target.value)} />

            <div aria-live="polite" aria-busy={eventResultsLoading} className="mt-2">
              {eventResultsError && <p className="py-2 text-body-sm text-danger">{eventResultsError}</p>}
              {!eventResultsError && !eventResultsLoading && eventResults.length === 0 && <p className="py-2 text-body-sm text-fg-muted">Không có sự kiện nào khớp.</p>}
              <ul className={`divide-y divide-line transition-opacity ${eventResultsLoading ? 'opacity-60' : ''}`}>
                {eventResults.map((e) => (
                  <li key={e.id}>
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 py-2">
                      <input type="checkbox" checked={isAssigned(e.id)} onChange={() => toggleEvent(e)} className="size-4 shrink-0 accent-action" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body-sm font-semibold text-title">{e.name}</span>
                        <span className="block text-caption text-fg-muted">
                          {formatDay(e.startsAt)} · {e.venue}
                        </span>
                      </span>
                      <span className={`shrink-0 rounded-badge px-2 py-0.5 text-caption font-semibold ${EVENT_STATUS_STYLE[e.status] ?? ''}`}>{EVENT_STATUS_LABEL[e.status] ?? e.status}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-3">
              <PrimaryButton type="submit" disabled={saving}>
                {saving && <Spinner />}
                {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo nhân viên'}
              </PrimaryButton>
              <Link to="/dashboard/staff" className={smallButton}>
                Huỷ
              </Link>
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
          </div>
        </form>
      )}
    </div>
  )
}
