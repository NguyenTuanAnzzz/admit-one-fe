import { Client } from '@stomp/stompjs'

// VITE_API_URL="http://localhost:8080/api" → bỏ "/api" ở cuối, đổi http(s) thành ws(s), thêm "/ws"
// (đúng endpoint đã khai báo trong WebSocketConfig.addEndpoint("/ws") ở backend)
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'
const WS_URL = API_URL.replace(/\/api\/?$/, '').replace(/^http/, 'ws') + '/ws'

// Nhiều component (nhiều trang chi tiết sự kiện mở/đóng theo điều hướng) cùng dùng CHUNG một
// kết nối WebSocket, thay vì mỗi trang tự mở một kết nối riêng (bài 13 của khoá: đỡ tốn kết nối, tốn thread).
const listeners = new Set()

export const liveClient = new Client({
  brokerURL: WS_URL,
  reconnectDelay: 2000, // học đơn giản: chờ cố định 2 giây. Nhiều kết nối cùng lúc thì cần jitter (bài 23)
  heartbeatIncoming: 10000,
  heartbeatOutgoing: 10000,
})

liveClient.onConnect = () => listeners.forEach((fn) => fn())

/**
 * Đăng ký một hàm chạy MỖI LẦN kết nối (lần đầu, và mỗi lần kết nối lại sau khi rớt mạng).
 * Trả về hàm huỷ đăng ký. Bài 21: phải subscribe lại từ đầu sau mỗi lần kết nối lại, vì kênh
 * subscribe cũ gắn với kết nối WebSocket cũ, không tự theo sang kết nối mới.
 */
export function onLiveConnect(fn) {
  listeners.add(fn)
  if (liveClient.connected) fn()
  if (!liveClient.active) liveClient.activate()
  return () => listeners.delete(fn)
}
