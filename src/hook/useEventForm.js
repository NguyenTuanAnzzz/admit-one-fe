import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createEvent, getAdminEvent, updateEvent, uploadPoster } from '../api/eventApi'
import { useAuth } from '../context/AuthContext'
import { hanoiParts } from '../lib/format'

const EMPTY = { name: '', venue: '', address: '', googleMapsUrl: '', description: '', startsAt: '', saleOpensAt: '' }

const FIELD_ORDER = ['name', 'venue', 'address', 'googleMapsUrl', 'startsAt', 'saleOpensAt']

// Cùng giới hạn với TicketRequest ở backend (tên tối đa 100 ký tự, giá không âm, số lượng lớn hơn 0)
export const MAX_TICKET_TYPES = 10

let ticketCounter = 0
// Khoá tạm cho mỗi loại vé trên form, chỉ dùng làm key của React, không gửi backend
const newTicket = () => ({ key: `ve-${ticketCounter++}`, name: '', description: '', price: '', quantity: '' })

/** Lỗi từng loại vé: { [key]: { name, price, quantity } } */
function validateTickets(tickets) {
  const rows = {}
  tickets.forEach((t) => {
    const e = {}
    if (!t.name.trim()) e.name = 'Nhập tên loại vé.'
    else if (t.name.trim().length > 100) e.name = 'Tối đa 100 ký tự.'
    if (t.price === '') e.price = 'Nhập giá vé.'
    else if (Number(t.price) < 0) e.price = 'Giá vé không được âm.'
    if (t.quantity === '') e.quantity = 'Nhập số lượng.'
    else if (!Number.isInteger(Number(t.quantity)) || Number(t.quantity) <= 0) e.quantity = 'Số lượng là số nguyên lớn hơn 0.'
    if (Object.keys(e).length) rows[t.key] = e
  })
  return rows
}

// Trùng @Pattern của googleMapsUrl trong EventRequest ở backend
const GOOGLE_MAPS_URL = /^https:\/\/(maps\.app\.goo\.gl\/|goo\.gl\/maps\/|(www\.)?google\.com(\.[a-z]{2})?\/maps|maps\.google\.com(\.[a-z]{2})?\/).*$/

// Trùng UploadService ở backend, báo lỗi ngay khi chọn file thay vì chờ máy chủ
const POSTER_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const POSTER_MAX_SIZE = 10 * 1024 * 1024

/** Ô datetime-local cho "2026-12-20T19:30" không kèm múi giờ: coi là giờ Hà Nội (cả trang đều hiện giờ Hà Nội), đổi sang ISO UTC gửi backend. */
const hanoiToIso = (value) => new Date(`${value}:00+07:00`).toISOString()

/** Chiều ngược lại, để điền sẵn form sửa: ISO UTC từ backend → "2026-12-20T19:30" theo giờ Hà Nội */
function isoToHanoiInput(iso) {
  const p = hanoiParts(iso)
  return `${p.year}-${p.month}-${p.day}T${p.time}`
}

/** EventDetailResponse → giá trị các ô của form */
function fromEvent(e) {
  return {
    name: e.name ?? '',
    venue: e.venue ?? '',
    address: e.address ?? '',
    googleMapsUrl: e.googleMapsUrl ?? '',
    description: e.description ?? '',
    startsAt: isoToHanoiInput(e.startsAt),
    saleOpensAt: isoToHanoiInput(e.saleOpensAt),
  }
}

/** Cùng luật với EventRequest ở backend, thêm kiểm tra giờ mở bán trước giờ diễn (backend kiểm tra trong EventService). */
function validate(v) {
  const e = {}
  if (!v.name.trim()) e.name = 'Vui lòng nhập tên sự kiện.'
  else if (v.name.trim().length > 200) e.name = 'Tên sự kiện tối đa 200 ký tự.'
  if (!v.venue.trim()) e.venue = 'Vui lòng nhập địa điểm.'
  else if (v.venue.trim().length > 255) e.venue = 'Địa điểm tối đa 255 ký tự.'
  if (v.address.trim().length > 255) e.address = 'Địa chỉ tối đa 255 ký tự.'
  if (v.googleMapsUrl.trim() && !GOOGLE_MAPS_URL.test(v.googleMapsUrl.trim())) e.googleMapsUrl = 'Dán link chia sẻ từ Google Maps, ví dụ https://maps.app.goo.gl/...'
  if (!v.startsAt) e.startsAt = 'Vui lòng chọn giờ diễn.'
  else if (new Date(hanoiToIso(v.startsAt)) <= new Date()) e.startsAt = 'Giờ diễn phải ở tương lai.'
  if (!v.saleOpensAt) e.saleOpensAt = 'Vui lòng chọn giờ mở bán.'
  else if (v.startsAt && hanoiToIso(v.saleOpensAt) >= hanoiToIso(v.startsAt)) e.saleOpensAt = 'Giờ mở bán phải trước giờ diễn.'
  return e
}

function focusFirstError(errors) {
  const first = FIELD_ORDER.find((name) => errors[name])
  if (first) document.querySelector(`input[name="${first}"]`)?.focus()
}

/**
 * Logic form sự kiện ở dashboard, dùng cho cả tạo (eventId rỗng) và sửa (có eventId), cùng kiểu useRegister.
 * Sửa: tải GET /admin/events/{id} để điền sẵn form và poster, lưu bằng PUT.
 * Tạo: POST /admin/events gửi kèm danh sách loại vé (tickets), backend bắt buộc có ít nhất một loại.
 * Ảnh poster tải lên ngay khi chọn file (POST /admin/uploads/poster), trong lúc admin điền tiếp các ô khác.
 * poster.status: idle (chưa chọn) / uploading / done / error.
 */
