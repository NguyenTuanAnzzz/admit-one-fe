import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminEvents } from '../api/eventApi'
import { createStaff, getStaff, setStaffEvents, updateStaff } from '../api/staffApi'
import { useAuth } from '../context/AuthContext'

const EMPTY = { fullName: '', email: '', phone: '', password: '', confirm: '' }
const FIELD_ORDER = ['fullName', 'email', 'phone', 'password', 'confirm']

/** Cùng luật với RegisterRequest ở backend. Sửa thì không có email và mật khẩu (email là tên đăng nhập, không đổi ở đây). */
function validate(v, isEdit) {
  const e = {}
  if (!v.fullName.trim()) e.fullName = 'Vui lòng nhập họ và tên.'
  else if (v.fullName.trim().length > 100) e.fullName = 'Họ và tên tối đa 100 ký tự.'
  if (v.phone.trim() && !/^\+?[0-9]{9,15}$/.test(v.phone.replace(/\s/g, ''))) e.phone = 'Số điện thoại gồm 9 đến 15 chữ số, ví dụ 0912345678.'
  if (!isEdit) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = 'Email chưa đúng định dạng, ví dụ ten@gmail.com.'
    if (v.password.length < 8) e.password = 'Mật khẩu cần ít nhất 8 ký tự.'
    else if (v.password.length > 72) e.password = 'Mật khẩu tối đa 72 ký tự.'
    if (!v.confirm) e.confirm = 'Vui lòng nhập lại mật khẩu.'
    else if (v.confirm !== v.password) e.confirm = 'Mật khẩu nhập lại chưa khớp.'
  }
  return e
}

function focusFirstError(errors) {
  const first = FIELD_ORDER.find((name) => errors[name])
  if (first) document.querySelector(`input[name="${first}"]`)?.focus()
}

/**
 * Form thêm (staffId rỗng) hoặc sửa (có staffId) nhân viên, cùng kiểu useEventForm.
 * Sự kiện được gán chọn ngay trên form: tạo thì POST rồi PUT /events, sửa thì PUT thông tin rồi PUT /events.
 * Ô tìm sự kiện gọi danh sách sự kiện của admin, bỏ sự kiện đã huỷ (không còn soát vé).
 */
export default function useStaffForm(staffId) {
  const { fetchWithAuth } = useAuth()
  const navigate = useNavigate()
  const isEdit = Boolean(staffId)
  const [values, setValues] = useState(EMPTY)
  const [email, setEmail] = useState('')
  const [assigned, setAssigned] = useState([])
  const [error, setError] = useState({})
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(!isEdit)
  const [loadError, setLoadError] = useState(null)

  // Tìm sự kiện để gán
  const [eventQuery, setEventQuery] = useState('')
  const [eventResults, setEventResults] = useState({ query: null, items: [], error: null })

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    getStaff(fetchWithAuth, staffId)
      .then((s) => {
        if (cancelled) return
        setValues({ ...EMPTY, fullName: s.fullName ?? '', phone: s.phone ?? '' })
        setEmail(s.email)
        setAssigned(s.events ?? [])
        setLoaded(true)
      })
      .catch((err) => !cancelled && setLoadError(err.message))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId])

  // Chỉ gán nhân viên cho sự kiện đã công bố và chưa huỷ (bản nháp có thể bị xoá, chưa có vé để soát).
  // Gõ tìm sự kiện: chờ ngừng gõ 300ms rồi mới gọi backend. Ô trống thì hiện các sự kiện mới tạo gần nhất
  useEffect(() => {
    let cancelled = false
    const id = setTimeout(() => {
      getAdminEvents(fetchWithAuth, { keyword: eventQuery.trim(), size: 8 })
        .then((data) => !cancelled && setEventResults({ query: eventQuery, items: data.items.filter((e) => e.status !== 'CANCELLED' && e.status !== 'DRAFT'), error: null }))
        .catch((err) => !cancelled && setEventResults({ query: eventQuery, items: [], error: err.message }))
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventQuery])

  function handleChange(e) {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
  }

  const isAssigned = (eventId) => assigned.some((e) => e.id === eventId)

  function toggleEvent(event) {
    setAssigned((list) => (list.some((e) => e.id === event.id) ? list.filter((e) => e.id !== event.id) : [...list, event]))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const next = validate(values, isEdit)
    setError(next)
    if (Object.keys(next).length) {
      focusFirstError(next)
      return
    }

    const info = { fullName: values.fullName.trim(), phone: values.phone.replace(/\s/g, '') || null }
    const eventIds = assigned.map((ev) => ev.id)

    setSaving(true)
    try {
      let saved
      if (isEdit) {
        await updateStaff(fetchWithAuth, staffId, info)
        saved = await setStaffEvents(fetchWithAuth, staffId, eventIds)
      } else {
        saved = await createStaff(fetchWithAuth, { ...info, email: values.email.trim().toLowerCase(), password: values.password })
        // Tạo xong mới có id để gán sự kiện. Gán lỗi thì tài khoản vẫn đã tạo, báo để admin gán lại ở trang sửa
        if (eventIds.length) saved = await setStaffEvents(fetchWithAuth, saved.id, eventIds)
      }
      navigate('/dashboard/staff', { state: { saved: saved.fullName } })
    } catch (err) {
      setError({ form: err.message })
      setSaving(false)
    }
  }

  return {
    isEdit,
    values,
    email,
    error,
    saving,
    loaded,
    loadError,
    assigned,
    isAssigned,
    toggleEvent,
    eventQuery,
    setEventQuery,
    eventResults: eventResults.items,
    eventResultsError: eventResults.error,
    eventResultsLoading: eventResults.query !== eventQuery,
    handleChange,
    handleSubmit,
  }
}
