import { useEffect, useState } from 'react'
import { getAdminEvent, updateEventStatus } from '../api/eventApi'
import { getTicketTiers, saveTicketTiers } from '../api/ticketTierApi'
import { useAuth } from '../context/AuthContext'
import { statusActions } from '../lib/eventStatus'

// Cùng giới hạn với backend (TicketTierService). Đổi một bên thì đổi cả bên kia
export const MAX_TIERS = 10
export const MAX_QUANTITY = 100000
export const MAX_PRICE = 100000000

// Màu gợi ý cho hạng vé mới, lần lượt theo thứ tự. Admin đổi được
const TIER_COLORS = ['#F2D38B', '#F5B8E8', '#7C4DFF', '#2F5BEA', '#34D6E0', '#B0206E']

let counter = 0
// Khoá tạm cho dòng mới (chưa có id từ backend), chỉ dùng làm key của React
const newKey = () => `tier-${Date.now().toString(36)}-${(counter++).toString(36)}`

const fromResponse = (t) => ({ key: t.id, name: t.name, price: t.price, quantity: t.quantity, sold: t.sold ?? 0, color: t.color })

/** Cùng luật với backend, báo ngay ở FE trước khi gửi. Trả về { [key]: { field: lỗi } } và lỗi chung */
function validate(tiers) {
  const rows = {}
  if (!tiers.length) return { rows, form: 'Thêm ít nhất một hạng vé.' }
  const names = new Set()
  for (const t of tiers) {
    const e = {}
    const name = t.name.trim()
    if (!name) e.name = 'Nhập tên hạng vé.'
    else if (name.length > 50) e.name = 'Tối đa 50 ký tự.'
    else if (names.has(name.toLowerCase())) e.name = 'Trùng tên với hạng khác.'
    names.add(name.toLowerCase())
    if (t.price === '' || t.price < 0 || t.price > MAX_PRICE) e.price = 'Giá từ 0 đến 100.000.000đ.'
    if (t.quantity === '' || t.quantity < 1 || t.quantity > MAX_QUANTITY) e.quantity = `Từ 1 đến ${MAX_QUANTITY.toLocaleString('vi-VN')} vé.`
    if (Object.keys(e).length) rows[t.key] = e
  }
  return { rows, form: Object.keys(rows).length ? 'Còn ô chưa hợp lệ, xem các dòng tô đỏ.' : null }
}

/**
 * Trang Hạng vé của một sự kiện: tải, thêm, sửa, xoá, đổi thứ tự rồi lưu cả danh sách, và công bố.
 * Chỉ sửa được khi sự kiện còn DRAFT (backend cũng chặn); trạng thái khác thì chỉ xem, kèm số đã bán.
 */
export default function useTicketTiers(eventId) {
  const { fetchWithAuth } = useAuth()
  const [tiers, setTiers] = useState(null)
  const [event, setEvent] = useState(null)
  // Backend đã có hạng vé chưa: chưa lưu lần nào thì không cho công bố (backend cũng chặn)
  const [hasSaved, setHasSaved] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [errors, setErrors] = useState({ rows: {}, form: null })
  const [savedAt, setSavedAt] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getTicketTiers(fetchWithAuth, eventId), getAdminEvent(fetchWithAuth, eventId)])
      .then(([list, detail]) => {
        if (cancelled) return
        setTiers(list.map(fromResponse))
        setHasSaved(list.length > 0)
        setEvent(detail)
        setLoadError(null)
      })
      .catch((err) => !cancelled && setLoadError(err.message))
    return () => {
      cancelled = true
    }
    // fetchWithAuth đổi mỗi khi làm mới token, không cần tải lại vì thế
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, reloadKey])

  // Sửa dở mà đóng tab hoặc F5 thì trình duyệt hỏi lại
  useEffect(() => {
    if (!dirty) return
    const warn = (e) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const readOnly = event !== null && event.status !== 'DRAFT'

  function change(updater) {
    if (readOnly) return
    setTiers((list) => updater(list))
    setDirty(true)
    setErrors({ rows: {}, form: null })
  }

  function addTier() {
    if (tiers.length >= MAX_TIERS) return
    // Màu gợi ý đầu tiên chưa hạng nào dùng, dùng hết thì quay vòng
    const used = new Set(tiers.map((t) => t.color.toUpperCase()))
    const color = TIER_COLORS.find((c) => !used.has(c)) ?? TIER_COLORS[tiers.length % TIER_COLORS.length]
    change((list) => [...list, { key: newKey(), name: '', price: '', quantity: '', sold: 0, color }])
  }

  const updateTier = (key, patch) => change((list) => list.map((t) => (t.key === key ? { ...t, ...patch } : t)))
  const removeTier = (key) => change((list) => list.filter((t) => t.key !== key))

  // Lên (-1) hoặc xuống (+1) một bậc: thứ tự này là thứ tự khách thấy trên trang sự kiện
  function moveTier(key, step) {
    change((list) => {
      const i = list.findIndex((t) => t.key === key)
      const j = i + step
      if (i < 0 || j < 0 || j >= list.length) return list
      const next = [...list]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  async function save() {
    const next = validate(tiers)
    setErrors(next)
    if (next.form) return
    setSaving(true)
    try {
      const body = tiers.map((t) => ({ name: t.name.trim(), price: Number(t.price), quantity: Number(t.quantity), color: t.color }))
      const saved = await saveTicketTiers(fetchWithAuth, eventId, body)
      setTiers(saved.map(fromResponse))
      setHasSaved(saved.length > 0)
      setDirty(false)
      setSavedAt(new Date())
    } catch (err) {
      setErrors({ rows: {}, form: err.message })
    } finally {
      setSaving(false)
    }
  }

  // Nút Công bố: cùng luật với danh sách sự kiện (statusActions). Công bố xong sự kiện rời DRAFT nên trang thành chỉ xem
  const publishAction = event?.status === 'DRAFT' ? statusActions(event).find((a) => a.key === 'publish') : null

  async function publish() {
    if (!publishAction || !window.confirm(publishAction.confirm)) return
    setPublishing(true)
    setErrors({ rows: {}, form: null })
    try {
      setEvent(await updateEventStatus(fetchWithAuth, eventId, publishAction.target))
    } catch (err) {
      setErrors({ rows: {}, form: err.message })
    } finally {
      setPublishing(false)
    }
  }

  const totals = (tiers ?? []).reduce(
    (sum, t) => {
      const q = Number(t.quantity) || 0
      return { quantity: sum.quantity + q, sold: sum.sold + t.sold, revenue: sum.revenue + q * (Number(t.price) || 0) }
    },
    { quantity: 0, sold: 0, revenue: 0 },
  )

  return {
    tiers,
    event,
    loadError,
    reload: () => setReloadKey((k) => k + 1),
    readOnly,
    dirty,
    saving,
    errors,
    savedAt,
    totals,
    addTier,
    updateTier,
    removeTier,
    moveTier,
    save,
    hasSaved,
    publishAction,
    publishing,
    publish,
  }
}
