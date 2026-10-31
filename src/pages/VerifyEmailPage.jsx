import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { m } from 'framer-motion'
import { GhostButton } from '../components/Button'
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

/**
 * Trang sau khi đăng ký: báo đã gửi mã OTP. Email nhận từ useRegister qua location state.
 * Mở thẳng /verify-email (không qua đăng ký) thì không có email, trang vẫn hiện nhưng không ghi địa chỉ.
 */
export default function VerifyEmailPage() {
  const email = useLocation().state?.email

  useEffect(() => {
    const previous = document.title
    document.title = 'Xác minh email · Admit One'
    return () => {
      document.title = previous
    }
  }, [])

  // TODO: ô nhập mã OTP và gọi API xác minh khi backend có endpoint
  return (
    <m.div role="status" variants={stagger(0.08)} initial="hidden" animate="show">
      <m.div variants={fadeUp}>
        <SuccessMark />
      </m.div>
      <m.h1 variants={fadeUp} className="mt-5 font-display text-heading font-bold text-title">
        Kiểm tra email của bạn
      </m.h1>
      <m.p variants={fadeUp} className="mt-3 text-body text-fg">
        Chúng tôi đã gửi mã xác minh 6 ký tự đến{' '}
        {email ? <span className="font-semibold break-all">{email}</span> : 'email bạn vừa đăng ký'}.
      </m.p>
      <m.p variants={fadeUp} className="mt-4 rounded-input bg-status-upcoming px-4 py-3 text-body-sm text-status-upcoming-fg">
        Mã có hiệu lực trong 15 phút. Không thấy email? Hãy xem thư mục Spam hoặc Quảng cáo.
      </m.p>
      <m.div variants={fadeUp}>
        <GhostButton as="a" href={import.meta.env.BASE_URL} className="mt-6 w-full">
          Về trang chủ
        </GhostButton>
      </m.div>
    </m.div>
  )
}
