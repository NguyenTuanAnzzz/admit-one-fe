import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, m } from 'framer-motion'
import { GhostButton, PrimaryButton } from '../components/Button'
import { GoogleMark } from '../components/GoogleMark'
import { Spinner } from '../components/Spinner'
import { TextField } from '../components/TextField'
import useLogin from '../hook/useLogin'

const textLink = 'inline-flex min-h-11 items-center font-semibold text-action-fg underline underline-offset-2 hover:text-fg'

export default function LoginPage() {
  const { values, error, loading, handleChange, handleSubmit } = useLogin()
  // Xác minh email xong chuyển sang đây kèm verified: báo cho người dùng biết bước trước đã xong
  const verified = useLocation().state?.verified

  useEffect(() => {
    const previous = document.title
    document.title = 'Đăng nhập · Admit One'
    return () => {
      document.title = previous
    }
  }, [])

  const field = (name) => ({ name, value: values[name], onChange: handleChange, error: error[name] })

  return (
    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.3 } }}>
      <h1 className="font-display text-heading font-bold text-title">Đăng nhập</h1>
      <p className="mt-2 text-body-sm text-fg-muted">Đăng nhập để giữ ghế và xem vé đã mua.</p>

      {verified && (
        <p role="status" className="mt-4 rounded-input bg-success-subtle px-4 py-3 text-body-sm text-fg">
          Email đã được xác minh. Nhập mật khẩu để đăng nhập.
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-4">
        <div className="space-y-3">
          <TextField label="Email" required type="email" autoComplete="email" placeholder="ten@gmail.com" {...field('email')} />
          <TextField label="Mật khẩu" required type="password" autoComplete="current-password" placeholder="Mật khẩu của bạn" {...field('password')} />
        </div>

        <PrimaryButton type="submit" disabled={loading} className="mt-5 w-full">
          {loading && <Spinner />}
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
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
      </form>

      <div className="my-3 flex items-center gap-3 text-body-sm text-fg-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        hoặc
        <span className="h-px flex-1 bg-line" />
      </div>

      {/* TODO: bật khi backend có đăng nhập Google (OAuth) */}
      <GhostButton type="button" disabled className="w-full">
        <GoogleMark />
        Tiếp tục với Google
        <span className="font-normal">(sắp có)</span>
      </GhostButton>

      <p className="mt-2 text-center text-body-sm text-fg-muted">
        Chưa có tài khoản?{' '}
        <Link to="/register" className={textLink}>
          Đăng ký
        </Link>
      </p>
    </m.div>
  )
}
