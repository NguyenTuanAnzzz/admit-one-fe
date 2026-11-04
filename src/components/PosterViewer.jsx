import { useEffect, useRef } from 'react'
import Viewer from 'viewerjs'
import 'viewerjs/dist/viewer.css'

// Bỏ bớt nút của Viewer.js, chỉ giữ phóng, thu, về cỡ gốc, xoay
const TOOLBAR = { zoomIn: 1, zoomOut: 1, oneToOne: 1, reset: 1, rotateLeft: 1, rotateRight: 1 }

/**
 * Ảnh poster bấm vào để xem lớn bằng Viewer.js (phóng to, kéo, xoay, Esc để đóng).
 * Ảnh nằm trong nút để bàn phím cũng mở được (Tab tới rồi Enter), không chỉ bấm chuột.
 * Đổi src (chọn ảnh khác) thì gọi update để Viewer đọc lại ảnh mới.
 */
export function PosterViewer({ src, alt, className = '' }) {
  const imgRef = useRef(null)
  const viewerRef = useRef(null)

  useEffect(() => {
    // Máy bật "giảm chuyển động": index.css ép transition về 0s, transitionend không bao giờ chạy,
    // Viewer.js chờ sự kiện đó mới nạp ảnh lớn nên kẹt ở nền tối. Tắt hiệu ứng của Viewer trong trường hợp này
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const viewer = new Viewer(imgRef.current, { navbar: false, title: false, toolbar: TOOLBAR, transition: !reduceMotion })
    viewerRef.current = viewer
    return () => {
      viewer.destroy()
      viewerRef.current = null
    }
  }, [])

  useEffect(() => {
    viewerRef.current?.update()
  }, [src])

  return (
    <button
      type="button"
      onClick={() => viewerRef.current?.show()}
      aria-label={`Xem lớn: ${alt}`}
      className={`group relative block overflow-hidden rounded-card border border-card-line bg-surface-sunken ${className}`}
    >
      {/* pointer-events-none: cú bấm rơi vào nút, chỉ mở Viewer một lần (Viewer.js cũng tự bắt click trên ảnh) */}
      <img ref={imgRef} src={src} alt={alt} className="pointer-events-none size-full object-cover" />
      <span aria-hidden="true" className="absolute right-2 bottom-2 rounded-pill bg-overlay px-2.5 py-1 text-caption font-semibold text-fg-inverse opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">
        Bấm để xem lớn
      </span>
    </button>
  )
}
