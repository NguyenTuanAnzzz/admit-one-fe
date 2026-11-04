import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { PosterViewer } from '../../components/PosterViewer'
import { updateEventStatus } from '../../api/eventApi'
import { useAuth } from '../../context/AuthContext'
import useAdminEvents from '../../hook/useAdminEvents'
import { EVENT_STATUS, EVENT_STATUS_LABEL, EVENT_STATUS_STYLE, statusActions } from '../../lib/eventStatus'
import { hanoiParts } from '../../lib/format'
import { pageWindow } from '../../lib/pagination'

const addLink =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-pill border-[1.5px] border-button-primary bg-button-primary px-6 text-body-sm font-semibold text-button-primary-fg hover:border-button-primary-hover hover:bg-button-primary-hover'
const chip = (active) =>
  `inline-flex min-h-11 items-center gap-1.5 rounded-pill border px-4 text-body-sm font-semibold ${
    active ? 'border-chip-active-line bg-chip-active text-chip-active-fg' : 'border-line text-fg-muted hover:border-line-strong hover:text-title'
  }`
const input =
  'block min-h-11 w-full rounded-input bg-surface px-3 text-body-sm text-fg ring-1 ring-input-line outline-none placeholder:text-fg-placeholder focus-visible:ring-2 focus-visible:ring-focus'
const pageButton = (active) =>
  `inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill px-3 text-body-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
    active ? 'bg-chip-active text-chip-active-fg' : 'text-fg hover:bg-surface-sunken'
  }`

const FILTERS = ['ALL', ...Object.values(EVENT_STATUS)]
const PAGE_SIZE = 10

// Trùng danh sách SORTS trong EventService ở backend
const SORT_OPTIONS = [
  ['startsAt', 'Giờ diễn gần nhất'],
  ['-startsAt', 'Giờ diễn xa nhất'],
  ['-createdAt', 'Mới tạo gần đây'],
  ['name', 'Tên A → Z'],
]

// Cột của hàng tiêu đề và từng dòng phải giống nhau để thẳng hàng: poster, tên, giờ diễn, mở bán, trạng thái, nút
// Cột nút cuối co theo số nút (2 tới 4 nút tuỳ trạng thái), tối đa 260px rồi xuống dòng
const ROW_COLUMNS = 'md:grid-cols-[56px_minmax(0,1fr)_130px_130px_110px_minmax(180px,260px)]'
const rowBase = 'inline-flex min-h-11 items-center rounded-pill border-[1.5px] px-4 text-body-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50'
const rowAction = `${rowBase} border-button-secondary-line text-button-secondary-fg hover:border-fg hover:bg-button-secondary-hover`
const rowPrimary = `${rowBase} border-button-primary bg-button-primary text-button-primary-fg hover:border-button-primary-hover hover:bg-button-primary-hover`
const rowDanger = `${rowBase} border-transparent text-danger hover:bg-danger-subtle`

const formatHanoi = (iso) => {
  const p = hanoiParts(iso)
  return `${p.time} · ${p.day}/${p.month}/${p.year}`
}

// Ngày "2026-12-01" tính theo giờ Hà Nội, từ đầu ngày tới hết ngày, đổi sang ISO UTC gửi backend
const dayStartIso = (day) => (day ? new Date(`${day}T00:00:00+07:00`).toISOString() : '')
const dayEndIso = (day) => (day ? new Date(`${day}T23:59:59+07:00`).toISOString() : '')

