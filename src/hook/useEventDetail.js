import { useEffect, useState } from 'react'
import { getPublicEvent } from '../api/publicEventApi'
import useLiveTicketAvailability from './useLiveTicketAvailability'

// Đặc tả C-05 và 5.6: tối đa 4 vé mỗi tài khoản mỗi sự kiện, trừ khi sự kiện đặt khác. Backend kiểm tra lại khi giữ vé
const DEFAULT_MAX_TICKETS = 4

/**
 * Dữ liệu trang chi tiết sự kiện cho khách: sự kiện, loại vé kèm số vé còn (tickets trong GET /events/{id}),
 * số lượng khách đang chọn từng loại. Chỉ chọn được khi sự kiện Đang bán và loại vé ACTIVE.
 * Tổng số vé mọi loại không vượt giới hạn mỗi tài khoản, mỗi loại không vượt số vé còn.
 */
export default function useEventDetail(eventId) {
  // key = id đã tải xong: đổi sự kiện thì tự coi là đang tải, không phải setState trong effect
  const [result, setResult] = useState({ key: null, event: null, tiers: [], error: null, notFound: false })
  const [reloadKey, setReloadKey] = useState(0)
  // tierId → số vé đang chọn. Gắn với key để đổi sự kiện thì tự về rỗng
  const [picked, setPicked] = useState({ key: null, counts: {} })

  const key = `${eventId}#${reloadKey}`

  useEffect(() => {
    let cancelled = false
    getPublicEvent(eventId)
      .then((event) => {
        if (cancelled) return
        // price là BigDecimal ở backend: đổi sang số để cộng tiền. Vé đắt lên trước
        const tiers = (event.tickets ?? []).map((t) => ({ ...t, price: Number(t.price) || 0 })).sort((a, b) => b.price - a.price)
        setResult({ key, event, tiers, error: null, notFound: false })
      })
      .catch((err) => !cancelled && setResult({ key, event: null, tiers: [], error: err.message, notFound: err.status === 404 }))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const loading = result.key !== key
  const event = loading ? null : result.event
  const counts = picked.key === key ? picked.counts : {}

  // Bài 5.3 (bài 21 của khoá): số vé còn lại cập nhật realtime, ghép đè lên snapshot vừa tải bằng
  // ticketsVersion. Lỡ tin ở giữa (vd mất mạng một lúc) thì onGap chủ động tải lại snapshot,
  // đúng nguyên tắc "phát hiện khoảng trống thì tự lành" thay vì hiển thị sai mãi.
  const { available: liveAvailable, live } = useLiveTicketAvailability(
    loading ? null : eventId,
    loading ? null : event?.ticketsVersion ?? null,
    () => setReloadKey((k) => k + 1),
  )

  const tiers = loading
    ? []
    : result.tiers.map((t) => (t.id in liveAvailable ? { ...t, available: liveAvailable[t.id] } : t))

  const maxTickets = event?.maxTicketsPerUser ?? DEFAULT_MAX_TICKETS
  const canSelect = event?.status === 'ON_SALE'
  // Một loại vé chọn được khi sự kiện đang bán, vé ACTIVE và còn vé
  const canPick = (tier) => canSelect && tier.status === 'ACTIVE' && tier.available > 0
  const totalCount = Object.values(counts).reduce((n, c) => n + c, 0)

  // Số tối đa chọn được cho một hạng: không quá số vé còn, và không làm tổng vượt giới hạn mỗi tài khoản
  const maxFor = (tier) => Math.min(tier.available, (counts[tier.id] ?? 0) + (maxTickets - totalCount))

  function setCount(tier, value) {
    if (!canPick(tier)) return
    const next = Math.max(0, Math.min(maxFor(tier), value))
    setPicked({ key, counts: { ...counts, [tier.id]: next } })
  }

  const clearSelection = () => setPicked({ key, counts: {} })

  const selected = tiers.filter((t) => counts[t.id] > 0).map((t) => ({ ...t, count: counts[t.id] }))
  const total = selected.reduce((sum, t) => sum + t.count * t.price, 0)

  return {
    loading,
    error: loading ? null : result.error,
    notFound: !loading && result.notFound,
    reload: () => setReloadKey((k) => k + 1),
    event,
    tiers,
    liveTickets: live, // đang nhận cập nhật realtime hay không (true sau khi WebSocket kết nối xong)
    canSelect,
    canPick,
    maxTickets,
    counts,
    totalCount,
    maxFor,
    setCount,
    clearSelection,
    selected,
    total,
  }
}