export default function useEventForm(eventId) {
  const { fetchWithAuth } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState(EMPTY)
  const [error, setError] = useState({})
  const [loading, setLoading] = useState(false)
  // Loại vé chỉ nhập lúc tạo: backend chưa có API sửa vé
  const [tickets, setTickets] = useState(() => [newTicket()])
  const [ticketErrors, setTicketErrors] = useState({})
  const [poster, setPoster] = useState({ status: 'idle', url: null, previewUrl: null, error: null })
  // Sửa: chờ tải xong sự kiện mới hiện form, để admin không gõ vào form rỗng rồi bị ghi đè
  const [loaded, setLoaded] = useState(!eventId)
  const [loadError, setLoadError] = useState(null)
  // Ảnh xem trước tạo từ file trên máy (blob:), phải thu hồi khi đổi ảnh hoặc rời trang để không rò bộ nhớ
  const previewRef = useRef(null)

  useEffect(() => () => previewRef.current && URL.revokeObjectURL(previewRef.current), [])

  useEffect(() => {
    if (!eventId) return
    let cancelled = false
    getAdminEvent(fetchWithAuth, eventId)
      .then((data) => {
        if (cancelled) return
        setValues(fromEvent(data))
        if (data.posterUrl) setPoster({ status: 'done', url: data.posterUrl, previewUrl: data.posterUrl, error: null })
        setLoaded(true)
      })
      .catch((err) => !cancelled && setLoadError(err.message))
    return () => {
      cancelled = true
    }
    // fetchWithAuth đổi mỗi khi làm mới token, không tải lại sự kiện vì thế
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  // Chỉ giữ và thu hồi link blob: (ảnh trên máy). Link Cloudinary của poster cũ không phải thu hồi
  function setPreview(url) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = url?.startsWith('blob:') ? url : null
  }

  function handleChange(e) {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
  }

  async function handlePosterChange(e) {
    const file = e.target.files?.[0]
    // Xoá giá trị ô chọn file để chọn lại đúng ảnh vừa bỏ vẫn kích hoạt onChange
    e.target.value = ''
    if (!file) return

    if (!POSTER_TYPES.includes(file.type)) {
      setPoster((p) => ({ ...p, error: 'Chỉ nhận ảnh JPG, PNG hoặc WebP.' }))
      return
    }
    if (file.size > POSTER_MAX_SIZE) {
      setPoster((p) => ({ ...p, error: `Ảnh tối đa 10MB, ảnh này ${(file.size / 1024 / 1024).toFixed(1)}MB.` }))
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)
    setPoster({ status: 'uploading', url: null, previewUrl, error: null })

    try {
      const data = await uploadPoster(fetchWithAuth, file)
      setPoster({ status: 'done', url: data.url, previewUrl, error: null })
    } catch (err) {
      setPoster({ status: 'error', url: null, previewUrl, error: err.message })
    }
  }

  function addTicket() {
    setTickets((list) => (list.length >= MAX_TICKET_TYPES ? list : [...list, newTicket()]))
  }

  function updateTicket(key, patch) {
    setTickets((list) => list.map((t) => (t.key === key ? { ...t, ...patch } : t)))
    // Sửa ô nào thì bỏ lỗi của ô đó
    setTicketErrors((errs) => {
      if (!errs[key]) return errs
      const row = { ...errs[key] }
      Object.keys(patch).forEach((field) => delete row[field])
      return { ...errs, [key]: row }
    })
  }

  function removeTicket(key) {
    setTickets((list) => (list.length > 1 ? list.filter((t) => t.key !== key) : list))
  }

  function handleRemovePoster() {
    setPreview(null)
    setPoster({ status: 'idle', url: null, previewUrl: null, error: null })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const next = validate(values)
    const nextTickets = eventId ? {} : validateTickets(tickets)
    setError(next)
    setTicketErrors(nextTickets)
    if (Object.keys(next).length) {
      focusFirstError(next)
      return
    }
    const firstBadTicket = tickets.find((t) => nextTickets[t.key])
    if (firstBadTicket) {
      const field = ['name', 'price', 'quantity'].find((f) => nextTickets[firstBadTicket.key][f])
      document.getElementById(`${firstBadTicket.key}-${field}`)?.focus()
      return
    }

    const payload = {
      name: values.name.trim(),
      venue: values.venue.trim(),
      address: values.address.trim() || null,
      googleMapsUrl: values.googleMapsUrl.trim() || null,
      description: values.description.trim() || null,
      posterUrl: poster.url,
      startsAt: hanoiToIso(values.startsAt),
      saleOpensAt: hanoiToIso(values.saleOpensAt),
    }

    setLoading(true)
    try {
      if (eventId) {
        const data = await updateEvent(fetchWithAuth, eventId, payload)
        // Danh sách đọc state này để báo "Đã lưu ..." ở đầu trang
        navigate('/dashboard/events', { state: { saved: data.name } })
      } else {
        const data = await createEvent(fetchWithAuth, {
          ...payload,
          tickets: tickets.map((t) => ({
            name: t.name.trim(),
            description: t.description.trim() || null,
            price: Number(t.price),
            quantity: Number(t.quantity),
          })),
        })
        // Danh sách đọc state này để báo "Đã tạo ..." ở đầu trang
        navigate('/dashboard/events', { state: { saved: data.name, created: true } })
      }
    } catch (err) {
      setError({ form: err.message })
      setLoading(false)
    }
  }

  return {
    values,
    error,
    loading,
    poster,
    loaded,
    loadError,
    handleChange,
    handlePosterChange,
    handleRemovePoster,
    handleSubmit,
    tickets,
    ticketErrors,
    addTicket,
    updateTicket,
    removeTicket,
  }
}
