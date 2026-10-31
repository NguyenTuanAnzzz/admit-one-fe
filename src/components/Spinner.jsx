import { m } from 'framer-motion'

/** Vòng xoay trong nút khi đang gửi: báo máy chủ đang xử lý, dừng ngay khi có kết quả. */
export function Spinner() {
  return (
    <m.svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </m.svg>
  )
}