function EventRow({ event, busy, onAction }) {
  return (
    <li className={`grid grid-cols-[56px_minmax(0,1fr)] gap-x-4 gap-y-2 border-t border-line py-4 first:border-t-0 md:items-center ${ROW_COLUMNS}`}>
      {event.posterUrl ? (
        <PosterViewer src={event.posterUrl} alt={`Poster ${event.name}`} className="row-span-2 aspect-[3/4] w-14 md:row-span-1" />
      ) : (
        <div aria-hidden="true" className="row-span-2 aspect-[3/4] w-14 rounded-card border border-dashed border-line-strong bg-surface-sunken md:row-span-1" />
      )}
      <div className="min-w-0">
        {/* Tên sự kiện dẫn tới trang sơ đồ ghế, gửi kèm tên để trang đó hiện tiêu đề mà không phải gọi thêm API */}
        <Link to={`${event.id}/seatmap`} state={{ eventName: event.name }} className="block truncate text-body font-semibold text-title underline-offset-2 hover:underline">
          {event.name}
        </Link>
        <p className="truncate text-body-sm text-fg-muted">{event.venue}</p>
      </div>
      {/* Dưới md: giờ và trạng thái xuống dòng dưới tên, có nhãn chữ vì không còn hàng tiêu đề cột */}
      <div className="col-start-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm md:contents">
        <p className="text-fg md:col-start-auto">
          <span className="text-fg-muted md:hidden">Diễn: </span>
          {formatHanoi(event.startsAt)}
        </p>
        <p className="text-fg">
          <span className="text-fg-muted md:hidden">Mở bán: </span>
          {formatHanoi(event.saleOpensAt)}
        </p>
        <span className={`inline-flex w-fit items-center rounded-badge px-2.5 py-1 text-caption font-semibold ${EVENT_STATUS_STYLE[event.status] ?? ''}`}>
          {EVENT_STATUS_LABEL[event.status] ?? event.status}
        </span>
      </div>
      <div className="col-start-2 flex flex-wrap gap-2 md:col-start-auto md:justify-end">
        {/* aria-label có tên sự kiện: trình đọc màn hình nghe "Sửa VŨ. Live Concert" thay vì chỉ "Sửa" lặp lại ở mọi dòng */}
        <Link to={`${event.id}/edit`} aria-label={`Sửa ${event.name}`} className={rowAction}>
          Sửa
        </Link>
        <Link to={`${event.id}/seatmap`} state={{ eventName: event.name }} aria-label={`Sơ đồ ghế của ${event.name}`} className={rowAction}>
          Sơ đồ ghế
        </Link>
        {/* Nút đổi trạng thái theo trạng thái hiện tại: Công bố, Mở bán ngay, Mở bán lại, Huỷ sự kiện */}
        {statusActions(event).map((action) => (
          <button
            key={action.key}
            type="button"
            disabled={busy}
            onClick={() => onAction(event, action)}
            aria-label={`${action.label} ${event.name}`}
            className={action.tone === 'primary' ? rowPrimary : action.tone === 'danger' ? rowDanger : rowAction}
          >
            {busy && action.tone === 'primary' ? 'Đang đổi...' : action.label}
          </button>
        ))}
      </div>
    </li>
  )
}

/**
 * Dashboard › Sự kiện: danh sách mọi sự kiện (cả bản nháp), lọc và phân trang ở backend.
 * Bộ lọc nằm trên URL (?status=&q=&show=&sale=&sort=&page=), F5 hay gửi link vẫn đúng trang đang xem.
 * page trên URL đếm từ 1 cho dễ đọc, gửi backend thì trừ 1.
 */
