import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m } from 'framer-motion'
import { GhostButton, PrimaryButton } from '../components/Button'
import { SiteFooter } from '../components/SiteFooter'
import { SiteHeader } from '../components/SiteHeader'
import { Spinner } from '../components/Spinner'
import { TextField } from '../components/TextField'
import { useAuth } from '../context/AuthContext'
import useUpdateProfile from '../hook/useUpdateProfile'
import { ROLE_LABEL, canUseDashboard } from '../lib/roles'

const card = 'rounded-card border border-card-line bg-surface p-card'
const ghostLink =
  'inline-flex min-h-11 items-center justify-center rounded-pill border-[1.5px] border-button-secondary-line px-6 text-body-sm font-semibold text-button-secondary-fg hover:border-fg hover:bg-button-secondary-hover'

/** Trang cá nhân: xem và sửa họ tên, số điện thoại. Admin và Staff có thêm lối vào dashboard. */
export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { values, error, loading, saved, changed, handleChange, handleReset, handleSubmit } = useUpdateProfile()

  useEffect(() => {
    const previous = document.title
    document.title = 'Trang cá nhân · Admit One'
    return () => {
      document.title = previous
    }
  }, [])

  const field = (name) => ({ name, value: values[name], onChange: handleChange, error: error[name] })

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className="flex min-h-screen flex-col bg-canvas text-fg">
          <SiteHeader
            user={user}
            linkBase="/"
            onLogin={() => navigate('/login')}
            onLogout={logout}
            onSearch={(q) => navigate(q ? `/events?q=${encodeURIComponent(q)}` : '/events')}
          />

          <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-gutter py-section-sm">
            <h1 className="font-display text-heading font-bold text-title">Trang cá nhân</h1>

            {/* Tóm tắt tài khoản */}
            <section aria-label="Tài khoản" className={`${card} mt-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between`}>
              <div className="flex items-center gap-4">
                <span aria-hidden="true" className="inline-flex size-16 shrink-0 items-center justify-center rounded-full bg-avatar text-subheading font-bold text-avatar-fg">
                  {user.initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-subheading font-bold text-title">{user.fullName}</p>
                  <p className="truncate text-body-sm text-fg-muted">{user.email}</p>
                  <span className="mt-1.5 inline-flex rounded-badge border border-badge-line bg-badge px-2.5 py-0.5 text-caption font-semibold text-badge-fg">
                    {ROLE_LABEL[user.role] ?? user.role}
                  </span>
                </div>
              </div>
              {canUseDashboard(user) && (
                <Link to="/dashboard" className={ghostLink}>
                  Vào dashboard
                </Link>
              )}
            </section>

            {/* Form sửa thông tin */}
            <section aria-labelledby="sua-thong-tin" className={`${card} mt-6`}>
              <h2 id="sua-thong-tin" className="text-subheading font-bold text-title">
                Thông tin cá nhân
              </h2>
              <p className="mt-1 text-body-sm text-fg-muted">Họ tên in trên vé điện tử. Số điện thoại để liên hệ khi sự kiện thay đổi.</p>

              <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
                <TextField label="Họ và tên" required autoComplete="name" {...field('fullName')} />
                <TextField label="Số điện thoại" optional type="tel" inputMode="tel" autoComplete="tel" placeholder="0912345678" {...field('phone')} />
                <TextField label="Email" type="email" value={user.email} disabled readOnly hint="Email dùng để đăng nhập, hiện chưa đổi được." />

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <PrimaryButton type="submit" disabled={loading || !changed}>
                    {loading && <Spinner />}
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </PrimaryButton>
                  {changed && !loading && (
                    <GhostButton type="button" onClick={handleReset}>
                      Bỏ thay đổi
                    </GhostButton>
                  )}
                  {saved && (
                    <p role="status" className="text-body-sm font-medium text-success">
                      Đã lưu thông tin.
                    </p>
                  )}
                </div>

                <AnimatePresence>
                  {error.form && (
                    <m.p
                      role="alert"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-input bg-danger-subtle px-4 py-3 text-body-sm text-danger"
                    >
                      {error.form}
                    </m.p>
                  )}
                </AnimatePresence>
              </form>
            </section>
          </main>

          <SiteFooter />
        </div>
      </MotionConfig>
    </LazyMotion>
  )
}
