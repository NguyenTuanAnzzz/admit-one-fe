import { useEffect, useState } from 'react'
import { getMyTickets } from '../api/orderApi'
import { useAuth } from '../context/AuthContext'

/**
 * Vé đã xuất của một đơn (GET /orders/{id}/tickets). Cùng cách useOrderDetail:
 * key = id đã tải xong, đổi đơn thì tự coi là đang tải, không setState trong effect.
 */
export default function useMyTickets(orderId) {
  const { fetchWithAuth } = useAuth()
  const [result, setResult] = useState({ key: null, tickets: [], error: null })
  const [reloadKey, setReloadKey] = useState(0)

  const key = `${orderId}#${reloadKey}`

  useEffect(() => {
    let cancelled = false
    getMyTickets(fetchWithAuth, orderId)
      .then((tickets) => !cancelled && setResult({ key, tickets, error: null }))
      .catch((err) => !cancelled && setResult({ key, tickets: [], error: err.message }))
    return () => {
      cancelled = true
    }
    // fetchWithAuth đổi khi refresh token, không tải lại vì thế
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const loading = result.key !== key
  return {
    loading,
    tickets: loading ? [] : result.tickets,
    error: loading ? null : result.error,
    reload: () => setReloadKey((k) => k + 1),
  }
}
