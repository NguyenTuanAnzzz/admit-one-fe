import { useEffect, useState } from 'react'
import { HeaderLogo } from './HeaderLogo'

const NAV = [
  { href: '#events', label: 'Sự kiện' },
  { href: '#pricing', label: 'Giá theo khu' },
  { href: '#how-to-buy', label: 'Cách mua vé' },
  { href: '#faq', label: 'Hỏi đáp' },
]

const navLink = 'inline-flex min-h-11 items-center rounded-nav px-3 text-body-sm font-medium text-fg-muted hover:bg-surface-sunken hover:text-title'

/** Thanh điều hướng trắng dính đầu trang: logo, ô tìm kiếm, liên kết, đăng nhập. */
export function SiteHeader({ user, authReady = true, onLogin, onLogout, onSearch }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  function submit(e) {
    e.preventDefault()
    onSearch(query.trim())
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="mx-auto flex max-w-page flex-wrap items-center gap-x-4 gap-y-3 px-gutter py-3 lg:flex-nowrap">
        <HeaderLogo className="order-1" />

        {/* Nhãn "Tìm sự kiện" luôn hiện (không chỉ dựa vào placeholder); viền focus đậm bao cả ô khi dùng bàn phím */}
        <form
          role="search"
          onSubmit={submit}
          className="order-3 flex w-full items-center gap-2 rounded-nav border border-line-strong bg-canvas py-1 pr-1 pl-5 focus-within:border-action focus-within:bg-surface has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus lg:order-2 lg:max-w-md lg:flex-1"
        >
          <label className="flex min-h-11 min-w-0 flex-1 cursor-text flex-col justify-center">
            <span className="text-caption font-semibold text-fg-muted">Tìm sự kiện</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tên sự kiện hoặc địa điểm"
              className="min-w-0 bg-transparent text-body-sm text-fg outline-none placeholder:text-fg-placeholder"
            />
          </label>
          <button type="submit" aria-label="Tìm kiếm" className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-search-submit text-search-submit-fg hover:bg-action-hover">
            <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="9" cy="9" r="5.5" />
              <path d="m13.5 13.5 3.5 3.5" />
            </svg>
          </button>
        </form>

        <nav aria-label="Điều hướng chính" className="order-2 ml-auto hidden md:block lg:order-3">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <a href={item.href} className={navLink}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="order-2 ml-auto flex items-center gap-1 md:ml-0 lg:order-4">
          {user ? (
            <>
              <span aria-hidden="true" className="inline-flex size-9 items-center justify-center rounded-full bg-avatar text-body-sm font-bold text-avatar-fg">
                {user.initials}
              </span>
              <span className="hidden text-body-sm font-semibold xl:inline">{user.name}</span>
              <button type="button" onClick={onLogout} className={navLink}>
                Đăng xuất
              </button>
            </>
          ) : (
            // Chưa hỏi xong backend thì ẩn nút (vẫn giữ chỗ) để không nháy "Đăng nhập" với người đang đăng nhập
            <button type="button" onClick={onLogin} className={`${navLink} ${authReady ? '' : 'invisible'}`}>
              Đăng nhập
            </button>
          )}
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full text-fg hover:bg-surface-sunken md:hidden"
            aria-expanded={menuOpen}
            aria-controls="menu-di-dong"
            aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {menuOpen ? <path d="M5 5l10 10M15 5 5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="menu-di-dong" aria-label="Điều hướng di động" className="border-t border-line px-gutter py-2 md:hidden">
          <ul className="flex flex-col">
            {NAV.map((item) => (
              <li key={item.href}>
                <a href={item.href} onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center rounded-input px-3 text-body font-semibold text-fg hover:bg-surface-sunken">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