export default function DashboardEvents() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  const status = searchParams.get('status') ?? ''
  const q = searchParams.get('q') ?? ''
  // Một ngày diễn và một ngày mở bán (yyyy-mm-dd), gửi backend thành khoảng từ đầu tới cuối ngày đó
  const show = searchParams.get('show') ?? ''
  const sale = searchParams.get('sale') ?? ''
  const sort = searchParams.get('sort') ?? 'startsAt'
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const params = useMemo(
    () => ({
      status,
      q,
      startsFrom: dayStartIso(show),
      startsTo: dayEndIso(show),
      saleFrom: dayStartIso(sale),
      saleTo: dayEndIso(sale),
      sort,
      page: page - 1,
      size: PAGE_SIZE,
    }),
    [status, q, show, sale, sort, page],
  )
  const { data, error, loading, reload } = useAdminEvents(params)
  const { fetchWithAuth } = useAuth()
  // Sự kiện đang đổi trạng thái (khoá nút của dòng đó) và thông báo kết quả ở đầu trang
  const [busyId, setBusyId] = useState(null)
  const [notice, setNotice] = useState(null)

  async function handleStatusAction(event, action) {
    if (!window.confirm(action.confirm)) return
    setBusyId(event.id)
    setNotice(null)
    try {
      const updated = await updateEventStatus(fetchWithAuth, event.id, action.target)
      setNotice({ type: 'success', text: `${event.name}: ${EVENT_STATUS_LABEL[updated.status] ?? updated.status}.` })
      // Tải lại trang hiện tại để nhãn trạng thái, số đếm trên nút lọc và nút của dòng đổi theo
      reload()
    } catch (err) {
      setNotice({ type: 'error', text: err.message })
    } finally {
      setBusyId(null)
    }
  }

  // Ô tìm kiếm gõ tới đâu hiện tới đó, nhưng chỉ gọi backend khi ngừng gõ 400ms
  const [qInput, setQInput] = useState(q)
  useEffect(() => {
    if (qInput.trim() === q) return
    const id = setTimeout(() => update({ q: qInput.trim() }), 400)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput])

  // Đổi một bộ lọc: ghi lên URL, bỏ tham số rỗng, quay về trang 1 (trừ khi chính là đổi trang)
  function update(patch) {
    const next = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
    if (!('page' in patch)) next.delete('page')
    setSearchParams(next, { replace: !('page' in patch) })
  }

  function clearFilters() {
    setQInput('')
    setSearchParams({}, { replace: true })
  }

  // Từ trang sửa quay về kèm tên sự kiện vừa lưu. Giữ vào state rồi xoá khỏi history để F5 không báo lại
  const [savedName] = useState(() => location.state?.saved ?? null)
  useEffect(() => {
    if (location.state?.saved) navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [location, navigate])

  useEffect(() => {
    const previous = document.title
    document.title = 'Sự kiện · Dashboard · Admit One'
    return () => {
      document.title = previous
    }
  }, [])

  const hasFilter = Boolean(status || q || show || sale)
  const counts = data?.statusCounts ?? {}
  const totalAll = Object.values(counts).reduce((sum, n) => sum + n, 0)
  const items = data?.items ?? []
  const firstShown = data && data.totalItems ? data.page * data.size + 1 : 0
  const lastShown = data ? data.page * data.size + items.length : 0

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-heading font-bold text-title">Sự kiện</h1>
          <p className="mt-2 text-body-sm text-fg-muted">Mọi sự kiện, kể cả bản nháp khách chưa thấy.</p>
        </div>
        <Link to="new" className={addLink}>
          + Thêm sự kiện
        </Link>
      </div>

      {notice && (
        <p
          role={notice.type === 'error' ? 'alert' : 'status'}
          className={`mt-6 rounded-input px-4 py-3 text-body-sm ${notice.type === 'error' ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-fg'}`}
        >
          {notice.text}
        </p>
      )}

      {savedName && (
        <p role="status" className="mt-6 rounded-input bg-success-subtle px-4 py-3 text-body-sm text-fg">
          Đã lưu thay đổi của <span className="font-semibold">{savedName}</span>.
        </p>
      )}

      <div role="group" aria-label="Lọc theo trạng thái" className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((s) => {
          const value = s === 'ALL' ? '' : s
          const active = status === value
          return (
            <button key={s} type="button" aria-pressed={active} onClick={() => update({ status: value })} className={chip(active)}>
              {s === 'ALL' ? 'Tất cả' : EVENT_STATUS_LABEL[s]}
              <span className="font-normal">{s === 'ALL' ? totalAll : (counts[s] ?? 0)}</span>
            </button>
          )
        })}
      </div>

      <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_170px_170px_200px]">
        <div>
          <label htmlFor="tim-su-kien" className="text-caption font-semibold text-fg-muted">
            Tìm theo tên hoặc địa điểm
          </label>
          <input id="tim-su-kien" type="search" className={`${input} mt-1`} placeholder="VŨ, Quần Ngựa..." value={qInput} maxLength={100} onChange={(e) => setQInput(e.target.value)} />
        </div>
        {/* Hai mốc của sự kiện: giờ diễn (startsAt) và giờ mở bán (saleOpensAt). Chọn một ngày thì ra sự kiện có mốc đó trong ngày */}
        <div>
          <label htmlFor="loc-ngay-dien" className="text-caption font-semibold text-fg-muted">
            Ngày diễn
          </label>
          <input id="loc-ngay-dien" type="date" className={`${input} mt-1`} value={show} onChange={(e) => update({ show: e.target.value })} />
        </div>
        <div>
          <label htmlFor="loc-ngay-mo-ban" className="text-caption font-semibold text-fg-muted">
            Ngày mở bán
          </label>
          <input id="loc-ngay-mo-ban" type="date" className={`${input} mt-1`} value={sale} onChange={(e) => update({ sale: e.target.value })} />
        </div>
        <div>
          <label htmlFor="sap-xep" className="text-caption font-semibold text-fg-muted">
            Sắp xếp
          </label>
          <select id="sap-xep" className={`${input} mt-1`} value={sort} onChange={(e) => update({ sort: e.target.value === 'startsAt' ? '' : e.target.value })}>
            {SORT_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </form>

      <div className="mt-3 flex min-h-11 flex-wrap items-center justify-between gap-2 text-body-sm text-fg-muted">
        <p aria-live="polite">{data ? (data.totalItems ? `Hiển thị ${firstShown}–${lastShown} trên ${data.totalItems} sự kiện` : 'Không có sự kiện nào') : 'Đang tải...'}</p>
        {hasFilter && (
          <button type="button" onClick={clearFilters} className="inline-flex min-h-11 items-center font-semibold text-action-fg underline underline-offset-2 hover:text-fg">
            Xoá bộ lọc
          </button>
        )}
      </div>

      {/* Đang tải trang mới vẫn giữ danh sách cũ, chỉ làm mờ đi, để không nháy trắng khi bấm lọc hay sang trang */}
      <section aria-label="Danh sách sự kiện" aria-busy={loading} className={`mt-1 rounded-card border border-card-line bg-surface px-card py-2 transition-opacity ${loading && data ? 'opacity-60' : ''}`}>
        <div aria-hidden="true" className={`hidden gap-x-4 border-b border-line py-3 text-caption font-semibold text-fg-muted md:grid ${ROW_COLUMNS}`}>
          <span />
          <span>Sự kiện</span>
          <span>Giờ diễn</span>
          <span>Mở bán</span>
          <span>Trạng thái</span>
          <span />
        </div>

        {loading && !data && (
          <ul aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-4 border-t border-line py-4 first:border-t-0">
                <span className="aspect-[3/4] w-14 animate-pulse rounded-card bg-surface-sunken" />
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

        {!error && data && data.totalItems === 0 && !hasFilter && (
          <div className="py-10 text-center">
            <p className="text-body font-semibold text-title">Chưa có sự kiện nào</p>
            <p className="mt-1 text-body-sm text-fg-muted">Tạo sự kiện đầu tiên, thêm khu và giá vé rồi công bố cho khách.</p>
            <Link to="new" className={`${addLink} mt-4`}>
              + Thêm sự kiện
            </Link>
          </div>
        )}

        {!error && data && data.totalItems === 0 && hasFilter && (
          <div className="py-8 text-center">
            <p className="text-body-sm text-fg-muted">Không có sự kiện nào khớp bộ lọc.</p>
            <button type="button" onClick={clearFilters} className="mt-2 inline-flex min-h-11 items-center font-semibold text-action-fg underline underline-offset-2 hover:text-fg">
              Xoá bộ lọc
            </button>
          </div>
        )}

        {!error && items.length > 0 && (
          <ul>
            {items.map((event) => (
              <EventRow key={event.id} event={event} busy={busyId === event.id} onAction={handleStatusAction} />
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
