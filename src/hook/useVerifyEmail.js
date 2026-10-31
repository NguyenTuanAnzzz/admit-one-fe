import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { verifyEmail } from '../api/authApi'

const OTP_LENGTH = 6

/**
 * Logic trang nhập OTP. code là mảng 6 ký tự, mỗi phần tử ứng với một ô.
 * error.code: chưa nhập đủ mã. error.form: lỗi backend trả về hoặc mất mạng, hiện dưới nút gửi.
 * Xác minh xong thì về trang chủ và mở sẵn hộp đăng nhập.
 */
export default function useVerifyEmail(email) {
  const [code, setCode] = useState(() => Array(OTP_LENGTH).fill(''))
  const [error, setError] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function handleChange(next) {
    setCode(next)
    if (error.code && next.every(Boolean)) setError({})
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const otp = code.join('')
    if (otp.length < OTP_LENGTH) {
      setError({ code: `Nhập đủ ${OTP_LENGTH} ký tự của mã.` })
      document.querySelectorAll('[aria-label^="Ký tự"]')[otp.length]?.focus()
      return
    }

    setError({})
    setLoading(true)
    try {
      await verifyEmail({ email, code: otp })
      navigate('/?dang-nhap', { replace: true })
    } catch (err) {
      setError({ form: err.message })
    } finally {
      setLoading(false)
    }
  }

  return { code, error, loading, handleChange, handleSubmit }
}
