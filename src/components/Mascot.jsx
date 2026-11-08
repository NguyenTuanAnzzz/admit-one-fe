import { m } from 'framer-motion'

/**
 * Linh vật người que của Admit One, vẽ bằng SVG theo phong cách poster của trang:
 * đầu tròn đen, tay chân nét đen bo đầu, nhạc cụ cam san hô, cuống vé xanh và cam.
 * Chỉ để trang trí: luôn aria-hidden. Nhún nhẹ lên xuống; MotionConfig reducedMotion="user" của trang chủ
 * tự bỏ chuyển động này khi máy bật giảm chuyển động.
 */

const INK = '#1d1a17'
const CORAL = '#cf3a20'
const CORAL_SOFT = '#e8734f'
const SALMON = '#f2a07b'
const GREEN = '#5e8f6b'

const limb = { fill: 'none', stroke: INK, strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round' }

// Thân người: hình áo bo góc, không phải một nét que, giống ảnh mẫu
const Torso = ({ x = 51, y = 45, w = 18, h = 46 }) => <rect x={x} y={y} width={w} height={h} rx={8} fill={INK} />
const Head = ({ cx = 60, cy = 30, r = 13 }) => <circle cx={cx} cy={cy} r={r} fill={INK} />

function Singer() {
  return (
    <>
      <Head />
      <Torso />
      {/* tay phải cầm micro đưa lên miệng, tay trái buông */}
      <path {...limb} d="M67 52 L82 62 L78 42" />
      <path {...limb} d="M53 52 L42 74 L40 92" />
      <path stroke={INK} strokeWidth="4" strokeLinecap="round" d="M76 40 L86 47" />
      <circle cx="72" cy="36" r="5" fill={CORAL} />
      <path {...limb} d="M55 88 L50 148 L42 148" />
      <path {...limb} d="M65 88 L72 148 L80 148" />
    </>
  )
}

function Guitarist() {
  return (
    <>
      <Head />
      <Torso />
      <path {...limb} d="M55 88 L42 148 L34 148" />
      <path {...limb} d="M65 88 L80 148 L88 148" />
      {/* đàn guitar cam: thân, lỗ đàn, cần đàn */}
      <g transform="rotate(-28 58 86)">
        <ellipse cx="54" cy="86" rx="17" ry="12" fill={CORAL} />
        <ellipse cx="54" cy="86" rx="4" ry="3" fill={INK} />
        <rect x="68" y="83" width="36" height="5" rx="2" fill={INK} />
        <rect x="102" y="80" width="8" height="11" rx="2" fill={INK} />
      </g>
      <path {...limb} d="M53 52 L66 70 L90 62" />
      <path {...limb} d="M67 54 L62 76 L52 88" />
    </>
  )
}

function Dancer() {
  return (
    <>
      <Head cx={62} cy={30} />
      <circle cx="73" cy="20" r="5" fill={INK} />
      {/* hai tay giơ cao, váy xoè, một chân đá ra sau */}
      <path {...limb} d="M54 50 L42 32 L36 14" />
      <path {...limb} d="M70 50 L84 36 L94 24" />
      <path fill={INK} d="M54 44 h16 l12 52 h-40z" />
      <path {...limb} d="M56 96 L54 148 L46 148" />
      <path {...limb} d="M68 96 L82 122 L98 116" />
    </>
  )
}

function Drummer() {
  return (
    <>
      <Head cx={46} cy={46} />
      <Torso x={37} y={60} h={40} />
      {/* hai tay cầm dùi gõ trống */}
      <path {...limb} d="M53 68 L68 80" />
      <path stroke={INK} strokeWidth="3" strokeLinecap="round" d="M68 80 L84 66" />
      <path {...limb} d="M41 70 L58 92" />
      <path stroke={INK} strokeWidth="3" strokeLinecap="round" d="M58 92 L76 94" />
      {/* lá cymbal và chân đứng */}
      <ellipse cx="100" cy="88" rx="15" ry="3.5" fill={CORAL_SOFT} />
      <path stroke={INK} strokeWidth="3" d="M100 90 V148 M92 148 L100 136 L108 148" fill="none" />
      {/* trống cái cam viền đen */}
      <circle cx="68" cy="122" r="25" fill={CORAL} stroke={INK} strokeWidth="5" />
      <circle cx="68" cy="122" r="9" fill="none" stroke={INK} strokeWidth="2" opacity=".5" />
    </>
  )
}

/** Linh vật chính: vẫy tay, tay kia giơ cuống vé xanh */
function TicketHolder() {
  return (
    <>
      <Head />
      <Torso />
      <path {...limb} d="M67 52 L84 40 L92 22" />
      <path {...limb} d="M53 52 L40 66 L30 56" />
      <g transform="rotate(-18 22 50)">
        <rect x="2" y="38" width="38" height="22" rx="3" fill={GREEN} />
        <circle cx="2" cy="49" r="4" fill="#fff" />
        <circle cx="40" cy="49" r="4" fill="#fff" />
        <path d="M14 38 V60" stroke="#fff" strokeWidth="1.5" strokeDasharray="2 2" />
        <path d="M20 45 h14 M20 50 h10 M20 55 h12" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      <path {...limb} d="M55 88 L50 148 L42 148" />
      <path {...limb} d="M65 88 L72 148 L80 148" />
    </>
  )
}

const POSES = { singer: Singer, guitarist: Guitarist, dancer: Dancer, drummer: Drummer, ticket: TicketHolder }

/**
 * pose: singer | guitarist | dancer | drummer | ticket. delay lệch nhịp nhún để nhiều linh vật đứng cạnh nhau không nhún cùng lúc.
 * className đặt kích thước, ví dụ "h-24 w-auto".
 */
export function Mascot({ pose = 'singer', delay = 0, className = '' }) {
  const Pose = POSES[pose] ?? Singer
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 120 160" className={`overflow-visible ${className}`}>
      <m.g animate={{ y: [0, -4, 0] }} transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity, delay }}>
        <Pose />
      </m.g>
    </svg>
  )
}

