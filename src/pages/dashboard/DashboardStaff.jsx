import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { getStaffPage } from '../../api/staffApi'
import { useAuth } from '../../context/AuthContext'
import useEventPage from '../../hook/useEventPage'
import { EVENT_STATUS_LABEL } from '../../lib/eventStatus'
import { hanoiParts } from '../../lib/format'
import { pageWindow } from '../../lib/pagination'

const PAGE_SIZE = 10
// Mỗi dòng hiện tối đa ngần này sự kiện được gán, còn lại gộp thành "+N"
const EVENTS_SHOWN = 3

const addLink =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-pill border-[1.5px] border-button-primary bg-button-primary px-6 text-body-sm font-semibold text-button-primary-fg hover:border-button-primary-hover hover:bg-button-primary-hover'
const input =
  'block min-h-11 w-full rounded-input bg-surface px-3 text-body-sm text-fg ring-1 ring-input-line outline-none placeholder:text-fg-placeholder focus-visible:ring-2 focus-visible:ring-focus'
const rowAction =
  'inline-flex min-h-11 items-center rounded-pill border-[1.5px] border-button-secondary-line px-4 text-body-sm font-semibold text-button-secondary-fg hover:border-fg hover:bg-button-secondary-hover'
const pageButton = (active) =>
  `inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill px-3 text-body-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
    active ? 'bg-chip-active text-chip-active-fg' : 'text-fg hover:bg-surface-sunken'
  }`

// Cột của hàng tiêu đề và từng dòng giống nhau để thẳng hàng: avatar, tên và email, điện thoại, sự kiện được gán, nút
const ROW_COLUMNS = 'md:grid-cols-[44px_minmax(0,1.2fr)_130px_minmax(0,1.6fr)_90px]'

// Tên Việt đặt họ trước nên lấy chữ đầu của hai từ cuối, giống avatar trên header
const initialsOf = (name) =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

function StaffRow({ staff }) {
  const shown = staff.events.slice(0, EVENTS_SHOWN)
  const more = staff.events.length - shown.length
  return (
    <li className={`grid grid-cols-[44px_minmax(0,1fr)] gap-x-4 gap-y-2 border-t border-line py-4 first:border-t-0 md:items-center ${ROW_COLUMNS}`}>
      <span aria-hidden="true" className="row-span-2 inline-flex size-11 items-center justify-center rounded-full bg-avatar text-body-sm font-bold text-avatar-fg md:row-span-1">
        {initialsOf(staff.fullName)}
      </span>
      <div className="min-w-0">
        <p className="truncate font-semibold text-title">{staff.fullName}</p>
        <p className="truncate text-body-sm text-fg-muted">{staff.email}</p>
      </div>
      {/* Dưới md: điện thoại, sự kiện và nút xuống dòng dưới tên, có nhãn chữ vì không còn hàng tiêu đề cột */}
      <div className="col-start-2 flex flex-col gap-2 text-body-sm md:contents">
        <p className="text-fg">
          <span className="text-fg-muted md:hidden">Điện thoại: </span>
          {staff.phone || <span className="text-fg-muted">Chưa có</span>}
        </p>
        <div className="min-w-0">
          {staff.events.length === 0 ? (
            <p className="text-fg-muted">Chưa gán sự kiện nào</p>
          ) : (
            <ul aria-label={`Sự kiện của ${staff.fullName}`} className="flex flex-wrap gap-1.5">
              {shown.map((e) => {
                const d = hanoiParts(e.startsAt)
                return (
                  <li key={e.id} title={`${EVENT_STATUS_LABEL[e.status] ?? e.status}, ${d.day}/${d.month}/${d.year}`} className="max-w-full truncate rounded-badge border border-badge-line bg-badge px-2 py-0.5 text-caption font-semibold text-badge-fg">
                    {e.name}
                  </li>
                )
              })}
              {more > 0 && <li className="rounded-badge px-2 py-0.5 text-caption font-semibold text-fg-muted">+{more}</li>}
            </ul>
          )}
        </div>
        <div className="md:flex md:justify-end">
          <Link to={staff.id} aria-label={`Sửa ${staff.fullName}`} className={rowAction}>
            Sửa
          </Link>
        </div>
      </div>
    </li>
  )
}

/**
 * Dashboard › Nhân viên (A-07): danh sách tài khoản Staff, tìm theo tên hoặc email, phân trang ở backend.
 * Bộ lọc trên URL (?q=&page=) như trang Sự kiện, F5 vẫn đúng trang đang xem.
 */
