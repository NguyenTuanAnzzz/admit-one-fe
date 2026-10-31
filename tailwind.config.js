/**
 * Design tokens của Admit One, 3 lớp. Nạp vào Tailwind qua `@config` trong src/index.css.
 *
 *   primitive  giá trị gốc
 *   semantic   vai trò của màu, chỉ tham chiếu primitive
 *   component  màu riêng của từng thành phần, chỉ tham chiếu semantic
 *
 * Hướng thiết kế: sàn thương mại điện tử nền sáng. Nền xám ấm rất nhạt, thẻ trắng, một màu cam san hô
 * cho nút mua và giá vé, xanh lá cho trạng thái còn vé. Màu pha riêng, không dùng bảng màu mặc định của Tailwind.
 * Hướng này do người dùng chọn, ghi đè design.md. Mọi cặp chữ/nền đã đo đạt WCAG AA.
 */

const primitive = {
  linen: '#f6f5f3', // nền trang
  white: '#ffffff',
  sand: '#efede9', // nền phụ, skeleton
  rule: '#e4e1dc',
  ruleStrong: '#c9c4bc',
  ink: '#1d1a17',
  inkSoft: '#67615b', // chữ phụ, 5.61:1 trên nền trang
  coral: '#cf3a20', // chữ trắng trên nền này 4.91:1; chính nó trên nền trang 4.5:1, trên trắng cao hơn
  coralDark: '#b2331c',
  coralWash: '#fdebe6', // coralDark trên nền này 5.38:1
  leaf: '#177245', // trên leafWash 5.27:1
  leafWash: '#e8f4ec',
  scrim: 'rgba(29, 26, 23, 0.5)',
  cream: '#f2e4d1', // nền giấy của tranh public/banner-auth-form.jpeg, đo trực tiếp từ ảnh
}

const p = primitive
const semantic = {
  canvas: p.linen,
  surface: p.white,
  'surface-sunken': p.sand,
  inverse: p.ink,
  title: p.ink,
  fg: p.ink,
  'fg-muted': p.inkSoft,
  'fg-placeholder': p.inkSoft,
  'fg-inverse': p.white,
  line: p.rule,
  'line-strong': p.ruleStrong,
  action: p.coral,
  'action-hover': p.coralDark,
  'action-fg': p.coralDark,
  'action-subtle': p.coralWash,
  brand: p.coral,
  success: p.leaf,
  'success-subtle': p.leafWash,
  danger: p.coralDark,
  'danger-subtle': p.coralWash,
  focus: p.ink,
  overlay: p.scrim,
}

const s = semantic
const component = {
  'button-primary': s.action,
  'button-primary-hover': s['action-hover'],
  'button-primary-fg': s['fg-inverse'],
  'button-secondary-line': s['line-strong'],
  'button-secondary-fg': s.fg,
  'button-secondary-hover': s['surface-sunken'],
  'button-disabled': s['surface-sunken'],
  'button-disabled-fg': s['fg-muted'],

  'search-submit': s.action,
  'search-submit-fg': s['fg-inverse'],
  'input-line': s['line-strong'],
  'input-line-invalid': s.danger,

  card: s.surface,
  'card-line': s.line,
  'card-line-hover': s['line-strong'],
  thumb: s['surface-sunken'],
  'thumb-fg': s.title,
  badge: s.surface,
  'badge-line': s.line,
  'badge-fg': s.fg,
  'status-on-sale': s['success-subtle'],
  'status-on-sale-fg': s.success,
  'status-upcoming': s['action-subtle'],
  'status-upcoming-fg': s['action-fg'],
  'status-sold-out': s['surface-sunken'],
  'status-sold-out-fg': s['fg-muted'],
  'chip-active': s.action,
  'chip-active-fg': s['fg-inverse'],
  'chip-active-line': s.action,

  ticket: s.surface,
  'ticket-perforation': s['line-strong'],
  qr: s.title,

  'zone-vip': s.inverse,
  'zone-vip-fg': s['fg-inverse'],
  'zone-a': s['surface-sunken'],
  'zone-a-fg': s.fg,
  'zone-b': s.surface,
  'zone-b-fg': s.fg,
  'zone-b-line': s.line,
  'zone-c': s.canvas,
  'zone-c-fg': s['fg-muted'],
  'zone-c-line': s['line-strong'],
  'zone-selected': s.action,
  stage: s.inverse,
  'stage-fg': s['fg-inverse'],
  meter: s.action,

  countdown: s['action-subtle'],
  'countdown-fg': s['action-fg'],
  'timer-urgent-fg': s.danger,
  avatar: s['surface-sunken'],
  'avatar-fg': s.title,

  // Trang đăng ký: nền khung ảnh trong lúc tranh đang tải, trùng nền giấy của tranh nên không bị nháy màu
  'auth-art': p.cream,
}

/** [cỡ chữ, { lineHeight, letterSpacing }] */
const type = (size, lineHeight, letterSpacing = '0') => [size, { lineHeight, letterSpacing }]

/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      ...semantic,
      ...component,
    },
    fontFamily: {
      // Nội dung: Inter, dễ đọc ở cỡ nhỏ, có dấu tiếng Việt
      sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      // Tiêu đề, ngày, giá: Bricolage Grotesque, nét có cá tính như chữ trên poster live show, có dấu tiếng Việt
      display: ['"Bricolage Grotesque"', 'Inter', 'ui-sans-serif', 'sans-serif'],
    },
    extend: {
      fontSize: {
        caption: type('12px', '1.45'),
        'body-sm': type('14px', '1.5'),
        body: type('16px', '1.55'),
        subheading: type('18px', '1.4'),
        'heading-sm': type('24px', '1.2', '-0.01em'),
        heading: type('32px', '1.1', '-0.02em'),
        'heading-lg': type('44px', '1', '-0.025em'),
        display: type('60px', '0.98', '-0.03em'),
      },
      borderRadius: {
        input: '8px',
        overlay: '16px',
        badge: '999px',
        card: '14px',
        nav: '999px',
        pill: '999px',
      },
      boxShadow: {
        // Bóng nhẹ khi rê chuột lên thẻ: thẻ "nhấc lên" như sản phẩm trên sàn
        'card-hover': '0 10px 24px -12px rgba(29, 26, 23, 0.22)',
        'notch-left': `inset -1px 0 0 ${p.rule}`,
        'notch-right': `inset 1px 0 0 ${p.rule}`,
      },
      spacing: {
        gutter: '16px',
        card: '16px',
        'section-sm': '40px',
        section: '64px',
      },
      maxWidth: {
        page: '1240px',
      },
    },
  },
}
