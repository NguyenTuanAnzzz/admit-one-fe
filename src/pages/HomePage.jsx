import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion'
import { SiteHeader } from '../components/SiteHeader'
import { Hero } from '../components/Hero'
import { EventList } from '../components/EventList'
import { ZoneMap } from '../components/ZoneMap'
import { BuyingFlow } from '../components/BuyingFlow'
import { Faq } from '../components/Faq'
import { SiteFooter } from '../components/SiteFooter'
import { useAuth } from '../context/AuthContext'

export default function HomePage() {
  const { user, loading, logout } = useAuth()

  const [query, setQuery] = useState('')

  const navigate = useNavigate()
  const openLogin = () => navigate('/login')

  const search = (q) => {
    setQuery(q)
    document.getElementById('events')?.scrollIntoView({ block: 'start' })
  }

  return (
    // LazyMotion + domAnimation: chỉ nạp phần animation trang cần, nhẹ hơn cả thư viện.
    // reducedMotion="user": máy bật giảm chuyển động thì bỏ dịch, xoay, phóng; vẫn giữ hiện dần và đổi màu.
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div id="top" className="min-h-screen bg-canvas text-fg">
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-pill focus:bg-title focus:px-4 focus:py-2 focus:text-fg-inverse">
            Bỏ qua tới nội dung
          </a>
          <SiteHeader user={user} authReady={!loading} onLogin={openLogin} onLogout={logout} onSearch={search} />
          <main id="main-content">
            <Hero />
            <EventList query={query} onClearQuery={() => setQuery('')} />
            <ZoneMap user={user} onLogin={openLogin} />
            <BuyingFlow />
            <Faq />
          </main>
          <SiteFooter />
        </div>
      </MotionConfig>
    </LazyMotion>
  )
}
