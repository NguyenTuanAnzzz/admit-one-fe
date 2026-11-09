import { useState } from 'react'
import { createOrder } from '../api/orderApi'
import { useAuth } from '../context/AuthContext'

/**
 * Giữ vé = tạo đơn PENDING (POST /orders). Thành công thì lưu đơn vừa tạo để trang hiện mã đơn và hạn thanh toán.
 * Lỗi (hết vé, quá 4 vé...) lấy đúng message backend trả về.
 */
export default function useCreateOrder() {
  const { fetchWithAuth } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [order, setOrder] = useState(null)

  async function submit(eventId, selected) {
    setSubmitting(true)
    setError(null)
    try {
      const items = selected.map((t) => ({ ticketId: t.id, quantity: t.count }))
      const data = await createOrder(fetchWithAuth, { eventId, items })
      setOrder(data)
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setSubmitting(false)
    }
  }

  return { submit, submitting, error, order, clearError: () => setError(null) }
}
