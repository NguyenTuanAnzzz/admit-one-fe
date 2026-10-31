import { m } from 'framer-motion'

/**
 * Logo trên header: cùng hình với public/logo-avatar.svg, vẽ trực tiếp để Framer Motion điều khiển từng phần.
 *   Mở trang: tấm vé xoay và phóng nhẹ vào vị trí, như vừa được đặt lên quầy.
 *   Rê chuột hoặc focus bằng bàn phím: vé thẳng lại, số 1 nảy lên một nhịp.
 * Máy bật "giảm chuyển động": bỏ xoay và nảy (MotionConfig ở HomePage), logo vẫn hiện dần.
 */
const ticket = {
  enter: { rotate: -40, scale: 0.6, opacity: 0 },
  rest: { rotate: -12, scale: 1.1, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 18 } },
  hover: { rotate: 0, scale: 1.16, transition: { type: 'spring', stiffness: 320, damping: 14 } },
}

const numeral = {
  enter: { y: 0 },
  rest: { y: 0 },
  hover: { y: [0, -26, 0], transition: { duration: 0.42, ease: 'easeOut' } },
}

// SVG cần transform-box: fill-box để xoay quanh tâm của chính tấm vé, không phải góc trên trái của khung
const centered = { transformBox: 'fill-box', originX: 0.5, originY: 0.5 }

export function HeaderLogo({ href = '#top', label = 'Admit One, về đầu trang', className = '' }) {
  const motionProps = { initial: 'enter', animate: 'rest', whileHover: 'hover', whileFocus: 'hover' }

  return (
    <m.a href={href} aria-label={label} className={`inline-flex min-h-11 items-center gap-2.5 ${className}`} {...motionProps}>
      <svg aria-hidden="true" viewBox="0 0 512 512" className="size-9 shrink-0">
        <rect width="512" height="512" rx="112" className="fill-brand" />
        <m.g variants={ticket} style={centered}>
          <path className="fill-surface" d="M120 156H392A24 24 0 0 1 416 180V228A28 28 0 0 0 416 284V332A24 24 0 0 1 392 356H120A24 24 0 0 1 96 332V284A28 28 0 0 0 96 228V180A24 24 0 0 1 120 156Z" />
          <path className="stroke-brand" strokeWidth="7" strokeLinecap="round" strokeDasharray="1 17" d="M176 182V330" />
          <m.path variants={numeral} className="fill-brand" d="M294 196H326V316H294V230L266 244V214Z" />
        </m.g>
      </svg>
      <span className="font-display text-heading-sm font-extrabold whitespace-nowrap text-brand">admit one</span>
    </m.a>
  )
}
