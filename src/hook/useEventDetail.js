import { useEffect, useMemo, useState } from 'react'
import { getPublicEvent, getPublicSeatMap, getPublicZoneSeats } from '../api/publicEventApi'

// Đặc tả C-05 và 5.6: tối đa 4 vé mỗi tài khoản mỗi sự kiện. Backend sẽ kiểm tra lại khi giữ ghế
export const MAX_SELECTED = 4

/**
 * Dữ liệu trang chi tiết sự kiện cho khách: sự kiện, sơ đồ, ghế từng khu (tải khi khách mở khu), ghế đang chọn.
 * Ghế của một khu chỉ tải khi khách bấm vào khu đó (đặc tả 5.3: không tải cả 20.000 ghế lúc mở trang).
 * Chỉ chọn được ghế khi sự kiện Đang bán, khu bán theo ghế (RESERVED) và ghế còn trống.
 */
export default function useEventDetail(eventId) {
  // key = id đã tải xong: đổi sự kiện thì tự coi là đang tải, không phải setState trong effect
  const [result, setResult] = useState({ key: null, event: null, seatMap: null, error: null, notFound: false })
  const [reloadKey, setReloadKey] = useState(0)
  const [zoneSeats, setZoneSeats] = useState({})
  const [activeZoneId, setActiveZoneId] = useState(null)
  const [selected, setSelected] = useState([])
  const [selectError, setSelectError] = useState(null)

  const key = `${eventId}#${reloadKey}`

  useEffect(() => {
    let cancelled = false
    Promise.all([getPublicEvent(eventId), getPublicSeatMap(eventId)])
      .then(([event, seatMap]) => !cancelled && setResult({ key, event, seatMap, error: null, notFound: false }))
      .catch((err) => !cancelled && setResult({ key, event: null, seatMap: null, error: err.message, notFound: err.status === 404 }))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const loading = result.key !== key
  const { event, seatMap } = loading ? { event: null, seatMap: null } : result

  const tiersById = useMemo(() => Object.fromEntries((seatMap?.tiers ?? []).map((t) => [t.id, t])), [seatMap])
  const zonesById = useMemo(() => Object.fromEntries((seatMap?.zones ?? []).map((z) => [z.id, z])), [seatMap])

  const canSelect = event?.status === 'ON_SALE'

  // Bấm khu: phóng vào khu đó, lần đầu thì tải ghế của khu. force: tải lại dù đã có
  function openZone(zoneId, force = false) {
    setActiveZoneId(zoneId)
    if (!zoneId || (!force && zoneSeats[zoneId]?.seats)) return
    setZoneSeats((s) => ({ ...s, [zoneId]: { loading: true, seats: null, error: null } }))
    getPublicZoneSeats(eventId, zoneId)
      .then((seats) => setZoneSeats((s) => ({ ...s, [zoneId]: { loading: false, seats, error: null } })))
      .catch((err) => setZoneSeats((s) => ({ ...s, [zoneId]: { loading: false, seats: null, error: err.message } })))
  }

  // Tải lại ghế của khu đang mở, khi tải lỗi hoặc khách muốn xem trạng thái mới nhất
  const reloadZone = (zoneId) => openZone(zoneId, true)

  function toggleSeat(zoneId, seat) {
    setSelectError(null)
    if (selected.some((s) => s.seatId === seat.id)) {
      setSelected(selected.filter((s) => s.seatId !== seat.id))
      return
    }
    if (!canSelect || seat.status !== 'AVAILABLE') return
    if (selected.length >= MAX_SELECTED) {
      setSelectError(`Mỗi tài khoản chọn tối đa ${MAX_SELECTED} ghế cho một sự kiện.`)
      return
    }
    const zone = zonesById[zoneId]
    const tier = tiersById[zone.tierId]
    setSelected([...selected, { seatId: seat.id, zoneId, zoneLabel: zone.label, rowLabel: seat.rowLabel, seatNumber: seat.seatNumber, price: tier?.price ?? 0, tierName: tier?.name ?? '' }])
  }

  const clearSelection = () => {
    setSelected([])
    setSelectError(null)
  }

  const total = selected.reduce((sum, s) => sum + s.price, 0)

  return {
    loading,
    error: loading ? null : result.error,
    notFound: !loading && result.notFound,
    reload: () => setReloadKey((k) => k + 1),
    event,
    seatMap,
    tiersById,
    zonesById,
    canSelect,
    zoneSeats,
    activeZoneId,
    openZone,
    reloadZone,
    selected,
    selectError,
    toggleSeat,
    clearSelection,
    total,
  }
}
