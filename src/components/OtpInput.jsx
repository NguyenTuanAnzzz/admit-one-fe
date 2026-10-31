import { useRef } from 'react'
import { m } from 'framer-motion'

/** Mã OTP chỉ gồm chữ A-Z và số 0-9 (cùng bảng ký tự với generateOtp ở backend). Chữ thường tự đổi thành chữ hoa. */
function cleanOtp(text) {
  return text.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

/**
 * Mỗi ô một ký tự, số ô bằng value.length (mảng chuỗi), onChange nhận mảng mới.
 * Gõ xong một ô tự nhảy sang ô sau, Backspace ở ô trống lùi về ô trước, mũi tên trái phải để di chuyển.
 * Ctrl+V dán cả mã: rải từ ô đang đứng trở đi. Ctrl+C copy cả mã đã nhập chứ không chỉ một ô.
 */
export function OtpInput({ value, onChange, error, labelId, describedBy }) {
  const refs = useRef([])
  const length = value.length

  function focusAt(index) {
    const input = refs.current[Math.max(0, Math.min(index, length - 1))]
    input?.focus()
    input?.select()
  }

  // Ghi chuỗi ký tự từ ô start trở đi, rồi đưa con trỏ tới ô kế tiếp chưa ghi
  function fillFrom(start, text) {
    const chars = cleanOtp(text).slice(0, length - start).split('')
    if (!chars.length) return
    const next = [...value]
    chars.forEach((c, i) => {
      next[start + i] = c
    })
    onChange(next)
    focusAt(start + chars.length)
  }

  function handleInput(index, e) {
    const text = e.target.value
    if (!text) {
      const next = [...value]
      next[index] = ''
      onChange(next)
      return
    }
    // Ô đã có ký tự mà gõ thêm thì giữ ký tự vừa gõ. Nhiều ký tự một lúc (tự điền từ bàn phím điện thoại) thì rải ra.
    fillFrom(index, text.length === 2 && value[index] ? text.replace(value[index], '') : text)
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      e.preventDefault()
      const next = [...value]
      next[index - 1] = ''
      onChange(next)
      focusAt(index - 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusAt(index - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusAt(index + 1)
    }
  }

  function handlePaste(index, e) {
    e.preventDefault()
    fillFrom(index, e.clipboardData.getData('text'))
  }

  function handleCopy(e) {
    const code = value.join('')
    if (!code) return
    e.preventDefault()
    e.clipboardData.setData('text/plain', code)
  }

  return (
    <m.div
      role="group"
      aria-labelledby={labelId}
      aria-describedby={describedBy}
      onCopy={handleCopy}
      animate={error ? { x: [0, -6, 6, -3, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.36 }}
      className="mt-2 grid grid-cols-6 gap-2 sm:gap-3"
    >
      {value.map((char, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          value={char}
          onChange={(e) => handleInput(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Ký tự ${i + 1} trên ${length}`}
          aria-invalid={Boolean(error)}
          className="block h-14 w-full min-w-0 rounded-input bg-surface text-center font-display text-heading-sm font-bold text-title uppercase ring-1 ring-input-line outline-none focus-visible:ring-2 focus-visible:ring-focus aria-[invalid=true]:ring-input-line-invalid"
        />
      ))}
    </m.div>
  )
}
