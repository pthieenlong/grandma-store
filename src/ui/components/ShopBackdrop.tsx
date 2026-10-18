import type { ReactNode } from 'react'
import counterImg from '../../assets/scene/counter.webp'
import shopImg from '../../assets/scene/shop.webp'

type Props = { minutes: number; children?: ReactNode; label?: string }

/** 0 khi x <= from, 1 khi x >= to, ở giữa thì tăng đều. */
function ramp(x: number, from: number, to: number) {
  return Math.min(1, Math.max(0, (x - from) / (to - from)))
}

const h = (hour: number) => hour * 60

/**
 * Khung cảnh tiệm: ảnh nền (gian tiệm nhìn ra ruộng), lớp màu theo giờ, khách (children), tủ kính phía trước.
 *
 * Ảnh vẽ sẵn ánh sáng ban ngày, nên cảm giác giờ giấc đến từ 3 lớp màu phủ lên bằng mix-blend-mode: multiply
 * (nhân màu: phủ màu cam lên ảnh thì ảnh ngả cam, chỗ trắng thành cam, chỗ tối vẫn tối), đậm nhạt theo giờ.
 * Khách đứng trên các lớp màu nên không bị tối theo, như có đèn trong tiệm.
 */
export function ShopBackdrop({ minutes, children, label = 'Quầy tiệm' }: Props) {
  const dawn = 0.7 * (1 - ramp(minutes, h(6), h(8.5)))
  const dusk = 0.75 * ramp(minutes, h(16), h(18.5))
  const night = 0.6 * ramp(minutes, h(18), h(20))

  return (
    <section className="clay relative h-[168px] shrink-0 overflow-hidden p-0!" aria-label={label}>
      <img src={shopImg} alt="" aria-hidden="true" draggable={false} className="absolute inset-0 size-full object-cover select-none" />
      <div className="sky-layer absolute inset-0 bg-sky-dawn mix-blend-multiply" style={{ opacity: dawn }} aria-hidden="true" />
      <div className="sky-layer absolute inset-0 bg-sky-dusk mix-blend-multiply" style={{ opacity: dusk }} aria-hidden="true" />
      <div className="sky-layer absolute inset-0 bg-sky-night mix-blend-multiply" style={{ opacity: night }} aria-hidden="true" />
      {children}
      {/* Tủ kính trước mặt khách; tối nhẹ theo chạng vạng cho khỏi sáng chói giữa cảnh đã tối */}
      <img
        src={counterImg}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="sky-layer pointer-events-none absolute inset-x-0 bottom-0 w-full select-none"
        style={{ filter: `brightness(${1 - 0.45 * night})` }}
      />
    </section>
  )
}
