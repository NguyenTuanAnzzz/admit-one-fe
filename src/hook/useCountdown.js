import { useEffect, useState } from 'react'

/**
 * Số giây còn lại tới mốc deadline (chuỗi ISO từ backend), cập nhật mỗi giây, dừng ở 0.
 * Tính lại từ đồng hồ mỗi lần chứ không trừ dần 1, nên tab bị ẩn hay tải lại trang vẫn đúng.
 * Không có deadline thì trả về null.
 */
export default function useCountdown(deadline) {
  const [now, setNow] = useState(() => Date.now())
  const end = deadline ? new Date(deadline).getTime() : null
  const secondsLeft = end === null ? null : Math.max(0, Math.ceil((end - now) / 1000))

  useEffect(() => {
    if (end === null || end <= Date.now()) return
    const timer = setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (current >= end) clearInterval(timer)
    }, 1000)
    return () => clearInterval(timer)
  }, [end])

  return secondsLeft
}
