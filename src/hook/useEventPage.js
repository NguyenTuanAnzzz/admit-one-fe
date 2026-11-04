import { useEffect, useState } from 'react'

/**
 * Tải một trang danh sách sự kiện theo bộ lọc, dùng chung cho trang admin và trang /events của khách.
 * load(params) trả EventPageResponse. Đổi params (lọc, sang trang) thì tự tải lại.
 * data: kết quả của lần tải xong gần nhất. Đang tải trang mới vẫn giữ data cũ để danh sách không nháy trắng.
 * loading tính từ việc kết quả đang giữ có đúng bộ lọc hiện tại không, nên không phải setState ngay trong effect.
 */
export default function useEventPage(load, params) {
  const [result, setResult] = useState({ key: null, data: null, error: null })
  // Tăng số này để tải lại đúng bộ lọc hiện tại (nút "Thử lại", sau khi đổi trạng thái)
  const [reloadKey, setReloadKey] = useState(0)

  const key = `${JSON.stringify(params)}#${reloadKey}`

  useEffect(() => {
    let cancelled = false
    load(params)
      .then((data) => !cancelled && setResult({ key, data, error: null }))
      .catch((err) => !cancelled && setResult((r) => ({ key, data: r.data, error: err.message })))
    return () => {
      // Bấm sang trang liên tục: chỉ nhận kết quả của lần bấm cuối, kết quả cũ về muộn thì bỏ
      cancelled = true
    }
    // params đã nằm trong key; load thường được tạo mới mỗi lần render (bọc fetchWithAuth), không tải lại vì thế
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return {
    data: result.data,
    error: result.key === key ? result.error : null,
    loading: result.key !== key,
    reload: () => setReloadKey((k) => k + 1),
  }
}
