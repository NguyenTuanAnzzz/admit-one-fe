import { useEffect, useState } from 'react'
import { getAdminEvents } from '../api/eventApi'
import { useAuth } from '../context/AuthContext'

/**
 * Tải một trang danh sách sự kiện cho admin theo bộ lọc. Đổi params (lọc, sang trang) thì tự tải lại.
 * data: EventPageResponse của lần tải xong gần nhất. Đang tải trang mới vẫn giữ data cũ để danh sách không nháy trắng.
 * loading tính từ việc kết quả đang giữ có đúng bộ lọc hiện tại không, nên không phải setState ngay trong effect.
 */
export default function useAdminEvents(params) {
  const { fetchWithAuth } = useAuth()
  const [result, setResult] = useState({ key: null, data: null, error: null })
  // Tăng số này để tải lại đúng bộ lọc hiện tại (nút "Thử lại")
  const [reloadKey, setReloadKey] = useState(0)

  const key = `${JSON.stringify(params)}#${reloadKey}`

  useEffect(() => {
    let cancelled = false
    getAdminEvents(fetchWithAuth, params)
      .then((data) => !cancelled && setResult({ key, data, error: null }))
      .catch((err) => !cancelled && setResult((r) => ({ key, data: r.data, error: err.message })))
    return () => {
      // Bấm sang trang liên tục: chỉ nhận kết quả của lần bấm cuối, kết quả cũ về muộn thì bỏ
      cancelled = true
    }
    // params đã nằm trong key; fetchWithAuth đổi khi làm mới token, không cần tải lại vì thế
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return {
    data: result.data,
    error: result.key === key ? result.error : null,
    loading: result.key !== key,
    reload: () => setReloadKey((k) => k + 1),
  }
}
