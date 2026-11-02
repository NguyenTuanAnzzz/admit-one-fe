import { useState } from 'react'
import { updateMe } from '../api/userApi'
import { useAuth } from '../context/AuthContext'

const FIELD_ORDER = ['fullName', 'phone']

/** Cùng luật họ tên, số điện thoại với useRegister, backend (UpdateMeRequest) cũng nên kiểm tra y như vậy. */
function validate(v) {
  const e = {}
  if (!v.fullName.trim()) e.fullName = 'Vui lòng nhập họ và tên.'
  else if (v.fullName.trim().length > 100) e.fullName = 'Họ và tên tối đa 100 ký tự.'
  if (v.phone.trim() && !/^\+?[0-9]{9,15}$/.test(v.phone.replace(/\s/g, ''))) e.phone = 'Số điện thoại gồm 9 đến 15 chữ số, ví dụ 0912345678.'
  return e
}

function focusFirstError(errors) {
  const first = FIELD_ORDER.find((name) => errors[name])
  if (first) document.querySelector(`input[name="${first}"]`)?.focus()
}

/**
 * Logic form sửa hồ sơ, cùng kiểu useLogin. Form điền sẵn từ user hiện tại.
 * Lưu xong: updateUser trong AuthContext thay user cũ bằng dữ liệu backend trả về, header đổi tên ngay.
 * saved: hiện dòng "Đã lưu" tới khi người dùng sửa tiếp.
 */
export default function useUpdateProfile() {
  const { user, fetchWithAuth, updateUser } = useAuth()
  const [values, setValues] = useState(() => ({ fullName: user.fullName ?? '', phone: user.phone ?? '' }))
  const [error, setError] = useState({})
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const changed = values.fullName.trim() !== (user.fullName ?? '') || values.phone.replace(/\s/g, '') !== (user.phone ?? '')

  function handleChange(e) {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
    setSaved(false)
  }

  // Bỏ thay đổi: đưa form về đúng thông tin đang lưu
  function handleReset() {
    setValues({ fullName: user.fullName ?? '', phone: user.phone ?? '' })
    setError({})
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const next = validate(values)
    setError(next)
    if (Object.keys(next).length) {
      focusFirstError(next)
      return
    }

    setLoading(true)
    try {
      const data = await updateMe(fetchWithAuth, {
        fullName: values.fullName.trim(),
        phone: values.phone.replace(/\s/g, ''),
      })
      updateUser(data)
      setValues({ fullName: data.fullName ?? '', phone: data.phone ?? '' })
      setSaved(true)
    } catch (err) {
      setError({ form: err.message })
    } finally {
      setLoading(false)
    }
  }

  return { values, error, loading, saved, changed, handleChange, handleReset, handleSubmit }
}
