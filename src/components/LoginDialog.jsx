import { useEffect, useRef, useState } from 'react'
import { m } from 'framer-motion'
import { Link } from 'react-router-dom'
import { DEMO_USER, login } from '../lib/api'
import { PrimaryButton } from './Button'
import { TextField } from './TextField'

/** Form đăng nhập (C-01). Bản demo chỉ nhận tài khoản DEMO_USER trong lib/api.js. */
export function LoginDialog({ open, onClose, onSuccess }) {
  const ref = useRef(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      setErrors({})
      setStatus('idle')
      dialog.showModal()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  function handleSubmit(e) {
    e.preventDefault()
    const next = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Email chưa đúng định dạng, ví dụ ten@gmail.com.'
    if (password.length < 8) next.password = 'Mật khẩu cần ít nhất 8 ký tự.'
    setErrors(next)
    if (Object.keys(next).length) return

    setStatus('loading')
    login(email)
      .then((user) => {
        setStatus('idle')
        setPassword('')
        onSuccess(user)
      })
      .catch(() => setStatus('error'))
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="dang-nhap-tieu-de"
      className="m-auto w-[calc(100%-32px)] max-w-[420px] rounded-overlay border border-card-line bg-surface p-0 text-fg backdrop:bg-overlay"
    >
      {/* key theo trạng thái mở: mỗi lần mở hộp thoại, form lại bật lên từ 96% */}
      <m.form
        key={open ? 'mo' : 'dong'}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        onSubmit={handleSubmit}
        noValidate
        className="p-6 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="dang-nhap-tieu-de" className="font-display text-heading-sm font-bold text-title">
              Đăng nhập để giữ ghế
            </h2>
            <p className="mt-1 text-body-sm text-fg-muted">Khách chưa đăng nhập vẫn xem được sơ đồ và giá vé.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-fg-muted hover:bg-surface-sunken hover:text-fg"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M5 5l10 10M15 5 5 15" />
            </svg>
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <TextField
            label="Email"
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            placeholder="ten@gmail.com"
          />
          <TextField
            label="Mật khẩu"
            id="mat-khau"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
        </div>

        {status === 'error' && (
          <p role="alert" className="mt-4 rounded-overlay bg-danger-subtle px-4 py-3 text-body-sm text-danger">
            Không tìm thấy tài khoản với email này.
          </p>
        )}

        <PrimaryButton type="submit" disabled={status === 'loading'} className="mt-6 w-full">
          {status === 'loading' ? 'Đang kiểm tra...' : 'Đăng nhập'}
        </PrimaryButton>

        <p className="mt-2 text-center text-body-sm text-fg-muted">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="inline-flex min-h-11 items-center font-semibold text-action-fg underline underline-offset-2 hover:text-fg">
            Đăng ký
          </Link>
        </p>

        <p className="mt-4 rounded-overlay bg-surface-sunken px-4 py-3 text-body-sm text-fg-muted">
          Bản demo: dùng <span className="font-semibold text-fg">{DEMO_USER.email}</span> và mật khẩu bất kỳ từ 8 ký tự.
        </p>
      </m.form>
    </dialog>
  )
}
