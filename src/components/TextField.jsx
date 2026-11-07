import { useId, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'

/**
 * Ô nhập có nhãn luôn hiện, gợi ý và lỗi gắn với ô qua aria-describedby để trình đọc màn hình đọc kèm.
 * required: thêm dấu * sau nhãn (trình đọc màn hình đọc "bắt buộc" từ thuộc tính required của ô, nên dấu * được ẩn đi).
 * Khi có lỗi, ô rung ngang một nhịp và dòng lỗi trượt xuống, để thấy ngay ô nào sai. Cần LazyMotion ở trang cha.
 * Mọi prop khác (type, value, onChange, autoComplete, placeholder...) truyền thẳng xuống <input>.
 * type="password": thêm nút con mắt ở cuối ô để hiện hoặc ẩn mật khẩu.
 */

/** Con mắt mở khi đang ẩn mật khẩu (bấm để hiện), con mắt gạch chéo khi đang hiện (bấm để ẩn). */
function EyeIcon({ open }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {!open && <path d="M3 3l18 18" />}
    </svg>
  )
}
export function TextField({ label, id, error, hint, required = false, optional = false, className = '', type = 'text', ...inputProps }) {
  const autoId = useId()
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const fieldId = id ?? autoId
  const hintId = hint ? `${fieldId}-goi-y` : undefined
  const errorId = error ? `${fieldId}-loi` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className={className}>
      <label htmlFor={fieldId} className="text-body-sm font-medium text-fg">
        {label}
        {required && <span aria-hidden="true" className="text-action-fg"> *</span>}
        {optional && <span className="font-normal text-fg-muted"> (không bắt buộc)</span>}
      </label>
      {/* Rung cả khung chứa ô và nút con mắt để nút đi theo ô */}
      <m.div
        className="relative mt-1.5"
        animate={error ? { x: [0, -6, 6, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.36 }}
      >
        <input
          id={fieldId}
          type={isPassword && showPassword ? 'text' : type}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`block min-h-11 w-full rounded-input bg-surface px-4 text-body text-fg ring-1 ring-input-line outline-none placeholder:text-fg-placeholder focus-visible:ring-2 focus-visible:ring-focus aria-[invalid=true]:ring-input-line-invalid disabled:bg-surface-sunken disabled:text-fg-muted disabled:cursor-not-allowed ${isPassword ? 'pr-12' : ''}`}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-pressed={showPassword}
            aria-controls={fieldId}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-input text-fg-muted hover:text-fg"
          >
            <EyeIcon open={!showPassword} />
          </button>
        )}
      </m.div>
      <AnimatePresence initial={false}>
        {error && (
          <m.p
            id={errorId}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            className="mt-1.5 text-body-sm text-danger"
          >
            {error}
          </m.p>
        )}
      </AnimatePresence>
      {hint && !error && <p id={hintId} className="mt-1.5 text-body-sm text-fg-muted">{hint}</p>}
    </div>
  )
}
