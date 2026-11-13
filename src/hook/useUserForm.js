import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUser, getUser, updateUser } from '../api/userApi'
import { ROLE } from '../lib/roles'
import { useAuth } from '../context/AuthContext'

const EMPTY = { fullName: '', email: '', phone: '', password: '', confirm: '' }
const FIELD_ORDER = ['fullName', 'email', 'phone', 'password', 'confirm']

/** Cùng luật với RegisterRequest ở backend. Sửa thì không có email, mật khẩu và vai trò (không đổi ở đây). */
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
 * Form thêm (userId rỗng) hoặc sửa (có userId) tài khoản Nhân viên soát vé ở Dashboard › Người dùng.
 * Thêm: họ tên, email đăng nhập, điện thoại, mật khẩu ban đầu (role luôn là STAFF). Sửa: họ tên, điện thoại.
 */
export default function useUserForm(userId) {
  const { fetchWithAuth } = useAuth()
  const navigate = useNavigate()
  const isEdit = Boolean(userId)
  const [values, setValues] = useState(EMPTY)
  const [email, setEmail] = useState('')
  const [error, setError] = useState({})
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(!isEdit)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    getUser(fetchWithAuth, userId)
      .then((u) => {
        if (cancelled) return
        setValues({ ...EMPTY, fullName: u.fullName ?? '', phone: u.phone ?? '' })
        setEmail(u.email)
        setLoaded(true)
      })
      .catch((err) => !cancelled && setLoadError(err.message))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  function handleChange(e) {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const next = validate(values, isEdit)
    setError(next)
    if (Object.keys(next).length) {
      focusFirstError(next)
      return
    }

    setSaving(true)
    try {
      let saved
      if (isEdit) {
        saved = await updateUser(fetchWithAuth, userId, {
          fullName: values.fullName.trim(),
          phone: values.phone.replace(/\s/g, '') || null,
        })
      } else {
        saved = await createUser(fetchWithAuth, {
          fullName: values.fullName.trim(),
          phone: values.phone.replace(/\s/g, '') || null,
          email: values.email.trim().toLowerCase(),
          password: values.password,
          role: ROLE.STAFF,
        })
      }
      navigate('/dashboard/users', { state: { saved: saved.fullName } })
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
    handleChange,
    handleSubmit,
  }
}