export default function DashboardStaff() {
  const { fetchWithAuth } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  const q = searchParams.get('q') ?? ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const params = useMemo(() => ({ q, page: page - 1, size: PAGE_SIZE }), [q, page])
  const { data, error, loading, reload } = useEventPage((p) => getStaffPage(fetchWithAuth, p), params)

  // Ô tìm gõ tới đâu hiện tới đó, chỉ gọi backend khi ngừng gõ 400ms
  const [qInput, setQInput] = useState(q)
  useEffect(() => {
    if (qInput.trim() === q) return
    const id = setTimeout(() => update({ q: qInput.trim() }), 400)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput])

  function update(patch) {
    const next = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
    if (!('page' in patch)) next.delete('page')
    setSearchParams(next, { replace: !('page' in patch) })
  }

  // Từ trang thêm hoặc sửa quay về kèm tên vừa lưu. Giữ vào state rồi xoá khỏi history để F5 không báo lại
  const [savedName] = useState(() => location.state?.saved ?? null)
  useEffect(() => {
    if (location.state?.saved) navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [location, navigate])

  useEffect(() => {
    const previous = document.title
    document.title = 'Nhân viên · Dashboard · Admit One'
    return () => {
      document.title = previous
    }
  }, [])

  const items = data?.items ?? []
  const firstShown = data && data.totalItems ? data.page * data.size + 1 : 0
  const lastShown = data ? data.page * data.size + items.length : 0

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-heading font-bold text-title">Nhân viên</h1>
          <p className="mt-2 text-body-sm text-fg-muted">Tài khoản soát vé tại cửa. Nhân viên chỉ check-in được sự kiện được gán.</p>
        </div>
        <Link to="new" className={addLink}>
          + Thêm nhân viên
        </Link>
      </div>

      {savedName && (
        <p role="status" className="mt-6 rounded-input bg-success-subtle px-4 py-3 text-body-sm text-fg">
          Đã lưu <span className="font-semibold">{savedName}</span>.
        </p>
      )}

      <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-6 max-w-md">
        <label htmlFor="tim-nhan-vien" className="text-caption font-semibold text-fg-muted">
          Tìm theo tên hoặc email
        </label>
        <input id="tim-nhan-vien" type="search" className={`${input} mt-1`} placeholder="Nguyễn, @gmail.com..." value={qInput} maxLength={100} onChange={(e) => setQInput(e.target.value)} />
      </form>

      <div className="mt-3 flex min-h-11 flex-wrap items-center justify-between gap-2 text-body-sm text-fg-muted">
        <p aria-live="polite">{data ? (data.totalItems ? `Hiển thị ${firstShown}–${lastShown} trên ${data.totalItems} nhân viên` : 'Không có nhân viên nào') : 'Đang tải...'}</p>
        {q && (
          <button
            type="button"
            onClick={() => {
              setQInput('')
              update({ q: '' })
            }}
            className="inline-flex min-h-11 items-center font-semibold text-action-fg underline underline-offset-2 hover:text-fg"
          >
            Xoá tìm kiếm
          </button>
        )}
      </div>

      <section aria-label="Danh sách nhân viên" aria-busy={loading} className={`mt-1 rounded-card border border-card-line bg-surface px-card py-2 transition-opacity ${loading && data ? 'opacity-60' : ''}`}>
        <div aria-hidden="true" className={`hidden gap-x-4 border-b border-line py-3 text-caption font-semibold text-fg-muted md:grid ${ROW_COLUMNS}`}>
          <span />
          <span>Nhân viên</span>
          <span>Điện thoại</span>
          <span>Sự kiện được gán</span>
          <span />
        </div>

        {loading && !data && (
          <ul aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-4 border-t border-line py-4 first:border-t-0">
                <span className="size-11 animate-pulse rounded-full bg-surface-sunken" />
                <span className="h-4 w-1/3 animate-pulse rounded-input bg-surface-sunken" />
              </li>
            ))}
          </ul>
        )}

        {error && (
          <div role="alert" className="py-8 text-center">
            <p className="text-body-sm text-danger">{error}</p>
            <button type="button" onClick={reload} className="mt-3 inline-flex min-h-11 items-center rounded-pill border-[1.5px] border-button-secondary-line px-5 text-body-sm font-semibold text-button-secondary-fg hover:border-fg">
              Thử lại
            </button>
          </div>
        )}

        {!error && data && data.totalItems === 0 && (
          <div className="py-10 text-center">
            <p className="text-body font-semibold text-title">{q ? 'Không có nhân viên nào khớp' : 'Chưa có nhân viên nào'}</p>
            {!q && (
              <>
                <p className="mt-1 text-body-sm text-fg-muted">Tạo tài khoản cho nhân viên soát vé rồi gán sự kiện họ phụ trách.</p>
                <Link to="new" className={`${addLink} mt-4`}>
                  + Thêm nhân viên
                </Link>
              </>
            )}
          </div>
        )}

        {!error && items.length > 0 && (
          <ul>
            {items.map((s) => (
              <StaffRow key={s.id} staff={s} />
            ))}
          </ul>
        )}
      </section>

      {data && data.totalPages > 1 && (
        <nav aria-label="Phân trang" className="mt-4 flex flex-wrap items-center justify-center gap-1">
          <button type="button" className={pageButton(false)} disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>
            ← Trước
          </button>
          {pageWindow(page - 1, data.totalPages).map((p) =>
            typeof p === 'string' ? (
              <span key={p} aria-hidden="true" className="px-1 text-fg-muted">
                …
              </span>
            ) : (
              <button key={p} type="button" aria-label={`Trang ${p + 1}`} aria-current={p === page - 1 ? 'page' : undefined} className={pageButton(p === page - 1)} onClick={() => update({ page: String(p + 1) })}>
                {p + 1}
              </button>
            ),
          )}
          <button type="button" className={pageButton(false)} disabled={page >= data.totalPages} onClick={() => update({ page: String(page + 1) })}>
            Sau →
          </button>
        </nav>
      )}
    </div>
  )
}
