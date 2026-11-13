import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { getCheckinEvents, getCheckinStats, scanTicket } from '../../api/checkinApi'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components/Spinner'
import { hanoiParts } from '../../lib/format'

const card = 'rounded-card border border-card-line bg-surface p-card'
const input =
  'block min-h-11 w-full rounded-input bg-surface px-3 text-body-sm text-fg ring-1 ring-input-line outline-none placeholder:text-fg-placeholder focus-visible:ring-2 focus-visible:ring-focus'
const smallButton =
  'inline-flex min-h-11 items-center justify-center rounded-pill border-[1.5px] border-button-secondary-line px-4 text-body-sm font-semibold text-button-secondary-fg hover:border-fg hover:bg-button-secondary-hover'

const RESULT_STYLE = {
  OK: { label: 'Vào cửa thành công', className: 'bg-success-subtle text-fg' },
  ALREADY_CHECKED_IN: { label: 'Vé này đã check-in rồi', className: 'bg-status-upcoming text-status-upcoming-fg' },
  VOID: { label: 'Vé đã bị huỷ', className: 'bg-danger-subtle text-danger' },
  WRONG_EVENT: { label: 'Vé không thuộc sự kiện này', className: 'bg-danger-subtle text-danger' },
  NOT_FOUND: { label: 'Không tìm thấy vé - QR không hợp lệ', className: 'bg-danger-subtle text-danger' },
}

function formatDay(iso) {
  const p = hanoiParts(iso)
  return `${p.time} · ${p.day}/${p.month}/${p.year}`
}

// Chọn sự kiện để check-in: tìm theo tên hoặc địa điểm, gõ ngừng 300ms mới gọi backend
function EventPicker({ onPick }) {
  const { fetchWithAuth } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ query: null, items: [], error: null })

  useEffect(() => {
    let cancelled = false
    const id = setTimeout(() => {
      getCheckinEvents(fetchWithAuth, query.trim())
        .then((items) => !cancelled && setResults({ query, items, error: null }))
        .catch((err) => !cancelled && setResults({ query, items: [], error: err.message }))
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const loading = results.query !== query

  return (
    <div className={card}>
      <h2 className="text-subheading font-bold text-title">Chọn sự kiện để check-in</h2>
      <label htmlFor="tim-su-kien-checkin" className="mt-4 block text-caption font-semibold text-fg-muted">
        Tìm theo tên sự kiện hoặc địa điểm
      </label>
      <input id="tim-su-kien-checkin" type="search" className={`${input} mt-1`} placeholder="Tên sự kiện, địa điểm..." value={query} maxLength={100} onChange={(e) => setQuery(e.target.value)} />

      <div aria-live="polite" aria-busy={loading} className="mt-3">
        {results.error && <p className="py-2 text-body-sm text-danger">{results.error}</p>}
        {!results.error && !loading && results.items.length === 0 && <p className="py-2 text-body-sm text-fg-muted">Không có sự kiện nào khớp.</p>}
        <ul className={`divide-y divide-line transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {results.items.map((e) => (
            <li key={e.id}>
              <button type="button" onClick={() => onPick(e)} className="flex min-h-11 w-full items-center justify-between gap-3 py-3 text-left hover:bg-surface-sunken">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-title">{e.name}</span>
                  <span className="block text-caption text-fg-muted">
                    {formatDay(e.startsAt)} · {e.venue}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// Camera quét QR. html5-qrcode tự vẽ UI (chọn camera, khung quét) vào div#qr-reader
function Scanner({ onDecode }) {
  const onDecodeRef = useRef(onDecode)
  onDecodeRef.current = onDecode

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 250 }, false)
    scanner.render(
      (text) => onDecodeRef.current(text),
      () => {}, // lỗi đọc 1 khung hình (không thấy mã), bỏ qua, camera vẫn chạy tiếp
    )
    return () => {
      scanner.clear().catch(() => {})
    }
  }, [])

  return <div id="qr-reader" className="mt-4 overflow-hidden rounded-input" />
}

export default function DashboardCheckin() {
  const { fetchWithAuth } = useAuth()
  const [event, setEvent] = useState(null)
  const [stats, setStats] = useState(null)
  const [lastScan, setLastScan] = useState(null)
  const [scanning, setScanning] = useState(false)
  const cooldownRef = useRef({ code: null, at: 0 })

  useEffect(() => {
    const previous = document.title
    document.title = 'Check-in · Dashboard · Admit One'
    return () => {
      document.title = previous
    }
  }, [])

  function reloadStats(eventId) {
    getCheckinStats(fetchWithAuth, eventId)
      .then(setStats)
      .catch(() => {})
  }

  useEffect(() => {
    if (event) reloadStats(event.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event])

  async function handleDecode(qrSecret) {
    // Camera vẫn tiếp tục gửi cùng 1 mã liên tục lúc nó còn trong khung hình: bỏ qua nếu vừa quét mã này dưới 3 giây
    const now = Date.now()
    if (cooldownRef.current.code === qrSecret && now - cooldownRef.current.at < 3000) return
    cooldownRef.current = { code: qrSecret, at: now }

    setScanning(true)
    try {
      const result = await scanTicket(fetchWithAuth, { eventId: event.id, qrSecret })
      setLastScan(result)
      if (result.result === 'OK') reloadStats(event.id)
    } catch (err) {
      setLastScan({ result: 'NOT_FOUND', ticketCode: null, ticketName: null, customerName: null, error: err.message })
    } finally {
      setScanning(false)
    }
  }

  if (!event) {
    return (
      <div>
        <h1 className="font-display text-heading font-bold text-title">Check-in</h1>
        <p className="mt-2 text-body-sm text-fg-muted">Quét QR vé tại cửa, xem số người đã vào trên tổng số vé.</p>
        <div className="mt-6 max-w-xl">
          <EventPicker onPick={setEvent} />
        </div>
      </div>
    )
  }

  const resultInfo = lastScan ? RESULT_STYLE[lastScan.result] ?? { label: lastScan.result, className: 'bg-surface-sunken text-fg-muted' } : null

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-heading font-bold text-title">{event.name}</h1>
          <p className="mt-1 text-body-sm text-fg-muted">{event.venue}</p>
        </div>
        <button type="button" className={smallButton} onClick={() => setEvent(null)}>
          Đổi sự kiện
        </button>
      </div>

      <div className={`mt-4 ${card}`}>
        <p className="text-body-sm text-fg-muted">Đã vào cửa</p>
        <p className="mt-1 text-heading font-bold text-title">
          {stats ? `${stats.checkedIn} / ${stats.totalIssued}` : <Spinner />}
        </p>
      </div>

      <div className="mt-6 max-w-xl">
        <Scanner onDecode={handleDecode} />
        {scanning && (
          <p role="status" className="mt-3 flex items-center gap-2 text-body-sm text-fg-muted">
            <Spinner /> Đang kiểm tra vé...
          </p>
        )}
        {lastScan && (
          <div role="status" className={`mt-3 rounded-input px-4 py-3 text-body-sm ${resultInfo.className}`}>
            <p className="font-semibold">{resultInfo.label}</p>
            {lastScan.ticketCode && (
              <p className="mt-1">
                {lastScan.ticketCode} · {lastScan.ticketName} · {lastScan.customerName}
              </p>
            )}
            {lastScan.error && <p className="mt-1">{lastScan.error}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
