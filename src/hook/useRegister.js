import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { register } from '../api/authApi'

const EMPTY = { fullName: '', email: '', phone: '', password: '', confirm: '' }

// Thứ tự trùng thứ tự ô trên form: khi gửi lỗi, con trỏ nhảy về ô sai đầu tiên
const FIELD_ORDER = ['fullName', 'phone', 'email', 'password', 'confirm']

/** Cùng luật với RegisterRequest ở backend, để người dùng thấy lỗi ngay mà không phải chờ máy chủ. */
function validate(v) {
  const e = {}
  if (!v.fullName.trim()) e.fullName = 'Vui lòng nhập họ và tên.'
  else if (v.fullName.trim().length > 100) e.fullName = 'Họ và tên tối đa 100 ký tự.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = 'Email chưa đúng định dạng, ví dụ ten@gmail.com.'
  if (v.phone.trim() && !/^\+?[0-9]{9,15}$/.test(v.phone.replace(/\s/g, ''))) e.phone = 'Số điện thoại gồm 9 đến 15 chữ số, ví dụ 0912345678.'
  if (v.password.length < 8) e.password = 'Mật khẩu cần ít nhất 8 ký tự.'
  else if (v.password.length > 72) e.password = 'Mật khẩu tối đa 72 ký tự.'
  if (!v.confirm) e.confirm = 'Vui lòng nhập lại mật khẩu.'
  else if (v.confirm !== v.password) e.confirm = 'Mật khẩu nhập lại chưa khớp.'
  return e
}

function focusFirstError(errors) {
  const first = FIELD_ORDER.find((name) => errors[name])
  if (first) document.querySelector(`input[name="${first}"]`)?.focus()
}

/**
 * Toàn bộ logic form đăng ký. Mỗi ô cần name trùng một khóa trong EMPTY để handleChange biết cập nhật ô nào.
 * error: lỗi kiểm tra theo từng ô (error.email...), riêng error.form là lỗi backend trả về hoặc mất mạng.
 * Đăng ký xong thì chuyển sang /verify-email, gửi kèm email và lúc mã hết hạn qua location state.
 */
export default function useRegister() {
  const [values, setValues] = useState(EMPTY)
  const [error, setError] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function handleChange(e) {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
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
      const created = await register({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.replace(/\s/g, ''),
        password: values.password,
      })
      // otpExpiresAt: lúc mã hết hạn do backend tính, trang xác minh đếm ngược tới mốc này
      navigate('/verify-email', {
        state: { email: created?.email ?? values.email.trim(), otpExpiresAt: created?.otpExpiresAt },
      })
    } catch (err) {
      // Lỗi từ backend hiện nguyên văn ở khung chung trên nút gửi
      setError({ form: err.message })
    } finally {
      setLoading(false)
    }
  }

  return { values, error, loading, handleChange, handleSubmit }
}
