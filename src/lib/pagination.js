/**
 * Số trang hiện trên thanh phân trang (đếm từ 0): trang đầu, trang cuối, 2 trang quanh trang hiện tại,
 * chỗ bị cắt là một mục "gap-N" để vẽ dấu "…". Ví dụ trang 5 trên 12: [0, gap, 4, 5, 6, gap, 11]
 */
export function pageWindow(current, total) {
  const pages = new Set([0, total - 1, current - 1, current, current + 1].filter((p) => p >= 0 && p < total))
  const sorted = [...pages].sort((a, b) => a - b)
  const out = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('gap-' + p)
    out.push(p)
  })
  return out
}
