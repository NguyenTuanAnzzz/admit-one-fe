import { useEffect, useMemo, useState } from 'react'
import { getAdminEvent, updateEventStatus, uploadPoster } from '../api/eventApi'
import { getSeatMap, getZoneSeats, saveSeatMap } from '../api/seatMapApi'
import { useAuth } from '../context/AuthContext'
import { statusActions } from '../lib/eventStatus'
import { MAX_ROWS, MAX_SEATS_PER_EVENT, MAX_SEATS_PER_ROW, bounds, rectShape, seatKey, zoneShape } from '../lib/seatLayout'

const DEFAULT_WIDTH = 1200
const DEFAULT_HEIGHT = 800

// Màu gợi ý cho hạng vé mới, lấy theo sơ đồ CTicket mẫu. Admin đổi được
const TIER_COLORS = ['#F5B8E8', '#7C4DFF', '#F2D38B', '#2F5BEA', '#34D6E0', '#B0206E']

// Kích thước mặc định khi thêm vật thể
const OBJECT_DEFAULTS = {
  STAGE: { label: 'STAGE', width: 220, height: 70 },
  SCREEN: { label: 'LIVE LED', width: 120, height: 18 },
  FOH: { label: 'FOH', width: 90, height: 40 },
  CLOSED_AREA: { label: '', width: 120, height: 80 },
  LABEL: { label: 'Ghi chú', width: 120, height: 30 },
}

