/** Các mảnh giao diện dùng lại (nút nằm ở Button.jsx, ô nhập ở TextField.jsx): tiêu đề section, đường răng cưa của vé, mã QR minh hoạ. */

export function SectionHeading({ id, title, children }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <h2 id={id} className="font-display text-heading-sm font-bold text-title md:text-heading">
        {title}
      </h2>
      {children}
    </div>
  )
}

/** Đường xé của vé giấy: nét đứt + hai khuyết tròn ở mép. notchClass phải trùng màu nền phía sau tấm vé. */
export function Perforation({ notchClass = 'bg-canvas' }) {
  return (
    <div aria-hidden="true" className="relative h-4">
      <span className={`absolute top-1/2 -left-2 size-4 -translate-y-1/2 rounded-full ${notchClass} shadow-notch-left`} />
      <span className="absolute top-1/2 right-3 left-3 border-t border-dashed border-ticket-perforation" />
      <span className={`absolute top-1/2 -right-2 size-4 -translate-y-1/2 rounded-full ${notchClass} shadow-notch-right`} />
    </div>
  )
}

/** Hoa văn trang trí mô phỏng mã QR trên vé mẫu. Không phải mã thật, nên ẩn với trình đọc màn hình. */
export function QrPattern({ seed = 'ADM', size = 21, className = '' }) {
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const cells = []
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inFinder = (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7)
      if (inFinder) continue
      h = (h * 1103515245 + 12345) >>> 0
      if ((h >>> 16) & 1) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />)
    }
  }
  const finder = (x, y) => (
    <g key={`f-${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" />
      <rect x={x + 1} y={y + 1} width="5" height="5" className="fill-ticket" />
      <rect x={x + 2} y={y + 2} width="3" height="3" />
    </g>
  )
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${size} ${size}`} className={`fill-qr ${className}`} shapeRendering="crispEdges">
      {finder(0, 0)}
      {finder(size - 7, 0)}
      {finder(0, size - 7)}
      {cells}
    </svg>
  )
}
