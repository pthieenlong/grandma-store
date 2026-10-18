import { motion } from 'motion/react'
import { game, profile } from '../../controllers'
import { useStore } from '../../hooks/useStore'
import { money, renderLine } from '../format'
import { selectSold, selectWrongCount } from '../selectors'
import { PatienceBar } from './PatienceBar'

/** Thẻ thoại: tên khách, câu đang nói, thanh kiên nhẫn hoặc số tiền vừa trả. */
export function DialogueCard() {
  const customer = useStore(game, (s) => s.current?.visit.customer)
  const line = useStore(game, (s) => s.current?.line)
  const waiting = useStore(game, (s) => s.current?.status === 'waiting')
  const wrongCount = useStore(game, selectWrongCount)
  const sold = useStore(game, selectSold)
  const me = useStore(profile, (p) => p)

  return (
    <section className="clay flex flex-col gap-2 px-5 py-4" aria-live="polite">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-[20px] leading-none font-bold">{customer}</h2>
        {waiting && (
          <div className="flex w-[130px] flex-col gap-1">
            <span className="text-right text-[12px] text-ink-soft">Kiên nhẫn</span>
            <PatienceBar />
          </div>
        )}
        {sold && !waiting && (
          <span className="font-display text-[18px] leading-none font-bold text-leaf-deep tabular-nums">+{money(sold.moneyDelta)}</span>
        )}
      </div>
      {/* key đổi theo câu thoại và số lần nhầm: mỗi câu mới (kể cả nhầm lần 2 với câu y hệt) đều hiện lại từ đầu */}
      <motion.p
        key={`${line}-${wrongCount}`}
        className="text-[16px] leading-relaxed"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {line && renderLine(line, me)}
      </motion.p>
    </section>
  )
}
