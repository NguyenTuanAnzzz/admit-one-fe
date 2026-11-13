import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, m } from 'framer-motion'
import { PrimaryButton } from '../../components/Button'
import { Spinner } from '../../components/Spinner'
import { TextField } from '../../components/TextField'
import useUserForm from '../../hook/useUserForm'

const card = 'rounded-card border border-card-line bg-surface p-card'
const smallButton =
  'inline-flex min-h-11 items-center justify-center rounded-pill border-[1.5px] border-button-secondary-line px-4 text-body-sm font-semibold text-button-secondary-fg hover:border-fg hover:bg-button-secondary-hover'

/**
 * Dashboard › Người dùng › Thêm (/users/new) hoặc Sửa (/users/:id), cùng một form.
 * Trang này chỉ tạo tài khoản Nhân viên soát vé (role STAFF cố định) - tạo Admin không làm ở đây.
 * Thêm: họ tên, email đăng nhập, điện thoại, mật khẩu ban đầu. Sửa: họ tên, điện thoại (email không đổi).
 */
export default function DashboardUserForm() {
  const { id } = useParams()
  const form = useUserForm(id)
  const { isEdit, values, email, error, saving, loaded, loadError, handleChange, handleSubmit } = form
  const pageTitle = isEdit ? 'Sửa người dùng' : 'Thêm người dùng'

  useEffect(() => {
    const previous = document.title
    document.title = `${pageTitle} · Dashboard · Admit One`
    return () => {
      document.title = previous
    }
  }, [pageTitle])

  const field = (name) => ({ name, value: values[name], onChange: handleChange, error: error[name] })

  return (
    <div>
      <Link to="/dashboard/users" className="inline-flex min-h-11 items-center text-body-sm font-semibold text-fg-muted hover:text-title">
        ← Danh sách người dùng
      </Link>
      <h1 className="mt-1 font-display text-heading font-bold text-title">{pageTitle}</h1>
      <p className="mt-2 text-body-sm text-fg-muted">
        {isEdit ? 'Sửa thông tin tài khoản.' : 'Tạo tài khoản nhân viên soát vé, dùng được ngay, không cần xác minh email. Gửi email và mật khẩu ban đầu cho nhân viên.'}
      </p>

      {loadError && (
        <p role="alert" className="mt-6 rounded-input bg-danger-subtle px-4 py-3 text-body-sm text-danger">
          {loadError}
        </p>
      )}

      {!loadError && !loaded && (
        <p role="status" className="mt-6 flex items-center gap-2 text-body-sm text-fg-muted">
          <Spinner /> Đang tải người dùng...
        </p>
      )}

      {loaded && (
        <form onSubmit={handleSubmit} noValidate className="mt-6 max-w-xl">
          <section aria-labelledby="thong-tin-tai-khoan" className={card}>
            <h2 id="thong-tin-tai-khoan" className="text-subheading font-bold text-title">
              Thông tin tài khoản
            </h2>
            <div className="mt-4 space-y-4">
              <TextField label="Họ và tên" required autoComplete="off" placeholder="Nguyễn Văn An" {...field('fullName')} />
              {isEdit ? (
                <TextField label="Email đăng nhập" type="email" value={email} disabled readOnly hint="Email là tên đăng nhập, không đổi ở đây." />
              ) : (
                <TextField label="Email đăng nhập" required type="email" autoComplete="off" placeholder="nguoidung@gmail.com" {...field('email')} />
              )}
              <TextField label="Số điện thoại" optional type="tel" inputMode="tel" autoComplete="off" placeholder="0912345678" {...field('phone')} />
              {!isEdit && (
                <>
                  <TextField label="Vai trò" value="Nhân viên soát vé" disabled readOnly hint="Trang này chỉ tạo tài khoản Nhân viên soát vé." />
                  {/* new-password: trình duyệt không tự điền mật khẩu của admin vào tài khoản người khác */}
                  <TextField label="Mật khẩu ban đầu" required type="password" autoComplete="new-password" hint="Ít nhất 8 ký tự." {...field('password')} />
                  <TextField label="Nhập lại mật khẩu" required type="password" autoComplete="new-password" {...field('confirm')} />
                </>
              )}
            </div>
          </section>

          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-3">
              <PrimaryButton type="submit" disabled={saving}>
                {saving && <Spinner />}
                {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo tài khoản'}
              </PrimaryButton>
              <Link to="/dashboard/users" className={smallButton}>
                Huỷ
              </Link>
            </div>
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
          </div>
        </form>
      )}
    </div>
  )
}
