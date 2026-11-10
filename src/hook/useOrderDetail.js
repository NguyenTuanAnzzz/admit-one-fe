import { useEffect, useState } from 'react'
import { getMyOrder } from '../api/orderApi'
import { useAuth } from '../context/AuthContext'

/**
 * Tải một đơn của khách đang đăng nhập (GET /orders/{id}).
 * key = id đã tải xong: đổi đơn thì tự coi là đang tải, không phải setState trong effect (cùng cách useEventDetail).
 */
export default function useOrderDetail(orderId) {
  const { fetchWithAuth } = useAuth()
  const [result, setResult] = useState({ key: null, order: null, error: null, notFound: false })
  const [reloadKey, setReloadKey] = useState(0)

  const key = `${orderId}#${reloadKey}`

  useEffect(() => {
    let cancelled = false
    getMyOrder(fetchWithAuth, orderId)
      .then((order) => !cancelled && setResult({ key, order, error: null, notFound: false }))
      .catch((err) => !cancelled && setResult({ key, order: null, error: err.message, notFound: err.status === 404 }))
    return () => {
      cancelled = true
    }
    // fetchWithAuth đổi khi refresh token, không tải lại vì thế
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const loading = result.key !== key
  return {
    loading,
    order: loading ? null : result.order,
    error: loading ? null : result.error,
    notFound: !loading && result.notFound,
    reload: () => setReloadKey((k) => k + 1),
  }
}
