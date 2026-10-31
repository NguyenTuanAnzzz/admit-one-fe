const LINKS = [
  { href: '#su-kien', label: 'Sự kiện' },
  { href: '#gia-ve', label: 'Giá theo khu' },
  { href: '#cach-mua', label: 'Cách mua vé' },
  { href: '#hoi-dap', label: 'Hỏi đáp' },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-line px-gutter py-10">
      <div className="mx-auto flex max-w-page flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <p className="font-display text-heading-sm font-extrabold text-brand">admit one</p>
          <p className="mt-2 text-body-sm text-fg-muted">
            Vé có số ghế cho concert và sự kiện tại Hà Nội. Thanh toán đang chạy ở chế độ thử nghiệm của VNPay và MoMo.
          </p>
        </div>
        <nav aria-label="Liên kết cuối trang">
          <ul className="flex flex-wrap gap-x-2 gap-y-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="inline-flex min-h-11 items-center rounded-nav px-3 text-body-sm font-medium text-fg-muted hover:bg-surface-sunken hover:text-title">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-page text-body-sm text-fg-muted">© 2026 Admit One. Số liệu ghế và đơn hàng trên trang là dữ liệu mẫu.</p>
    </footer>
  )
}
