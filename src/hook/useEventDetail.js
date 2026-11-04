import { useEffect, useState } from 'react'
import { getPublicEvent, getPublicTiers } from '../api/publicEventApi'

// Đặc tả C-05 và 5.6: tối đa 4 vé mỗi tài khoản mỗi sự kiện, trừ khi sự kiện đặt khác. Backend kiểm tra lại khi giữ vé
const DEFAULT_MAX_TICKETS = 4

/**
 * Dữ liệu trang chi tiết sự kiện cho khách: sự kiện, hạng vé kèm số vé còn, số lượng khách đang chọn từng hạng.
 * Chỉ chọn được khi sự kiện Đang bán. Tổng số vé mọi hạng không vượt giới hạn mỗi tài khoản,
 * mỗi hạng không vượt số vé còn.
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
    Promise.all([getPublicEvent(eventId), getPublicTiers(eventId)])
      .then(([event, tiers]) => !cancelled && setResult({ key, event, tiers, error: null, notFound: false }))
      .catch((err) => !cancelled && setResult({ key, event: null, tiers: [], error: err.message, notFound: err.status === 404 }))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const loading = result.key !== key
  const event = loading ? null : result.event
  const tiers = loading ? [] : result.tiers
  const counts = picked.key === key ? picked.counts : {}

  const maxTickets = event?.maxTicketsPerUser ?? DEFAULT_MAX_TICKETS
  const canSelect = event?.status === 'ON_SALE'
  const totalCount = Object.values(counts).reduce((n, c) => n + c, 0)

  // Số tối đa chọn được cho một hạng: không quá số vé còn, và không làm tổng vượt giới hạn mỗi tài khoản
  const maxFor = (tier) => Math.min(tier.available, (counts[tier.id] ?? 0) + (maxTickets - totalCount))

  function setCount(tier, value) {
    if (!canSelect) return
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
    canSelect,
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
