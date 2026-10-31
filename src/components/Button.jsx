/** Nút dùng chung. Trang phải nằm trong LazyMotion (xem HomePage) vì nút dùng m.button. */
import { m } from 'framer-motion'
import { press } from '../lib/motion'

const buttonBase =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-pill border-[1.5px] px-6 text-center text-body-sm font-semibold transition-colors'

/** Nút và link dạng nút đều lún nhẹ khi bấm (lib/motion.js). */
function PressableButton({ as, ...props }) {
  return as === 'a' ? <m.a {...press} {...props} /> : <m.button {...press} {...props} />
}

/** Hành động chính: nền cam san hô, chữ trắng. Chỉ dùng cho mua vé và xác nhận. */
export function PrimaryButton({ as = 'button', className = '', ...props }) {
  return (
    <PressableButton
      as={as}
      className={`${buttonBase} border-button-primary bg-button-primary text-button-primary-fg hover:border-button-primary-hover hover:bg-button-primary-hover disabled:border-line disabled:bg-button-disabled disabled:text-button-disabled-fg ${className}`}
      {...props}
    />
  )
}

/** Hành động phụ: viền xám, chữ màu mực. */
export function GhostButton({ as = 'button', className = '', ...props }) {
  return (
    <PressableButton
      as={as}
      className={`${buttonBase} border-button-secondary-line bg-transparent text-button-secondary-fg hover:border-fg hover:bg-button-secondary-hover active:bg-line disabled:border-line disabled:bg-button-disabled disabled:text-button-disabled-fg ${className}`}
      {...props}
    />
  )
}
