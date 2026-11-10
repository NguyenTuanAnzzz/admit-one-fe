import { useEffect, useState } from 'react'
import { getMyOrder } from '../api/orderApi'
import { useAuth } from '../context/AuthContext'

/**
 * Tải một đơn của khách đang đăng nhập (GET /orders/{id}).
 * key = id đã tải xong: đổi đơn thì tự coi là đang tải, không phải setState trong effect (cùng cách useEventDetail).
 * Tải lại cùng một đơn (sau khi huỷ, lúc chờ xác nhận thanh toán) vẫn giữ đơn cũ trên màn hình,
 * refreshing = true trong lúc chờ, để trang không nháy về "Đang tải".
 */
export default function useOrderDetail(orderId) {
  const { fetchWithAuth } = useAuth()
  const [result, setResult] = useState({ key: null, orderId: null, order: null, error: null, notFound: false })
  const [reloadKey, setReloadKey] = useState(0)

  const key = `${orderId}#${reloadKey}`

  useEffect(() => {
    let cancelled = false
    getMyOrder(fetchWithAuth, orderId)
      .then((order) => !cancelled && setResult({ key, orderId, order, error: null, notFound: false }))
      .catch((err) => !cancelled && setResult({ key, orderId, order: null, error: err.message, notFound: err.status === 404 }))
    return () => {
      cancelled = true
    }
    // fetchWithAuth đổi khi refresh token, không tải lại vì thế
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // Chỉ coi là "đang tải" khi chưa có kết quả nào của đơn này; tải lại cùng đơn thì giữ dữ liệu cũ
  const loading = result.orderId !== orderId
  return {
    loading,
    refreshing: result.key !== key,
    order: loading ? null : result.order,
    error: loading ? null : result.error,
    notFound: !loading && result.notFound,
    reload: () => setReloadKey((k) => k + 1),
  }
}
