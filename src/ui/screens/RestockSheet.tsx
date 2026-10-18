import { motion } from 'motion/react'
import { content } from '../../content'
import { game } from '../../controllers'
import { useStore } from '../../hooks/useStore'
import { PatienceBar } from '../components/PatienceBar'
import { money } from '../format'

type Props = { onClose: () => void }

/** Màn nhập hàng KHÔNG dừng đồng hồ: khách đang chờ vẫn mất kiên nhẫn. */
export function RestockSheet({ onClose }: Props) {
  const cash = useStore(game, (s) => s.money)
  const inventory = useStore(game, (s) => s.inventory)

  return (
    // Phải nằm trong <AnimatePresence> ở App thì lúc đóng mới có animation trượt xuống
    <motion.div
      className="fixed inset-0 z-20 flex flex-col justify-end bg-ink/35"
      role="dialog"
      aria-modal="true"
      aria-labelledby="restock-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button type="button" className="flex-1" aria-label="Đóng màn nhập hàng" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        className="mx-auto flex max-h-[86%] w-full max-w-[440px] flex-col gap-4 rounded-t-[32px] bg-paper px-[max(16px,env(safe-area-inset-left,0px))] pt-5 pb-[max(20px,env(safe-area-inset-bottom,0px))] shadow-[0_-10px_30px_-10px_rgb(74_52_38/0.5)]">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="restock-title" className="font-display text-[24px] leading-none font-extrabold">
              Nhập hàng
            </h2>
            <p className="mt-1 text-[13px] text-ink-soft tabular-nums">Tiền mặt: {money(cash)}</p>
          </div>
          <button type="button" onClick={onClose} className="btn-3d h-11 px-4 text-[15px]">
            Quay lại quầy
          </button>
        </div>

        <WaitingBanner />

        <ul className="-mx-1 flex flex-col gap-3 overflow-y-auto px-1 pb-2">
          {Object.values(content.items).map((item) => {
            const stock = inventory[item.id] ?? 0
            return (
              <li key={item.id} className="clay flex items-center gap-3 rounded-[22px]! p-3">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#f1e2c4] font-display text-[13px] font-bold text-ink-soft shadow-[inset_0_-3px_0_var(--color-card-edge)]" aria-hidden="true">
                  {item.name.split(' ')[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold">{item.name}</p>
                  <p className="text-[12px] text-ink-soft tabular-nums">Nhập {money(item.buyPrice)}</p>
                  <p className="text-[12px] text-ink-soft tabular-nums">
                    Bán {money(item.sellPrice)} · Kho <b className={stock === 0 ? 'text-tile-deep' : 'text-ink'}>{stock}</b>
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {[1, 5].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      disabled={item.buyPrice * qty > cash}
                      onClick={() => game.restock(item.id, qty)}
                      className={`btn-3d h-11 w-12 rounded-2xl! text-[15px] ${qty === 1 ? 'btn-soft' : ''}`}
                      aria-label={`Nhập ${qty} ${item.name}`}
                    >
                      +{qty}
                    </button>
                  ))}
                </div>
              </li>
            )
          })}
        </ul>
      </motion.div>
    </motion.div>
  )
}

/** Nhắc có khách đang chờ ở quầy. Tách riêng để mỗi nhịp đồng hồ chỉ vẽ lại dải này, không vẽ lại cả danh sách hàng. */
function WaitingBanner() {
  const customer = useStore(game, (s) => (s.current?.status === 'waiting' ? s.current.visit.customer : null))
  if (!customer) return null
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#fdebc4] px-3.5 py-2.5 shadow-[inset_0_-3px_0_#ecd29a]">
      <span className="shrink-0 text-[13px] font-semibold text-[#7c5410]">{customer} đang chờ</span>
      <PatienceBar className="flex-1" fill="bg-sun-deep" />
    </div>
  )
}
