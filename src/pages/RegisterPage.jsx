import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, m } from 'framer-motion'
import { GhostButton, PrimaryButton } from '../components/Button'
import { GoogleMark } from '../components/GoogleMark'
import { Spinner } from '../components/Spinner'
import { TextField } from '../components/TextField'
import useRegister from '../hook/useRegister'

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
        <Link to="/login" className={textLink}>
          Đăng nhập
        </Link>
      </p>
    </m.div>
  )
}
