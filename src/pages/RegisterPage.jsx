import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, m } from 'framer-motion'
import { GhostButton, PrimaryButton } from '../components/Button'
import { Spinner } from '../components/Spinner'
import { TextField } from '../components/TextField'
import useRegister from '../hook/useRegister'

/** Chữ G bốn màu theo hướng dẫn thương hiệu của Google cho nút đăng nhập. */
function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5 shrink-0">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  )
}

const textLink = 'inline-flex min-h-11 items-center font-semibold text-action-fg underline underline-offset-2 hover:text-fg'

export default function RegisterPage() {
  const { values, error, loading, handleChange, handleSubmit } = useRegister()

  useEffect(() => {
    // Trả lại tiêu đề cũ khi rời trang, vì chuyển trang bằng router không tải lại index.html
    const previous = document.title
    document.title = 'Đăng ký · Admit One'
    return () => {
      document.title = previous
    }
  }, [])

  // Mỗi ô: name để handleChange biết cập nhật khóa nào, value và lỗi lấy theo đúng khóa đó
  const field = (name) => ({ name, value: values[name], onChange: handleChange, error: error[name] })

  return (
    // Mở trang: cả form hiện dần một lần, không trượt từng ô
    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.3 } }}>
      <h1 className="font-display text-heading font-bold text-title">Tạo tài khoản</h1>
      <p className="mt-2 text-body-sm text-fg-muted">
        Đăng ký để giữ ghế và nhận vé QR qua email. Ô có dấu <span className="text-action-fg">*</span> là bắt buộc.
      </p>

      {/* Hai ô một hàng từ sm trở lên để cả form vừa một màn hình, không phải cuộn */}
      <form onSubmit={handleSubmit} noValidate className="mt-4">
        <div className="grid gap-x-3 gap-y-3 sm:grid-cols-2">
          <TextField label="Họ và tên" required autoComplete="name" placeholder="Nguyễn Văn An" {...field('fullName')} />
          <TextField label="Số điện thoại" type="tel" inputMode="tel" autoComplete="tel" placeholder="Không bắt buộc" {...field('phone')} />
          <TextField
            label="Email"
            required
            type="email"
            autoComplete="email"
            placeholder="ten@gmail.com"
            className="sm:col-span-2"
            {...field('email')}
          />
          <TextField label="Mật khẩu" required type="password" autoComplete="new-password" placeholder="Ít nhất 8 ký tự" {...field('password')} />
          <TextField label="Nhập lại mật khẩu" required type="password" autoComplete="new-password" placeholder="Nhập lại mật khẩu" {...field('confirm')} />
        </div>

        <PrimaryButton type="submit" disabled={loading} className="mt-5 w-full">
          {loading && <Spinner />}
          {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
        </PrimaryButton>

        {/* Lỗi backend luôn hiện ngay dưới nút gửi: chỗ mắt đang nhìn sau khi bấm */}
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

      {/* TODO: bật khi backend có đăng nhập Google (OAuth). Hiện để tắt và ghi rõ "sắp có" thay vì một nút bấm không làm gì. */}
      <GhostButton type="button" disabled className="w-full">
        <GoogleMark />
        Tiếp tục với Google
        <span className="font-normal">(sắp có)</span>
      </GhostButton>

      <p className="mt-2 text-center text-body-sm text-fg-muted">
        Đã có tài khoản?{' '}
        <Link to="/?login" className={textLink}>
          Đăng nhập
        </Link>
      </p>
    </m.div>
  )
}
