import { content } from '../../content'
import { game } from '../../controllers'
import { useStore } from '../../hooks/useStore'

/** Hàng sắp hết, hiện lúc quầy vắng khách. */
export function StockCard() {
  const inventory = useStore(game, (s) => s.inventory)
  const low = Object.values(content.items)
    .map((item) => ({ item, stock: inventory[item.id] ?? 0 }))
    .filter((x) => x.stock <= 2)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 4)

  return (
    <section className="clay flex flex-col gap-2 p-5">
      <h2 className="font-display text-[18px] leading-none font-bold">Hàng sắp hết</h2>
      {low.length === 0 ? (
        <p className="text-[14px] text-ink-soft">Kệ hàng còn đầy đủ.</p>
      ) : (
        <ul className="flex flex-col gap-1.5 text-[14px]">
          {low.map(({ item, stock }) => (
            <li key={item.id} className="flex justify-between tabular-nums">
              <span>{item.name}</span>
              <span className="font-semibold text-tile-deep">còn {stock}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
