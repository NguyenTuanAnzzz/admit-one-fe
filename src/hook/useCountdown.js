import { useEffect, useState } from 'react'

/**
 * Số giây còn lại tới mốc deadline (chuỗi ISO từ backend), cập nhật mỗi giây, dừng ở 0.
 * Tính lại từ đồng hồ mỗi lần chứ không trừ dần 1, nên tab bị ẩn hay tải lại trang vẫn đúng.
 * Không có deadline thì trả về null. Đổi deadline (gửi lại mã) thì đếm lại từ mốc mới.
 */
export default function useCountdown(deadline) {
  const [now, setNow] = useState(() => Date.now())
  const end = deadline ? new Date(deadline).getTime() : null
  const secondsLeft = end === null ? null : Math.max(0, Math.ceil((end - now) / 1000))

  useEffect(() => {
    if (end === null) return
    function tick() {
      const current = Date.now()
      setNow(current)
      if (current >= end) clearInterval(timer)
    }
    // Có mốc mới (gửi lại mã) thì cập nhật ngay, không chờ hết giây đầu
    const first = setTimeout(tick, 0)
    const timer = setInterval(tick, 1000)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [end])

  return secondsLeft
}
