import { AnimatePresence, MotionConfig } from 'motion/react'
import { useEffect, useState } from 'react'
import { audio, game, settings } from './controllers'
import { useStore } from './hooks/useStore'
import { money } from './ui/format'
import { Hud } from './ui/components/Hud'
import { PauseScreen } from './ui/screens/PauseScreen'
import { RestockSheet } from './ui/screens/RestockSheet'
import { ShopScreen } from './ui/screens/ShopScreen'
import { SummaryScreen } from './ui/screens/SummaryScreen'
import { TitleScreen } from './ui/screens/TitleScreen'

export default function App() {
  // App chỉ cần biết đang ở màn nào; từng màn tự đọc phần state của mình, nên App không render lại theo đồng hồ
  const phase = useStore(game, (s) => s.phase)
  const paused = useStore(game, (s) => s.paused)
  const reduceMotion = useStore(settings, (s) => s.reduceMotion)
  const [atTitle, setAtTitle] = useState(true) // màn mở đầu: đồng hồ chưa chạy cho tới khi bấm "Mở cửa tiệm"
  const [restockOpen, setRestockOpen] = useState(false)

  useEffect(() => () => game.stop(), [])

  // CSS (anim-bob, trời trượt) không đọc được MotionConfig, nên báo qua attribute trên <html>
  useEffect(() => {
    document.documentElement.toggleAttribute('data-reduce-motion', reduceMotion)
  }, [reduceMotion])

  // Chạy trong lúc người chơi bấm nút: trình duyệt điện thoại chỉ cho phát âm thanh trong một thao tác chạm
  const startGame = () => {
    setAtTitle(false)
    audio.start()
    game.start()
  }

  const showRestock = restockOpen && phase === 'open'

  return (
    // "user": theo cài đặt "giảm chuyển động" của máy. "always": người chơi bật trong màn tạm dừng.
    // Khi giảm, motion tự tắt animation di chuyển, chỉ giữ mờ/hiện.
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
      <main className="mx-auto flex min-h-full max-w-[440px] flex-col gap-4 px-[max(16px,env(safe-area-inset-left,0px))] pt-4 pb-[max(12px,env(safe-area-inset-bottom,0px))]">
        {atTitle && <TitleScreen onStart={startGame} />}

        {!atTitle && phase === 'open' && (
          <>
            <Hud />
            <ShopScreen onOpenRestock={() => setRestockOpen(true)} />
          </>
        )}

        {!atTitle && phase === 'night' && <SummaryScreen />}

        {!atTitle && phase === 'ended' && <EndedScreen />}

        <AnimatePresence>{showRestock && <RestockSheet key="restock" onClose={() => setRestockOpen(false)} />}</AnimatePresence>

        <AnimatePresence>{!atTitle && paused && phase === 'open' && <PauseScreen key="pause" />}</AnimatePresence>
      </main>
    </MotionConfig>
  )
}

function EndedScreen() {
  const lastDay = useStore(game, (s) => s.lastDay)
  const cash = useStore(game, (s) => s.money)
  return (
    <div className="flex flex-1 flex-col justify-center gap-5 text-center">
      <h1 className="font-display text-[34px] leading-tight font-extrabold">Tết tới rồi</h1>
      <p className="text-[16px] text-ink-soft">
        Bạn giữ tiệm của bà qua {lastDay} ngày, còn lại {money(cash)}.
      </p>
      <button type="button" onClick={() => game.newGame()} className="btn-3d mx-auto h-[56px] px-8 text-[18px]">
        Chơi lại
      </button>
    </div>
  )
}
