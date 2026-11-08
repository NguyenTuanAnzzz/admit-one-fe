import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BuyingFlow } from '../components/BuyingFlow'

/** Trang /how-to-buy: các bước mua vé (cùng phần BuyingFlow trên trang chủ), header và footer do PublicLayout lo. */
export default function HowToBuyPage() {
  useEffect(() => {
    const previous = document.title
    document.title = 'Cách mua vé · Admit One'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <main id="main-content">
      <div className="mx-auto max-w-page px-gutter pt-section-sm pb-6">
        <h1 className="font-display text-heading font-bold text-title md:text-heading-lg">Cách mua vé</h1>
        <p className="mt-2 max-w-2xl text-body text-fg-muted">
          Chọn hạng vé và số lượng, giữ vé 10 phút, thanh toán qua VNPay hoặc MoMo rồi nhận vé có mã QR qua email. Mỗi tài khoản mua tối đa 4 vé cho một sự kiện.
        </p>
      </div>
      <BuyingFlow />
      <div className="mx-auto max-w-page px-gutter pb-section-sm">
        <Link to="/#events" className="inline-flex min-h-11 items-center font-semibold text-title underline underline-offset-4 hover:text-fg-muted">
          Xem sự kiện đang bán →
        </Link>
      </div>
    </main>
  )
}
