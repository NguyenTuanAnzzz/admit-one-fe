import { SectionHeading } from './ui'

/** Câu hỏi lấy từ các tình huống trong spec.md (giữ ghế, phòng chờ, giới hạn vé, trả tiền muộn, check-in). */
const ITEMS = [
  {
    q: 'Hết 10 phút mà tôi chưa thanh toán xong thì sao?',
    a: 'Ghế tự trở lại sơ đồ cho người khác chọn và đơn chuyển sang “Hết hạn giữ ghế”. Bạn chưa bị trừ tiền. Muốn mua tiếp thì chọn lại ghế còn trống.',
  },
  {
    q: 'Tôi đã trả tiền đúng lúc hết hạn giữ ghế. Tôi có mất tiền không?',
    a: 'Không. Nếu ghế vẫn còn trống, hệ thống vẫn xuất vé cho bạn. Nếu ghế đã có người khác giữ hoặc mua, đơn được đánh dấu chờ hoàn tiền và bạn nhận email báo ngay.',
  },
  {
    q: 'Vì sao tôi phải xếp hàng trong phòng chờ?',
    a: 'Lúc mở bán có hàng nghìn người vào cùng lúc. Phòng chờ cho từng lượt vào trang chọn ghế để trang không bị sập. Màn hình phòng chờ cho biết bạn đang đứng thứ mấy.',
  },
  {
    q: 'Mở nhiều tab hoặc nhiều trình duyệt có giúp vào nhanh hơn không?',
    a: 'Không. Lượt vào gắn với tài khoản chứ không gắn với tab, nên mỗi tài khoản chỉ có một vị trí trong hàng.',
  },
  {
    q: 'Một tài khoản mua được bao nhiêu vé?',
    a: 'Tối đa 4 vé cho mỗi sự kiện, tính cả các đơn đang giữ ghế. Tài khoản cần xác thực email trước khi mua.',
  },
  {
    q: 'Tôi có cần in vé không?',
    a: 'Không cần. Trình mã QR trên điện thoại ở cổng. Mỗi ghế có một mã riêng, nên nếu mua cho bạn bè, bạn có thể gửi từng vé cho từng người. Mã đã quét một lần thì không dùng lại được.',
  },
]

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-tieu-de" className="px-gutter pb-section-sm md:pb-section">
      <div className="mx-auto max-w-page">
        <SectionHeading id="faq-tieu-de" title="Câu hỏi thường gặp" />
        <div className="mt-6 divide-y divide-line border-y border-line">
          {ITEMS.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex min-h-14 items-center justify-between gap-6 py-4 text-body font-semibold text-title decoration-1 underline-offset-4 hover:underline">
                {item.q}
                <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 shrink-0 transition-transform group-open:rotate-45" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M8 3v10M3 8h10" />
                </svg>
              </summary>
              <p className="max-w-[62ch] pb-5 text-body text-fg-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
