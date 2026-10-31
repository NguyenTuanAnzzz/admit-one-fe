import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, m } from 'framer-motion'
import { GhostButton, PrimaryButton } from '../components/Button'
import { OtpInput } from '../components/OtpInput'
import { Spinner } from '../components/Spinner'
import useCountdown from '../hook/useCountdown'
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

/** 75 giây thành "1:15". */
function formatClock(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

const textLink = 'inline-flex min-h-11 items-center font-semibold text-action-fg underline underline-offset-2 hover:text-fg'

/**
 * Trang nhập OTP sau khi đăng ký. Email và otpExpiresAt (lúc mã hết hạn, do backend trả về) nhận từ useRegister qua location state.
 * Đếm ngược tới otpExpiresAt; hết giờ thì khóa nút gửi vì backend sẽ từ chối mã, và mở nút gửi lại mã.
 * Backend chỉ cho gửi lại khi mã cũ đã hết hạn, nên nút gửi lại cũng khóa trong lúc đếm.
 * Mở thẳng /verify-email (không qua đăng ký) thì không biết xác minh email nào, nên chỉ dẫn về trang đăng ký.
 */
export default function VerifyEmailPage() {
  const { email, otpExpiresAt } = useLocation().state ?? {}
  const { code, error, loading, resending, notice, handleChange, handleSubmit, handleResend } = useVerifyEmail(email)
  const secondsLeft = useCountdown(otpExpiresAt)
  const expired = secondsLeft === 0

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
        Chúng tôi đã gửi mã 6 ký tự (chữ và số) đến <span className="font-semibold break-all">{email}</span>.
      </m.p>

      <m.form variants={fadeUp} onSubmit={handleSubmit} noValidate className="mt-6">
        <div className="flex items-baseline justify-between gap-3">
          <p id="otp-nhan" className="text-body-sm font-medium text-fg">
            Mã xác minh <span aria-hidden="true" className="text-action-fg">*</span>
          </p>
          {/* Không đọc từng giây cho trình đọc màn hình (aria-live off), chỉ báo khi hết hạn ở khung bên dưới */}
          {secondsLeft !== null && !expired && (
            <p
              role="timer"
              aria-live="off"
              className={`text-body-sm font-semibold tabular-nums ${secondsLeft <= 10 ? 'text-danger' : 'text-fg-muted'}`}
            >
              Hết hạn sau {formatClock(secondsLeft)}
            </p>
          )}
        </div>
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

        <PrimaryButton type="submit" disabled={loading || expired} className="mt-5 w-full">
          {loading && <Spinner />}
          {loading ? 'Đang xác minh...' : 'Xác minh email'}
        </PrimaryButton>

        {/* Lỗi backend hoặc mã hết hạn hiện ngay dưới nút gửi, giống trang đăng ký */}
        <AnimatePresence>
          {(error.form || expired) && (
            <m.p
              role="alert"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 rounded-input bg-danger-subtle px-4 py-3 text-body-sm text-danger"
            >
              {error.form || 'Mã đã hết hạn. Bấm "Gửi lại mã" để nhận mã mới.'}
            </m.p>
          )}
          {notice && !error.form && !expired && (
            <m.p
              role="status"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 rounded-input bg-success-subtle px-4 py-3 text-body-sm text-fg"
            >
              {notice}
            </m.p>
          )}
        </AnimatePresence>
      </m.form>

      {/* Mở khi mã đã hết hạn (backend từ chối gửi lại trước đó), hoặc khi không biết hạn mã */}
      <m.div variants={fadeUp} className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p className="text-body-sm text-fg-muted">Chưa nhận được mã?</p>
        <GhostButton type="button" onClick={handleResend} disabled={resending || (secondsLeft !== null && !expired)}>
          {resending && <Spinner />}
          {resending
            ? 'Đang gửi lại...'
            : secondsLeft !== null && !expired
              ? `Gửi lại mã sau ${formatClock(secondsLeft)}`
              : 'Gửi lại mã'}
        </GhostButton>
      </m.div>

      <m.p variants={fadeUp} className="mt-2 text-body-sm text-fg-muted">
        Không thấy email? Hãy xem thư mục Spam hoặc Quảng cáo. Nhập sai email?{' '}
        <Link to="/register" className={textLink}>
          Đăng ký lại
        </Link>
      </m.p>
    </m.div>
  )
}
