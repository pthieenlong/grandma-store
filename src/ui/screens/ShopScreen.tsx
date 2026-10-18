import { useState } from 'react'
import { audio, game } from '../../controllers'
import type { ItemId, Tray } from '../../engine/types'
import { useStore } from '../../hooks/useStore'
import { CounterScene } from '../components/CounterScene'
import { DialogueCard } from '../components/DialogueCard'
import { Shelf } from '../components/Shelf'
import { StockCard } from '../components/StockCard'
import { StoryChoices } from '../components/StoryChoices'
import { TrayBar } from '../components/TrayBar'
import { selectVisitKey } from '../selectors'

type Props = { onOpenRestock: () => void }

/**
 * Màn quầy hàng. Bản thân màn này chỉ render lại khi có khách mới tới hoặc khách đi;
 * từng phần bên trong (cảnh, thoại, kệ, khay) tự đọc đúng phần state mình cần.
 */
export function ShopScreen({ onOpenRestock }: Props) {
  const visitKey = useStore(game, selectVisitKey)

  return (
    <div className="flex flex-1 flex-col gap-4">
      <CounterScene />
      {visitKey ? (
        <ServeArea key={visitKey} onOpenRestock={onOpenRestock} />
      ) : (
        <>
          <StockCard />
          <button type="button" onClick={onOpenRestock} className="btn-3d btn-sun mt-auto mb-2 h-[58px] shrink-0 text-[18px]">
            Nhập hàng
          </button>
        </>
      )}
    </div>
  )
}

/** Khay hàng nằm ở đây; component được gắn key theo từng lượt khách nên khay tự rỗng khi khách mới tới. */
function ServeArea({ onOpenRestock }: Props) {
  const [tray, setTray] = useState<Tray>({})
  const waiting = useStore(game, (s) => s.current?.status === 'waiting')
  const hasItems = Object.values(tray).some((qty) => qty > 0)

  const add = (id: ItemId) => {
    // Đọc kho ngay lúc bấm bằng getSnapshot() thay vì useStore: chỉ cần giá trị lúc này,
    // không cần ServeArea render lại mỗi khi kho đổi.
    const stock = game.getSnapshot().inventory[id] ?? 0
    if ((tray[id] ?? 0) >= stock) return
    audio.playSfx('tap')
    setTray((t) => ((t[id] ?? 0) >= stock ? t : { ...t, [id]: (t[id] ?? 0) + 1 }))
  }
  const removeOne = (id: ItemId) => {
    audio.playSfx('tap')
    setTray((t) => ({ ...t, [id]: Math.max(0, (t[id] ?? 0) - 1) }))
  }
  const handGive = () => {
    game.give(tray)
    setTray({})
  }

  return (
    <>
      <DialogueCard />
      <StoryChoices />

      {waiting && (
        <>
          <Shelf tray={tray} onAdd={add} onOpenRestock={onOpenRestock} />
          <TrayBar tray={tray} onRemove={removeOne} />
          <div className="mt-auto grid grid-cols-3 gap-3 pb-2">
            <button type="button" onClick={() => game.apologize()} className="btn-3d btn-soft h-[58px] text-[15px] leading-tight">
              Hết hàng rồi
            </button>
            <button type="button" onClick={handGive} disabled={!hasItems} className="btn-3d col-span-2 h-[58px] text-[20px]">
              Đưa hàng
            </button>
          </div>
        </>
      )}
    </>
  )
}
