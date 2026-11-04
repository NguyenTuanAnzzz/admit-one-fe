import { getAdminEvents } from '../api/eventApi'
import { useAuth } from '../context/AuthContext'
import useEventPage from './useEventPage'

/** Một trang danh sách sự kiện cho admin (có cả bản nháp), gắn token qua fetchWithAuth. */
export default function useAdminEvents(params) {
  const { fetchWithAuth } = useAuth()
  return useEventPage((p) => getAdminEvents(fetchWithAuth, p), params)
}
