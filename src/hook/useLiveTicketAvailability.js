import { useEffect, useRef, useState } from 'react'
import { liveClient, onLiveConnect } from '../lib/liveClient'

/**
 * Bài 5.3 + bài 21 của khoá: nghe /topic/events/{eventId}/tickets, ghép với "ảnh chụp" ban đầu
 * (version) để số vé hiển thị luôn đúng, kể cả khi mất mạng, kết nối lại, hay tin đến sai thứ tự.
 *
 * eventId:  sự kiện đang xem. null thì không làm gì (trang khác, hoặc chưa tải xong sự kiện).
 * version:  "ticketsVersion" lấy từ chính response GET /api/events/{id} (useEventDetail đã có).
 *           null nghĩa là CHƯA biết — mọi tin realtime đến trong lúc này chỉ được XẾP HÀNG CHỜ,
 *           không áp ngay, để tránh một tin cũ ghi đè lên dữ liệu mới hơn từ API.
 * onGap:    gọi khi phát hiện lỡ tin (seq nhảy cóc). Nơi gọi nên tự tải lại snapshot mới
 *           (reload() có sẵn trong useEventDetail) — đúng nguyên tắc 3 của bài 21.
 *
 * Trả về { available, live }:
 *   available: { [ticketId]: số còn lại } — CHỈ chứa những vé đã có tin cập nhật, còn lại lấy từ
 *              snapshot ban đầu (useEventDetail tự merge theo đúng id, nên vé của sự kiện cũ
 *              không bao giờ khớp nhầm sang sự kiện mới dù available chưa kịp dọn).
 *   live:      đang kết nối WebSocket hay không, để hiển thị "đang cập nhật trực tiếp".
 */
export default function useLiveTicketAvailability(eventId, version, onGap) {
  const [available, setAvailable] = useState({})
  const [live, setLive] = useState(false)

  // version hiện đã biết tới đâu, và các tin đến TRƯỚC khi biết version thì xếp tạm ở đây.
  // Đây là trạng thái của một kết nối WebSocket đang sống — một "hệ thống ngoài" theo đúng nghĩa
  // của docs React, nên đọc/ghi nó chỉ làm trong effect hoặc callback, không làm lúc render.
  const state = useRef({ version: null, buffer: [] })

  function apply(msg) {
    const s = state.current
    if (s.version != null) {
      if (msg.seq <= s.version) return // tin cũ hoặc trùng: bỏ qua, không làm gì sai cả
      if (msg.seq > s.version + 1) onGap?.() // nhảy cóc: đã lỡ ít nhất một tin ở giữa
    }
    s.version = s.version == null ? msg.seq : Math.max(s.version, msg.seq)
    setAvailable((prev) => {
      const next = { ...prev }
      for (const c of msg.changes) next[c.ticketId] = c.available
      return next
    })
  }

  // Đổi sự kiện: quên version/buffer cũ, bắt đầu lại từ đầu cho sự kiện mới.
  // Vé của sự kiện cũ và sự kiện mới có id khác nhau nên không cần dọn "available": các khoá cũ
  // đơn giản không bao giờ còn được dùng tới nữa khi tiers đổi sang danh sách vé của sự kiện mới.
  useEffect(() => {
    state.current = { version: null, buffer: [] }
  }, [eventId])

  // version vừa đến (API tải xong): xả các tin đã xếp hàng, chỉ áp tin MỚI HƠN version đó
  useEffect(() => {
    if (version == null) return
    const s = state.current
    s.version = version
    const pending = s.buffer.filter((m) => m.seq > version).sort((a, b) => a.seq - b.seq)
    s.buffer = []
    pending.forEach(apply)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version])

  // Subscribe kênh của sự kiện. Chạy lại mỗi khi đổi sự kiện HOẶC kết nối lại sau khi rớt mạng
  useEffect(() => {
    if (!eventId) return
    let sub = null

    const off = onLiveConnect(() => {
      setLive(true)
      // Đổi sự kiện trong lúc đã có kết nối (điều hướng giữa hai trang chi tiết) vẫn phải subscribe lại
      sub = liveClient.subscribe(`/topic/events/${eventId}/tickets`, (frame) => {
        const msg = JSON.parse(frame.body)
        const s = state.current
        if (s.version == null) s.buffer.push(msg) // chưa biết snapshot: xếp hàng (bài 21, bước 2-3)
        else apply(msg)
      })
    })

    // Lưu ý: gán thẳng vào thuộc tính của client dùng chung — đủ cho một trang hiển thị tại một
    // thời điểm. Nhiều khu vực cùng cần biết trạng thái kết nối thì nên đổi sang cơ chế listener
    // giống onLiveConnect ở trên thay vì ghi đè onWebSocketClose kiểu này.
    liveClient.onWebSocketClose = () => setLive(false)

    return () => {
      off()
      sub?.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  return { available, live }
}