let counter = 0
// Khoá tạm cho hạng vé, khu, vật thể mới (chưa có id từ backend)
const newKey = (prefix) => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`

const clampInt = (value, min, max) => (value === '' ? '' : Math.min(max, Math.max(min, Math.round(Number(value)) || min)))

/** SeatMapResponse của backend → state của trình dựng. id thật dùng làm key luôn */
function fromResponse(data) {
  return {
    mapWidth: data.mapWidth ?? DEFAULT_WIDTH,
    mapHeight: data.mapHeight ?? DEFAULT_HEIGHT,
    mapBackgroundUrl: data.mapBackgroundUrl ?? '',
    tiers: data.tiers.map((t) => ({ key: t.id, name: t.name, price: t.price, color: t.color, areaGroup: t.areaGroup ?? '' })),
    zones: data.zones.map((z) => ({
      key: z.id,
      tierKey: z.tierId,
      label: z.label,
      x: z.x,
      y: z.y,
      rotation: z.rotation,
      seatingMode: z.seatingMode,
      rowCount: z.rowCount,
      seatsPerRow: z.seatsPerRow,
      seatLayout: z.seatLayout,
    })),
    objects: data.objects.map((o) => {
      const b = bounds(o.shape)
      return { key: o.id, type: o.type, label: o.label ?? '', x: o.x, y: o.y, rotation: o.rotation, width: b.width, height: b.height }
    }),
    // zoneKey → ["B-7", ...]. Điền sau khi tải ghế của các khu có ghế khoá
    blocked: {},
  }
}

/** State của trình dựng → SeatMapRequest. Hình khu tính lại từ số hàng, số ghế, kiểu xếp */
function toRequest(map) {
  return {
    mapWidth: map.mapWidth,
    mapHeight: map.mapHeight,
    mapBackgroundUrl: map.mapBackgroundUrl || null,
    tiers: map.tiers.map((t) => ({ key: t.key, name: t.name.trim(), price: Number(t.price), color: t.color, areaGroup: t.areaGroup.trim() || null })),
    zones: map.zones.map((z) => ({
      tierKey: z.tierKey,
      label: z.label.trim(),
      shape: zoneShape(z),
      x: z.x,
      y: z.y,
      rotation: z.rotation,
      seatingMode: z.seatingMode,
      rowCount: z.rowCount,
      seatsPerRow: z.seatsPerRow,
      seatLayout: z.seatLayout,
    })),
    objects: map.objects.map((o) => ({ type: o.type, label: o.label.trim() || null, shape: rectShape(o.width, o.height), x: o.x, y: o.y, rotation: o.rotation })),
    // Ghế khoá chỉ ra bằng vị trí khu trong mảng zones gửi lên
    blockedSeats: map.zones.flatMap((z, zoneIndex) =>
      (map.blocked[z.key] ?? []).map((key) => {
        const [rowLabel, seatNumber] = key.split('-')
        return { zoneIndex, rowLabel, seatNumber: Number(seatNumber) }
      }),
    ),
  }
}

/** Cùng luật với SeatMapService.save, báo ngay ở FE trước khi gửi */
function validate(map) {
  if (!map.tiers.length) return 'Thêm ít nhất một hạng vé.'
  if (!map.zones.length) return 'Thêm ít nhất một khu.'
  for (const t of map.tiers) {
    if (!t.name.trim()) return 'Có hạng vé chưa đặt tên.'
    if (t.price === '' || Number(t.price) < 0) return `Hạng vé "${t.name}" chưa có giá hợp lệ.`
  }
  const tierKeys = new Set(map.tiers.map((t) => t.key))
  let total = 0
  for (const z of map.zones) {
    if (!z.label.trim()) return 'Có khu chưa đặt tên.'
    if (!tierKeys.has(z.tierKey)) return `Khu "${z.label}" chưa chọn hạng vé.`
    if (z.rowCount === '' || z.seatsPerRow === '') return `Khu "${z.label}" chưa có số hàng hoặc số ghế.`
    total += z.rowCount * z.seatsPerRow
  }
  if (total > MAX_SEATS_PER_EVENT) return `Sơ đồ tối đa ${MAX_SEATS_PER_EVENT.toLocaleString('vi-VN')} ghế, hiện có ${total.toLocaleString('vi-VN')}.`
  return null
}

/**
 * Toàn bộ trạng thái trình dựng sơ đồ ghế của một sự kiện: tải, sửa, khoá ghế, lưu.
 * Chỉ sửa được khi sự kiện còn DRAFT (backend cũng chặn); trạng thái khác thì readOnly.
 * Sau khi lưu giữ nguyên state đang sửa (đã khớp với thứ vừa gửi), chỉ xoá cờ dirty.
 */
export default function useSeatMapEditor(eventId) {
  const { fetchWithAuth } = useAuth()
  const [map, setMap] = useState(null)
  const [eventStatus, setEventStatus] = useState(null)
  // Thông tin sự kiện (tên, giờ mở bán) để hiện tiêu đề và biết công bố thì sang Sắp mở bán hay Đang bán
  const [event, setEvent] = useState(null)
  // Backend đã có sơ đồ chưa: chưa lưu lần nào thì không cho công bố (backend cũng chặn)
  const [hasSavedMap, setHasSavedMap] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [savedAt, setSavedAt] = useState(null)
  const [uploadingBg, setUploadingBg] = useState(false)
  const [selected, setSelected] = useState(null)
  const [mode, setMode] = useState('move')

  useEffect(() => {
    let cancelled = false
    Promise.all([getSeatMap(fetchWithAuth, eventId), getAdminEvent(fetchWithAuth, eventId)])
      .then(async ([data, detail]) => {
        const next = fromResponse(data)
        // Ghế khoá không có trong SeatMapResponse: tải ghế của những khu có ghế khoá để biết là ghế nào
        const withBlocked = data.zones.filter((z) => z.blockedSeats > 0)
        const lists = await Promise.all(withBlocked.map((z) => getZoneSeats(fetchWithAuth, eventId, z.id)))
        withBlocked.forEach((z, i) => {
          next.blocked[z.id] = lists[i].filter((s) => s.status === 'BLOCKED').map((s) => seatKey(s.rowLabel, s.seatNumber))
        })
        if (cancelled) return
        setMap(next)
        setEventStatus(data.eventStatus)
        setEvent(detail)
        setHasSavedMap(data.totalSeats > 0)
        setLoadError(null)
      })
      .catch((err) => !cancelled && setLoadError(err.message))
    return () => {
      cancelled = true
    }
    // fetchWithAuth đổi mỗi khi làm mới token, không cần tải lại sơ đồ vì thế
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, reloadKey])

  // Sửa dở mà đóng tab hoặc F5 thì trình duyệt hỏi lại
  useEffect(() => {
    if (!dirty) return
    const warn = (e) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const readOnly = eventStatus !== null && eventStatus !== 'DRAFT'

  function change(updater) {
    if (readOnly) return
    setMap((m) => updater(m))
    setDirty(true)
    setSaveError(null)
  }

  const setMapField = (name, value) => change((m) => ({ ...m, [name]: value }))

  async function uploadBackground(file) {
    if (!file) return
    // Cùng luật với UploadService. Phải chặn ở đây: file quá lớn thì Tomcat cắt kết nối giữa chừng (ERR_CONNECTION_RESET),
    // trình duyệt không nhận được câu báo lỗi nào từ backend
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setSaveError('Ảnh nền chỉ nhận JPG, PNG hoặc WebP.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setSaveError(`Ảnh nền tối đa 10MB, ảnh này ${(file.size / 1024 / 1024).toFixed(1)}MB.`)
      return
    }
    setUploadingBg(true)
    setSaveError(null)
    try {
      const data = await uploadPoster(fetchWithAuth, file)
      setMapField('mapBackgroundUrl', data.url)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setUploadingBg(false)
    }
  }

  function addTier() {
    change((m) => ({
      ...m,
      tiers: [...m.tiers, { key: newKey('tier'), name: `Hạng ${m.tiers.length + 1}`, price: 500000, color: TIER_COLORS[m.tiers.length % TIER_COLORS.length], areaGroup: '' }],
    }))
  }

  const updateTier = (key, patch) => change((m) => ({ ...m, tiers: m.tiers.map((t) => (t.key === key ? { ...t, ...patch } : t)) }))

  // Hạng vé đang có khu dùng thì không xoá, trả về lý do để trang hiện ra
  function removeTier(key) {
    if (map.zones.some((z) => z.tierKey === key)) return 'Hạng vé đang có khu dùng. Đổi hạng vé của các khu đó trước.'
    change((m) => ({ ...m, tiers: m.tiers.filter((t) => t.key !== key) }))
    return null
  }

  function addZone() {
    if (!map.tiers.length) return
    const key = newKey('zone')
    change((m) => ({
      ...m,
      zones: [
        ...m.zones,
        {
          key,
          tierKey: m.tiers[0].key,
          label: `Khu ${m.zones.length + 1}`,
          // Đặt gần giữa khung, lệch dần để khu mới không chồng khít khu cũ
          x: Math.round(m.mapWidth / 2 - 120 + (m.zones.length % 5) * 20),
          y: Math.round(m.mapHeight / 2 - 60 + (m.zones.length % 5) * 20),
          rotation: 0,
          seatingMode: 'RESERVED',
          rowCount: 5,
          seatsPerRow: 10,
          seatLayout: 'GRID',
        },
      ],
    }))
    setSelected({ kind: 'zone', key })
  }

  function updateZone(key, patch) {
    const next = { ...patch }
    if ('rowCount' in next) next.rowCount = clampInt(next.rowCount, 1, MAX_ROWS)
    if ('seatsPerRow' in next) next.seatsPerRow = clampInt(next.seatsPerRow, 1, MAX_SEATS_PER_ROW)
    change((m) => {
      const zones = m.zones.map((z) => (z.key === key ? { ...z, ...next } : z))
      // Bớt hàng hoặc bớt ghế: bỏ những ghế khoá không còn tồn tại, giống luật kiểm tra ở backend
      const zone = zones.find((z) => z.key === key)
      const blocked = { ...m.blocked }
      if (blocked[key] && zone.rowCount !== '' && zone.seatsPerRow !== '') {
        blocked[key] = blocked[key].filter((k) => {
          const [row, num] = k.split('-')
          return Number(num) <= zone.seatsPerRow && rowIndexOf(row) < zone.rowCount
        })
      }
      return { ...m, zones, blocked }
    })
  }

  function removeZone(key) {
    change((m) => {
      const blocked = { ...m.blocked }
      delete blocked[key]
      return { ...m, zones: m.zones.filter((z) => z.key !== key), blocked }
    })
    setSelected(null)
  }

  function addObject(type) {
    const key = newKey('obj')
    const d = OBJECT_DEFAULTS[type]
    change((m) => ({
      ...m,
      objects: [...m.objects, { key, type, label: d.label, x: Math.round(m.mapWidth / 2 - d.width / 2), y: 40, rotation: 0, width: d.width, height: d.height }],
    }))
    setSelected({ kind: 'object', key })
  }

  const updateObject = (key, patch) => change((m) => ({ ...m, objects: m.objects.map((o) => (o.key === key ? { ...o, ...patch } : o)) }))

  function removeObject(key) {
    change((m) => ({ ...m, objects: m.objects.filter((o) => o.key !== key) }))
    setSelected(null)
  }

  function toggleSeat(zoneKey, key) {
    change((m) => {
      const current = m.blocked[zoneKey] ?? []
      const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key]
      return { ...m, blocked: { ...m.blocked, [zoneKey]: next } }
    })
  }

  async function save() {
    const problem = validate(map)
    if (problem) {
      setSaveError(problem)
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const data = await saveSeatMap(fetchWithAuth, eventId, toRequest(map))
      setEventStatus(data.eventStatus)
      setHasSavedMap(data.totalSeats > 0)
      setDirty(false)
      setSavedAt(new Date())
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Nút Công bố: cùng luật với danh sách sự kiện (statusActions). Công bố xong sự kiện rời DRAFT nên trang thành chỉ xem
  const publishAction = event && eventStatus === 'DRAFT' ? statusActions({ ...event, status: eventStatus }).find((a) => a.key === 'publish') : null

  async function publish() {
    if (!publishAction || !window.confirm(publishAction.confirm)) return
    setPublishing(true)
    setSaveError(null)
    try {
      const updated = await updateEventStatus(fetchWithAuth, eventId, publishAction.target)
      setEvent(updated)
      setEventStatus(updated.status)
      setMode('move')
      setSelected(null)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setPublishing(false)
    }
  }

  // Tổng số ghế theo hạng vé và cả sơ đồ, tính từ số hàng x số ghế (khớp với số backend sinh)
  const summary = useMemo(() => {
    if (!map) return null
    const byTier = {}
    let total = 0
    let blockedCount = 0
    for (const z of map.zones) {
      const n = (Number(z.rowCount) || 0) * (Number(z.seatsPerRow) || 0)
      byTier[z.tierKey] = (byTier[z.tierKey] ?? 0) + n
      total += n
      blockedCount += map.blocked[z.key]?.length ?? 0
    }
    return { byTier, total, blocked: blockedCount, sellable: total - blockedCount }
  }, [map])

  return {
    map,
    eventStatus,
    loadError,
    reload: () => setReloadKey((k) => k + 1),
    readOnly,
    dirty,
    saving,
    saveError,
    savedAt,
    uploadingBg,
    selected,
    setSelected,
    mode,
    setMode,
    summary,
    setMapField,
    uploadBackground,
    addTier,
    updateTier,
    removeTier,
    addZone,
    updateZone,
    removeZone,
    addObject,
    updateObject,
    removeObject,
    toggleSeat,
    save,
    event,
    hasSavedMap,
    publishAction,
    publishing,
    publish,
  }
}

// "A" → 0, "Z" → 25, "AA" → 26: ngược lại với rowLabel
function rowIndexOf(label) {
  let n = 0
  for (const ch of label) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}
