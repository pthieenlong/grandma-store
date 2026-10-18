import type { ReactNode } from 'react'
import { CLOSE_HOUR, OPEN_HOUR } from '../../engine/config'

/** 0 khi x <= from, 1 khi x >= to, ở giữa thì tăng đều. */
function ramp(x: number, from: number, to: number) {
  return Math.min(1, Math.max(0, (x - from) / (to - from)))
}

const h = (hour: number) => hour * 60

/**
 * Pha màu trời bằng color-mix trong không gian oklch.
 * Không chồng lớp opacity: cam phủ mờ lên xanh ngọc (pha kiểu sRGB) sẽ ra màu xám đục,
 * còn oklch đi vòng qua sắc độ nên chuyển màu vẫn tươi.
 */
const skyColor = (dawn: number, dusk: number) =>
  `color-mix(in oklch, var(--color-sky-dawn) ${dawn * 100}%, color-mix(in oklch, var(--color-sky-dusk) ${dusk * 100}%, var(--color-sky)))`

type Props = {
  minutes: number // giờ trong game, số phút kể từ 0:00
  children?: ReactNode // cảnh vật (đồi, cây) nằm giữa trời và lớp chạng vạng
}

/**
 * Bầu trời sau ô cửa, đổi theo giờ: rạng sáng → trưa → chiều tà → chạng vạng.
 * Màu vẫn nằm trong token CSS, chỗ này chỉ quyết định pha bao nhiêu phần mỗi màu.
 */
export function Sky({ minutes, children }: Props) {
  const dawn = 1 - ramp(minutes, h(6), h(8.5))
  const dusk = ramp(minutes, h(16), h(18.5))
  const night = 0.55 * ramp(minutes, h(18), h(20))

  // Mặt trời đi theo vòng cung từ trái sang phải, thấp nhất lúc mở và đóng cửa
  const t = ramp(minutes, h(OPEN_HOUR), h(CLOSE_HOUR))
  const sunLeft = 8 + t * 84 // % chiều ngang
  const sunTop = 78 - Math.sin(Math.PI * t) * 46 // px

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <div className="sky-layer absolute inset-0" style={{ backgroundColor: skyColor(dawn, dusk) }} />
      <div
        className="sky-layer absolute size-7 -translate-x-1/2 rounded-full bg-sun shadow-[0_0_0_6px_color-mix(in_srgb,var(--color-sun)_30%,transparent)]"
        style={{ left: `${sunLeft}%`, top: sunTop }}
      />
      {children}
      {/* Lớp chạng vạng phủ cả đồi; nhân vật và quầy nằm trên lớp này nên vẫn sáng như có đèn trong tiệm */}
      <div className="sky-layer absolute inset-0 bg-sky-night" style={{ opacity: night }} />
    </div>
  )
}
