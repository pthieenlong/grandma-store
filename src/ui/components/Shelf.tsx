import { motion } from 'motion/react'
import { content } from '../../content'
import { game } from '../../controllers'
import type { ItemId, Tray } from '../../engine/types'
import { useStore } from '../../hooks/useStore'
import { ItemIcon } from './ItemIcon'

type Props = { tray: Tray; onAdd: (id: ItemId) => void; onOpenRestock: () => void }

/** Kệ hàng: chạm món để bỏ vào khay. Chỉ render lại khi kho hoặc khay đổi, không theo nhịp đồng hồ. */
export function Shelf({ tray, onAdd, onOpenRestock }: Props) {
  const inventory = useStore(game, (s) => s.inventory)

  return (
    <section className="flex flex-col gap-3" aria-label="Kệ hàng">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[18px] leading-none font-bold">Kệ hàng</h2>
        <button type="button" onClick={onOpenRestock} className="btn-3d btn-sun h-9 rounded-xl! px-3 text-[14px]">
          Nhập thêm
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {Object.values(content.items).map((item) => {
          const stock = inventory[item.id] ?? 0
          const inTray = tray[item.id] ?? 0
          const left = stock - inTray
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onAdd(item.id)}
              disabled={left <= 0}
              aria-label={`${item.name}, còn ${stock}${inTray ? `, trong khay ${inTray}` : ''}`}
              className="btn-3d btn-soft relative flex min-h-[56px] items-center gap-1 rounded-2xl! py-1.5 pr-1.5 pl-1 text-left font-body!"
            >
              {/* Icon bên trái chữ (không xếp trên dưới) để nút giữ nguyên chiều cao, 3 hàng kệ vẫn vừa màn 844px */}
              <ItemIcon id={item.id} className={`size-8 ${stock === 0 ? 'opacity-50 grayscale' : ''}`} />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[12px] leading-tight font-semibold">{item.name}</span>
                <span className={`text-[11px] font-medium tabular-nums ${stock === 0 ? 'text-tile-deep' : 'text-ink-soft'}`}>
                  {stock === 0 ? 'hết hàng' : `còn ${left}`}
                </span>
              </span>
              {inTray > 0 && (
                <motion.span
                  key={inTray}
                  initial={{ scale: 0.4 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 18 }}
                  className="absolute -top-2 -right-1.5 grid min-w-6 place-items-center rounded-full bg-leaf px-1.5 py-0.5 font-display text-[13px] leading-none font-bold text-white shadow-[0_2px_0_var(--color-leaf-deep)]"
                >
                  {inTray}
                </motion.span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
