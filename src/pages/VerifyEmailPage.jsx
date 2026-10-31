import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, m } from 'framer-motion'
import { PrimaryButton } from '../components/Button'
import { OtpInput } from '../components/OtpInput'
import { Spinner } from '../components/Spinner'
import useVerifyEmail from '../hook/useVerifyEmail'
import { EASE_OUT, fadeUp, stagger } from '../lib/motion'

/** Dấu tích tự vẽ khi đăng ký xong: vòng tròn bật lên rồi nét tích chạy, báo "đã xong" trước khi đọc chữ. */
function SuccessMark() {
  return (
    <m.svg
      aria-hidden="true"
      viewBox="0 0 56 56"
      className="size-14"
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 18 }}
    >
      <circle cx="28" cy="28" r="28" className="fill-success-subtle" />
      <m.path
        d="M18 29l7 7 13-15"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-success"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.25, duration: 0.45, ease: EASE_OUT }}
      />
    </m.svg>
  )
}

const textLink = 'inline-flex min-h-11 items-center font-semibold text-action-fg underline underline-offset-2 hover:text-fg'

/**
 * Trang nhập OTP sau khi đăng ký. Email nhận từ useRegister qua location state.
 * Mở thẳng /verify-email (không qua đăng ký) thì không biết xác minh email nào, nên chỉ dẫn về trang đăng ký.
 */
export default function VerifyEmailPage() {
  const email = useLocation().state?.email
  const { code, error, loading, handleChange, handleSubmit } = useVerifyEmail(email)

  useEffect(() => {
    const previous = document.title
    document.title = 'Xác minh email · Admit One'
    return () => {
      document.title = previous
    }
  }, [])

  if (!email) {
    return (
      <m.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.3 } }}>
        <h1 className="font-display text-heading font-bold text-title">Chưa rõ email cần xác minh</h1>
        <p className="mt-3 text-body text-fg">
          Trang này mở sau khi đăng ký, để nhập mã gửi tới email của bạn. Hãy đăng ký trước, mã sẽ được gửi ngay sau đó.
        </p>
        <Link to="/register" className={`${textLink} mt-2`}>
          Đến trang đăng ký
        </Link>
      </m.div>
    )
  }

  return (
    <m.div variants={stagger(0.08)} initial="hidden" animate="show">
      <m.div variants={fadeUp}>
        <SuccessMark />
      </m.div>
      <m.h1 variants={fadeUp} className="mt-5 font-display text-heading font-bold text-title">
        Nhập mã xác minh
      </m.h1>
      <m.p variants={fadeUp} className="mt-3 text-body text-fg">
        Chúng tôi đã gửi mã 6 ký tự (chữ và số) đến <span className="font-semibold break-all">{email}</span>. Mã có
        hiệu lực trong 15 phút.
      </m.p>

      <m.form variants={fadeUp} onSubmit={handleSubmit} noValidate className="mt-6">
        <p id="otp-nhan" className="text-body-sm font-medium text-fg">
          Mã xác minh <span aria-hidden="true" className="text-action-fg">*</span>
        </p>
        <OtpInput
          value={code}
          onChange={handleChange}
          error={error.code}
          labelId="otp-nhan"
          describedBy={error.code ? 'otp-loi' : 'otp-goi-y'}
        />
        <AnimatePresence initial={false} mode="wait">
          {error.code ? (
            <m.p
              key="loi"
              id="otp-loi"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="mt-1.5 text-body-sm text-danger"
            >
              {error.code}
            </m.p>
          ) : (
            <p key="goi-y" id="otp-goi-y" className="mt-1.5 text-body-sm text-fg-muted">
              Có thể dán cả mã bằng Ctrl+V. Chữ thường tự đổi thành chữ hoa.
            </p>
          )}
        </AnimatePresence>

        <PrimaryButton type="submit" disabled={loading} className="mt-5 w-full">
          {loading && <Spinner />}
          {loading ? 'Đang xác minh...' : 'Xác minh email'}
        </PrimaryButton>

        {/* Lỗi backend hiện ngay dưới nút gửi, giống trang đăng ký */}
        <AnimatePresence>
          {error.form && (
            <m.p
              role="alert"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 rounded-input bg-danger-subtle px-4 py-3 text-body-sm text-danger"
            >
              {error.form}
            </m.p>
          )}
        </AnimatePresence>
      </m.form>

      <m.p variants={fadeUp} className="mt-4 text-body-sm text-fg-muted">
        Không thấy email? Hãy xem thư mục Spam hoặc Quảng cáo. Nhập sai email?{' '}
        <Link to="/register" className={textLink}>
          Đăng ký lại
        </Link>
      </m.p>
    </m.div>
  )
}
