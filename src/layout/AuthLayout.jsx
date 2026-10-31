import { Outlet } from 'react-router-dom'
import { LazyMotion, MotionConfig, domAnimation, m } from 'framer-motion'
import { HeaderLogo } from '../components/HeaderLogo'

/**
 * Bố cục cho trang đăng ký, đăng nhập, quên mật khẩu: form bên trái, tranh minh họa sân khấu bên phải.
 * Dưới lg chỉ còn form: trên điện thoại ảnh dọc sẽ đẩy form xuống dưới màn hình đầu tiên.
 */
export default function AuthLayout() {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className="min-h-dvh bg-surface text-fg lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div className="flex min-h-dvh flex-col">
            <header className="px-gutter py-3 sm:px-10">
              <HeaderLogo href={import.meta.env.BASE_URL} label="Admit One, về trang chủ" />
            </header>
            <main className="flex flex-1 items-center px-gutter py-2 sm:px-10">
              <div className="mx-auto w-full max-w-[480px]">
                <Outlet />
              </div>
            </main>
          </div>

          {/* Ảnh tràn hết nửa phải, không khung viền; dính theo màn hình khi form dài hơn chiều cao cửa sổ */}
          <aside className="hidden bg-auth-art lg:block">
            <div className="sticky top-0 h-dvh overflow-hidden">
              {/* Tranh hiện dần khi tải xong, không phóng to thu nhỏ */}
              <m.img
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                src={`${import.meta.env.BASE_URL}banner-auth-form.jpeg`}
                alt="Tranh minh họa ban nhạc biểu diễn trên sân khấu dưới dàn đèn, vé bay quanh"
                width="1728"
                height="2304"
                fetchPriority="high"
                className="size-full object-cover object-[center_70%]"
              />
            </div>
          </aside>
        </div>
      </MotionConfig>
    </LazyMotion>
  )
}
