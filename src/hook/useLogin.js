import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login } from '../api/authApi'
import { useAuth } from '../context/AuthContext'

const FIELD_ORDER = ['email', 'password']

function validate(v) {
  const e = {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = 'Email chưa đúng định dạng, ví dụ ten@gmail.com.'
  if (!v.password) e.password = 'Vui lòng nhập mật khẩu.'
  return e
}

function focusFirstError(errors) {
  const first = FIELD_ORDER.find((name) => errors[name])
  if (first) document.querySelector(`input[name="${first}"]`)?.focus()
}

/**
 * Logic form đăng nhập, cùng kiểu useRegister. error.form: lỗi backend trả về hoặc mất mạng, hiện dưới nút gửi.
 * Email điền sẵn nếu trang trước gửi qua location state (xác minh email xong chuyển sang đây).
 */
export default function useLogin() {
  const location = useLocation()
  const [values, setValues] = useState(() => ({ email: location.state?.email ?? '', password: '', rememberMe: false }))
  const [error, setError] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setAccessToken } = useAuth()

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setValues((v) => ({ ...v, [name]: type === 'checkbox' ? checked : value }))
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
      const data = await login({ email: values.email.trim(), password: values.password, rememberMe: values.rememberMe })
      setAccessToken(data.accessToken)
      // Bị ProtectRoute đẩy sang đây thì quay về trang đang mở dở, không thì về trang chủ
      navigate(location.state?.from ?? '/', { replace: true })
    } catch (err) {
      setError({ form: err.message })
    } finally {
      setLoading(false)
    }
  }

  return { values, error, loading, handleChange, handleSubmit }
}
