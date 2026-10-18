import { motion } from 'motion/react'
import { content } from '../../content'
import { game, profile } from '../../controllers'
import { summarizeDay, todayStories } from '../../engine/game'
import { useStore } from '../../hooks/useStore'
import { money, renderLine, signedMoney } from '../format'

export function SummaryScreen() {
  // Buổi tối state không đổi theo đồng hồ, nên đọc nguyên state ở đây không tốn gì
  const state = useStore(game, (s) => s)
  const s = summarizeDay(state)
  const stories = todayStories(state, content)
  const isLast = state.day >= state.lastDay
  const me = useStore(profile, (p) => p)

  return (
    <motion.div className="flex flex-1 flex-col gap-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <header>
        <p className="text-[13px] text-ink-soft">Tối ngày {state.day}</p>
        <h1 className="font-display text-[30px] leading-tight font-extrabold text-balance">Đóng cửa tiệm</h1>
      </header>

      <section className="clay flex flex-col gap-2 p-5 text-[15px] tabular-nums">
        <h2 className="font-display text-[18px] font-bold">Tiền bạc</h2>
        <Row label="Đầu ngày" value={money(s.startMoney)} />
        <Row label="Bán hàng" value={signedMoney(s.revenue)} />
        <Row label="Nhập hàng" value={signedMoney(-s.restockCost)} />
        <div className="mt-1 flex justify-between border-t-2 border-dashed border-card-edge pt-2 font-display text-[19px] font-bold">
          <span>Cuối ngày</span>
          <span>{money(s.endMoney)}</span>
        </div>
      </section>

      <section className="clay grid grid-cols-4 gap-1 p-4 text-center">
        <Stat value={s.sold} label="khách mua" tone="text-leaf-deep" />
        <Stat value={s.outOfStock} label="hết hàng" tone="text-[#9a6a12]" />
        <Stat value={s.wrongItem} label="đưa nhầm" tone="text-[#9a6a12]" />
        <Stat value={s.leftAngry} label="bỏ về" tone="text-tile-deep" />
      </section>

      <section className="clay flex flex-col gap-2 p-5">
        <h2 className="font-display text-[18px] font-bold">Chuyện hôm nay</h2>
        {stories.length === 0 ? (
          <p className="text-[14px] text-ink-soft">Hôm nay chưa ai ngồi lại kể chuyện. Bán được hàng thì khách mới nán lại trò chuyện.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-[14px]">
            {stories.map((st, i) => (
              <li key={i} className="flex flex-col">
                <span className="font-semibold">{st.customer}</span>
                <span className="text-ink-soft">Bạn đáp: “{renderLine(st.said, me)}”</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="clay flex flex-col gap-2 p-5">
        <h2 className="font-display text-[18px] font-bold">Kho còn lại</h2>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-[14px] tabular-nums">
          {Object.values(content.items).map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
              <span className="truncate">{item.name}</span>
              <b className={(state.inventory[item.id] ?? 0) === 0 ? 'text-tile-deep' : ''}>{state.inventory[item.id] ?? 0}</b>
            </li>
          ))}
        </ul>
      </section>

      <button type="button" onClick={() => game.nextDay()} className="btn-3d btn-sun mt-auto mb-2 h-[58px] shrink-0 text-[18px]">
        {isLast ? 'Đón Tết' : 'Thắp nhang cho bà, đi ngủ'}
      </button>
    </motion.div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-soft">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

function Stat({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="flex flex-col">
      <span className={`font-display text-[30px] leading-none font-extrabold ${tone}`}>{value}</span>
      <span className="mt-1 text-[12px] text-ink-soft">{label}</span>
    </div>
  )
}
