import { useEffect, useState } from 'react'

export const formatMoney = (n) => n.toLocaleString('vi-VN') + 'đ'
export const formatCount = (n) => n.toLocaleString('vi-VN')

const WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

/** Tách ngày giờ theo giờ Hà Nội, không phụ thuộc múi giờ máy người xem. */
export function hanoiParts(iso) {
  const d = new Date(new Date(iso).getTime() + 7 * 3600 * 1000)
  const pad = (n) => String(n).padStart(2, '0')
  return {
    day: pad(d.getUTCDate()),
    month: pad(d.getUTCMonth() + 1),
    year: d.getUTCFullYear(),
    weekday: WEEKDAYS[d.getUTCDay()],
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
  }
}

/** 9 ngày 21:28:38, hoặc 21:28:38 khi còn dưới một ngày */
export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const days = Math.floor(s / 86400)
  const pad = (n) => String(n).padStart(2, '0')
  const hms = `${pad(Math.floor((s % 86400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
  return days > 0 ? `${days} ngày ${hms}` : hms
}

/** 09:41 */
export function formatMinutes(totalSeconds) {
  const s = Math.max(0, totalSeconds)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/** Thời điểm hiện tại, cập nhật mỗi giây. Dùng chung cho mọi đồng hồ đếm ngược trên trang. */
export function useNow() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

export function secondsUntil(iso, now) {
  return Math.max(0, Math.floor((new Date(iso).getTime() - now) / 1000))
}
