/**
 * Chuyển động dùng chung, mức vừa phải: chỉ để báo "cái gì vừa xuất hiện" và "cái gì vừa đổi".
 * HomePage bọc toàn trang trong MotionConfig reducedMotion="user": khi hệ điều hành bật giảm chuyển động,
 * Framer Motion bỏ các chuyển động dịch, xoay, phóng to nhưng vẫn giữ hiện dần (opacity) và đổi màu.
 */

export const EASE_OUT = [0.22, 1, 0.36, 1]

/** Hiện dần và trồi lên 16px. */
export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
}

/** Cho các phần tử con hiện lần lượt. */
export const stagger = (gap = 0.08, delay = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
})

/** Hiện khi cuộn tới, chỉ chạy một lần. */
export const inView = { initial: 'hidden', whileInView: 'show', viewport: { once: true, amount: 0.2 } }

/** Nút lún nhẹ khi bấm. */
export const press = { whileTap: { scale: 0.97 } }
