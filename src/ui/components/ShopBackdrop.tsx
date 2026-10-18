import type { ReactNode } from 'react'
import { Sky } from './Sky'

type Props = { minutes: number; children?: ReactNode; label?: string }

/** Khung cảnh tiệm: trời theo giờ, đồi, mái ngói, quầy gỗ. Thứ đặt vào `children` nằm giữa mái ngói và quầy. */
export function ShopBackdrop({ minutes, children, label = 'Quầy tiệm' }: Props) {
  return (
    <section className="clay relative h-[168px] shrink-0 overflow-hidden p-0!" aria-label={label}>
      <Sky minutes={minutes}>
        <div className="absolute inset-x-0 bottom-[44px] h-[52px] rounded-t-[50%] bg-[#a9cf8f]" />
        <div className="absolute inset-x-[-20px] bottom-[44px] h-[34px] rounded-t-[50%] bg-[#8dbd76]" />
      </Sky>
      <div className="awning absolute inset-x-0 top-0" />
      {children}
      <div className="absolute inset-x-0 bottom-0 h-[46px] rounded-t-[18px] bg-wood shadow-[inset_0_4px_0_rgb(255_255_255/0.25),inset_0_-8px_0_var(--color-wood-deep)]" />
    </section>
  )
}
