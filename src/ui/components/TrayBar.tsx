import { AnimatePresence, motion } from 'motion/react'
import { content } from '../../content'
import type { ItemId, Tray } from '../../engine/types'

type Props = { tray: Tray; onRemove: (id: ItemId) => void }

/** Khay hàng đang gom; chạm chip để bớt 1. Không đọc store: khay là state tạm của UI. */
export function TrayBar({ tray, onRemove }: Props) {
  const entries = Object.entries(tray).filter(([, qty]) => qty > 0)

  return (
    <section className="clay relative flex min-h-[56px] flex-wrap items-center gap-2 rounded-[22px]! px-4 py-3" aria-label="Khay hàng">
      <span className="text-[13px] font-semibold text-ink-soft">Khay:</span>
      {entries.length === 0 && <span className="text-[13px] text-ink-soft">chạm vào món trên kệ để bỏ vào đây</span>}
      {/* popLayout: chip bị bớt hết thì rút ra khỏi dòng ngay (position absolute, nên section phải có `relative`),
          các chip còn lại không phải chờ nó thu nhỏ xong */}
      <AnimatePresence mode="popLayout">
        {entries.map(([id, qty]) => (
          <motion.button
            key={id}
            type="button"
            onClick={() => onRemove(id)}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            // Lúc biến mất dùng tween 150ms: spring dừng theo vận tốc nên đuôi kéo dài gần 1 giây, chip "ma" đứng lơ lửng
            exit={{ scale: 0.5, opacity: 0, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className="rounded-full bg-[#eef5e6] px-3 py-1 text-[13px] font-semibold text-leaf-deep shadow-[inset_0_-2px_0_#cfe2bf]"
            aria-label={`Bớt 1 ${content.items[id]?.name ?? id}`}
          >
            {content.items[id]?.name ?? id} × {qty}
          </motion.button>
        ))}
      </AnimatePresence>
    </section>
  )
}
