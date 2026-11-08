import { Link } from 'react-router-dom'
import { NAV } from '../lib/nav'

export function SiteFooter() {
  return (
    <footer className="border-t border-line px-gutter py-10">
      <div className="mx-auto flex max-w-page flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <p className="font-display text-heading-sm font-extrabold text-brand">admit one</p>
          <p className="mt-2 text-body-sm text-fg-muted">
            Vé điện tử có mã QR cho concert, kịch và lễ hội trên khắp Việt Nam. Thanh toán đang chạy ở chế độ thử nghiệm của VNPay và MoMo.
          </p>
        </div>
        {/* Cùng các trang với menu trên header */}
        <nav aria-label="Liên kết cuối trang">
          <ul className="flex flex-wrap gap-x-2 gap-y-1">
            {NAV.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="inline-flex min-h-11 items-center rounded-nav px-3 text-body-sm font-medium text-fg-muted hover:bg-surface-sunken hover:text-title">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-page text-body-sm text-fg-muted">© 2026 Admit One. Số liệu, đối tác và sự kiện trên trang chủ là dữ liệu mẫu.</p>
    </footer>
  )
}
