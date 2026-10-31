import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { resendOtp, verifyEmail } from '../api/authApi'

const OTP_LENGTH = 6

/**
 * Logic trang nhập OTP. code là mảng 6 ký tự, mỗi phần tử ứng với một ô.
 * error.code: chưa nhập đủ mã. error.form: lỗi backend trả về hoặc mất mạng, hiện dưới nút gửi.
 * Xác minh xong thì về trang chủ và mở sẵn hộp đăng nhập.
 * Gửi lại mã: ghi otpExpiresAt mới vào location state (thay mục lịch sử hiện tại), nên trang đếm lại và F5 vẫn giữ mốc mới.
 */
export default function useVerifyEmail(email) {
  const [code, setCode] = useState(() => Array(OTP_LENGTH).fill(''))
  const [error, setError] = useState({})
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [notice, setNotice] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

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
    setNotice('')
    setLoading(true)
    try {
      await verifyEmail({ email, code: otp })
      navigate('/?login', { replace: true })
    } catch (err) {
      setError({ form: err.message })
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setError({})
    setNotice('')
    setResending(true)
    try {
      const data = await resendOtp({ email })
      setCode(Array(OTP_LENGTH).fill(''))
      setNotice('Đã gửi mã mới. Mã cũ không dùng được nữa.')
      navigate(location.pathname, { replace: true, state: { ...location.state, otpExpiresAt: data?.otpExpiresAt } })
      document.querySelector('[aria-label^="Ký tự"]')?.focus()
    } catch (err) {
      setError({ form: err.message })
    } finally {
      setResending(false)
    }
  }

  return { code, error, loading, resending, notice, handleChange, handleSubmit, handleResend }
}