/** Cuống vé bay lơ lửng như trong poster: xanh hoặc cam, xoay nghiêng. notch: màu nền chỗ đặt vé, để hai lỗ bấm hai đầu trông như khoét thủng */
export function FloatingTicket({ color = 'green', rotate = -15, delay = 0, notch = '#ffffff', className = '' }) {
  const fill = color === 'green' ? GREEN : SALMON
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 64 36" className={className}>
      <m.g
        style={{ originX: '50%', originY: '50%' }}
        initial={{ rotate }}
        animate={{ y: [0, -5, 0], rotate: [rotate, rotate + 6, rotate] }}
        transition={{ duration: 3.2, ease: 'easeInOut', repeat: Infinity, delay }}
      >
        <rect x="2" y="4" width="60" height="28" rx="3" fill={fill} />
        <circle cx="2" cy="18" r="5" fill={notch} />
        <circle cx="62" cy="18" r="5" fill={notch} />
        <path d="M18 4 V32" stroke={INK} strokeWidth="1.2" strokeDasharray="2 2" opacity=".5" />
        <path d="M26 12 h26 M26 18 h18 M26 24 h22" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity=".55" />
      </m.g>
    </svg>
  )
}

/** Nốt nhạc đen bay lên */
export function FloatingNote({ delay = 0, className = '' }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 32 40" className={className}>
      <m.g animate={{ y: [0, -6, 0] }} transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity, delay }}>
        <path d="M12 30 V6 l14 -3 v22" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="8" cy="31" rx="6" ry="4.5" fill={INK} />
        <ellipse cx="22" cy="26" rx="6" ry="4.5" fill={INK} />
      </m.g>
    </svg>
  )
}
