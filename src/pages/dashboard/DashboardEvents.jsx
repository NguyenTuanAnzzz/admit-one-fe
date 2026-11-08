import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { PosterViewer } from '../../components/PosterViewer'
import { publishEvent } from '../../api/eventApi'
import { useAuth } from '../../context/AuthContext'
import { useConfirm } from '../../context/ConfirmContext'
import useAdminEvents from '../../hook/useAdminEvents'
import { EVENT_STATUS, EVENT_STATUS_LABEL, EVENT_STATUS_STYLE } from '../../lib/eventStatus'
import { hanoiParts } from '../../lib/format'
import { pageWindow } from '../../lib/pagination'

const addLink =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-pill border-[1.5px] border-button-primary bg-button-primary px-6 text-body-sm font-semibold text-button-primary-fg hover:border-button-primary-hover hover:bg-button-primary-hover'
const input =
  'block min-h-11 w-full rounded-input bg-surface px-3 text-body-sm text-fg ring-1 ring-input-line outline-none placeholder:text-fg-placeholder focus-visible:ring-2 focus-visible:ring-focus'
const pageButton = (active) =>
  `inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill px-3 text-body-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
    active ? 'bg-chip-active text-chip-active-fg' : 'text-fg hover:bg-surface-sunken'
  }`

const PAGE_SIZE = 10

// Cột của hàng tiêu đề và từng dòng phải giống nhau để thẳng hàng: poster, tên, giờ diễn, mở bán, trạng thái, nút
const ROW_COLUMNS = 'xl:grid-cols-[56px_minmax(0,1fr)_130px_130px_100px_170px]'
const rowPrimary =
  'inline-flex min-h-11 items-center gap-2 rounded-pill border-[1.5px] border-button-primary bg-button-primary px-4 text-body-sm font-semibold text-button-primary-fg hover:border-button-primary-hover hover:bg-button-primary-hover disabled:cursor-not-allowed disabled:opacity-60'

const formatHanoi = (iso) => {
  const p = hanoiParts(iso)
  return `${p.time} · ${p.day}/${p.month}/${p.year}`
}

function EventRow({ event, busy, onPublish }) {
  const canEdit = event.status !== EVENT_STATUS.CANCELLED && (!event.startsAt || new Date(event.startsAt) > new Date())

  return (
    <li className={`grid grid-cols-[56px_minmax(0,1fr)] gap-x-4 gap-y-2 border-t border-line py-4 first:border-t-0 xl:items-center ${ROW_COLUMNS}`}>
      {event.posterUrl ? (
        <PosterViewer src={event.posterUrl} alt={`Poster ${event.name}`} className="row-span-2 aspect-[3/4] w-14 xl:row-span-1" />
      ) : (
        <div aria-hidden="true" className="row-span-2 aspect-[3/4] w-14 rounded-card border border-dashed border-line-strong bg-surface-sunken xl:row-span-1" />
      )}
      <div className="min-w-0">
        {/* Tên dẫn tới trang chi tiết: thông tin, poster, các loại vé và số đã bán */}
        <Link to={event.id} className="block truncate text-body font-semibold text-title underline-offset-2 hover:underline">
          {event.name}
        </Link>
        <p className="truncate text-body-sm text-fg-muted">
          {event.venue}
          {event.address ? ` · ${event.address}` : ''}
        </p>
      </div>
      {/* Dưới xl: giờ và trạng thái xuống dòng dưới tên, có nhãn chữ vì không còn hàng tiêu đề cột */}
      <div className="col-start-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm xl:contents">
        <p className="text-fg">
          <span className="text-fg-muted xl:hidden">Diễn: </span>
          {formatHanoi(event.startsAt)}
        </p>
        <p className="text-fg">
          <span className="text-fg-muted xl:hidden">Mở bán: </span>
          {formatHanoi(event.saleOpensAt)}
        </p>
        <span className={`inline-flex w-fit items-center rounded-badge px-2.5 py-1 text-caption font-semibold ${EVENT_STATUS_STYLE[event.status] ?? ''}`}>
          {EVENT_STATUS_LABEL[event.status] ?? event.status}
        </span>
      </div>
      <div className="col-start-2 flex flex-wrap items-center gap-2 xl:col-start-auto xl:justify-end">
        {canEdit && (
          <Link
            to={`${event.id}/edit`}
            aria-label={`Sửa ${event.name}`}
            className="inline-flex min-h-11 items-center justify-center rounded-pill border-[1.5px] border-button-secondary-line px-3.5 text-body-sm font-semibold text-button-secondary-fg hover:border-fg hover:bg-button-secondary-hover"
          >
            Sửa
          </Link>
        )}
        {/* Chỉ bản nháp mới công bố được. aria-label có tên sự kiện để trình đọc màn hình không nghe "Công bố" lặp lại ở mọi dòng */}
        {event.status === EVENT_STATUS.DRAFT && (
          <button type="button" disabled={busy} onClick={() => onPublish(event)} aria-label={`Công bố ${event.name}`} className={rowPrimary}>
            {busy ? 'Đang công bố...' : 'Công bố'}
          </button>
        )}
      </div>
    </li>
  )
}

