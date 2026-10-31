import { useState } from 'react'
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion'
import { SiteHeader } from '../components/SiteHeader'
import { Hero } from '../components/Hero'
import { EventList } from '../components/EventList'
import { ZoneMap } from '../components/ZoneMap'
import { BuyingFlow } from '../components/BuyingFlow'
import { Faq } from '../components/Faq'
import { SiteFooter } from '../components/SiteFooter'
import { LoginDialog } from '../components/LoginDialog'

export default function HomePage() {
  const [user, setUser] = useState(null)
  // ?dang-nhap: trang đăng ký dẫn về đây để mở sẵn hộp đăng nhập
  const [loginOpen, setLoginOpen] = useState(() => new URLSearchParams(window.location.search).has('dang-nhap'))

  const [query, setQuery] = useState('')

  const openLogin = () => setLoginOpen(true)

  const search = (q) => {
    setQuery(q)
    document.getElementById('su-kien')?.scrollIntoView({ block: 'start' })
  }

  return (
    // LazyMotion + domAnimation: chỉ nạp phần animation trang cần, nhẹ hơn cả thư viện.
    // reducedMotion="user": máy bật giảm chuyển động thì bỏ dịch, xoay, phóng; vẫn giữ hiện dần và đổi màu.
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div id="top" className="min-h-screen bg-canvas text-fg">
          <a href="#noi-dung" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-pill focus:bg-title focus:px-4 focus:py-2 focus:text-fg-inverse">
            Bỏ qua tới nội dung
          </a>
          <SiteHeader user={user} onLogin={openLogin} onLogout={() => setUser(null)} onSearch={search} />
          <main id="noi-dung">
            <Hero />
            <EventList query={query} onClearQuery={() => setQuery('')} />
            <ZoneMap user={user} onLogin={openLogin} />
            <BuyingFlow />
            <Faq />
          </main>
          <SiteFooter />
          <LoginDialog
            open={loginOpen}
            onClose={() => setLoginOpen(false)}
            onSuccess={(u) => {
              setUser(u)
              setLoginOpen(false)
            }}
          />
        </div>
      </MotionConfig>
    </LazyMotion>
  )
}
