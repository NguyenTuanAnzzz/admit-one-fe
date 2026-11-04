import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Faq } from '../components/Faq'

/** Trang /faq: câu hỏi thường gặp (cùng phần Faq trên trang chủ), header và footer do PublicLayout lo. */
export default function FaqPage() {
  useEffect(() => {
    const previous = document.title
    document.title = 'Hỏi đáp · Admit One'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <main id="main-content">
      <div className="mx-auto max-w-page px-gutter pt-section-sm pb-6">
        <h1 className="font-display text-heading font-bold text-title md:text-heading-lg">Hỏi đáp</h1>
        <p className="mt-2 max-w-2xl text-body text-fg-muted">Giữ ghế, thanh toán, hoàn tiền và soát vé ở cổng. Bấm vào câu hỏi để xem trả lời.</p>
      </div>
      <Faq />
      <div className="mx-auto max-w-page px-gutter pb-section-sm">
        <Link to="/how-to-buy" className="inline-flex min-h-11 items-center font-semibold text-title underline underline-offset-4 hover:text-fg-muted">
          Xem các bước mua vé →
        </Link>
      </div>
    </main>
  )
}