/**
 * Dashboard › Sự kiện: danh sách mọi sự kiện (cả bản nháp), tìm, lọc và phân trang ở backend (GET /admin/events).
 * Bộ lọc nằm trên URL (?q=&show=&sale=&page=), F5 hay gửi link vẫn đúng trang đang xem.
 * page trên URL đếm từ 1 cho dễ đọc, gửi backend thì trừ 1.
 */
export default function DashboardEvents() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  const q = searchParams.get('q') ?? ''
  // Một ngày diễn và một ngày mở bán (yyyy-mm-dd), gửi nguyên chuỗi cho eventDate, saleDate
  const show = searchParams.get('show') ?? ''
  const sale = searchParams.get('sale') ?? ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const params = useMemo(() => ({ keyword: q, eventDate: show, saleDate: sale, page: page - 1, size: PAGE_SIZE }), [q, show, sale, page])
  const { data, error, loading, reload } = useAdminEvents(params)
  const { fetchWithAuth } = useAuth()
  const confirm = useConfirm()
  // Sự kiện đang công bố (khoá nút của dòng đó) và thông báo kết quả ở đầu trang
  const [busyId, setBusyId] = useState(null)
  const [notice, setNotice] = useState(null)

  async function handlePublish(event) {
    const ok = await confirm({
      title: `Công bố "${event.name}"?`,
      message: 'Khách sẽ thấy sự kiện này. Tới giờ mở bán hệ thống tự mở bán, sau đó không sửa được loại vé nữa.',
      confirmLabel: 'Công bố',
    })
    if (!ok) return
    setBusyId(event.id)
    setNotice(null)
    try {
      const updated = await publishEvent(fetchWithAuth, event.id)
      setNotice({ type: 'success', text: `Đã công bố ${updated.name}.` })
      // Tải lại trang hiện tại để nhãn trạng thái và nút của dòng đổi theo kết quả backend
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
  const [justCreated] = useState(() => Boolean(location.state?.created))
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

  const hasFilter = Boolean(q || show || sale)
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
          {justCreated ? 'Đã tạo sự kiện ' : 'Đã lưu thay đổi của '}
          <span className="font-semibold">{savedName}</span>
          {justCreated ? ' ở trạng thái bản nháp.' : '.'}
        </p>
      )}

      <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
        <div>
          <label htmlFor="tim-su-kien" className="text-caption font-semibold text-fg-muted">
            Tìm theo tên, địa điểm hoặc địa chỉ
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
        <div aria-hidden="true" className={`hidden gap-x-4 border-b border-line py-3 text-caption font-semibold text-fg-muted xl:grid ${ROW_COLUMNS}`}>
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
            <p className="mt-1 text-body-sm text-fg-muted">Tạo sự kiện đầu tiên kèm các loại vé và giá.</p>
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
              <EventRow key={event.id} event={event} busy={busyId === event.id} onPublish={handlePublish} />
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
