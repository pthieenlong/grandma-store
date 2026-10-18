import { AnimatePresence, MotionConfig } from 'motion/react'
import { useEffect, useState } from 'react'
import { intro } from './content'
import { audio, game, profile, settings } from './controllers'
import { useStore } from './hooks/useStore'
import { money } from './ui/format'
import { Hud } from './ui/components/Hud'
import { CreateCharacterScreen } from './ui/screens/CreateCharacterScreen'
import { PauseScreen } from './ui/screens/PauseScreen'
import { RestockSheet } from './ui/screens/RestockSheet'
import { SceneScreen } from './ui/screens/SceneScreen'
import { ShopScreen } from './ui/screens/ShopScreen'
import { SummaryScreen } from './ui/screens/SummaryScreen'
import { TitleScreen } from './ui/screens/TitleScreen'

/** Các màn trước khi vào tiệm. 'game': đồng hồ đang chạy, chọn màn theo phase như cũ. */
type Screen = 'title' | 'create' | 'intro' | 'game'

export default function App() {
  // App chỉ cần biết đang ở màn nào; từng màn tự đọc phần state của mình, nên App không render lại theo đồng hồ
  const phase = useStore(game, (s) => s.phase)
  const paused = useStore(game, (s) => s.paused)
  const reduceMotion = useStore(settings, (s) => s.reduceMotion)
  const [screen, setScreen] = useState<Screen>('title') // đồng hồ chỉ chạy khi screen = 'game'
  const [newGameFlow, setNewGameFlow] = useState(false) // true: tạo nhân vật xong thì xem intro rồi chơi từ ngày 1
  const [restockOpen, setRestockOpen] = useState(false)

  useEffect(() => () => game.stop(), [])

  // CSS (anim-bob, trời trượt) không đọc được MotionConfig, nên báo qua attribute trên <html>
  useEffect(() => {
    document.documentElement.toggleAttribute('data-reduce-motion', reduceMotion)
  }, [reduceMotion])

  const enterShop = () => {
    setScreen('game')
    game.start()
  }

  // Cú chạm đầu tiên ở màn mở đầu: trình duyệt điện thoại chỉ cho phát âm thanh trong một thao tác chạm,
  // nên bật âm thanh ngay đây (nhạc nền chạy luôn trong lúc tạo nhân vật và xem intro)
  const startNewGame = () => {
    audio.start()
    setNewGameFlow(true)
    setScreen('create')
  }
  // game đã được dựng từ bản lưu lúc tải trang (controllers/index.ts). Bản lưu có từ trước khi có
  // màn tạo nhân vật thì chưa có hồ sơ: tạo nhân vật xong vào thẳng tiệm, không xem intro.
  const continueGame = () => {
    audio.start()
    setNewGameFlow(false)
    if (profile.getSnapshot()) enterShop()
    else setScreen('create')
  }
  const afterCreate = () => (newGameFlow ? setScreen('intro') : enterShop())
  // Ván mới chỉ thật sự bắt đầu (ghi đè bản lưu cũ) ở cuối intro: tải lại trang giữa chừng vẫn còn ván cũ
  const afterIntro = () => {
    game.newGame()
    enterShop()
  }

  const showRestock = restockOpen && phase === 'open'

  return (
    // "user": theo cài đặt "giảm chuyển động" của máy. "always": người chơi bật trong màn tạm dừng.
    // Khi giảm, motion tự tắt animation di chuyển, chỉ giữ mờ/hiện.
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
      <main className="mx-auto flex min-h-full max-w-[440px] flex-col gap-4 px-[max(16px,env(safe-area-inset-left,0px))] pt-4 pb-[max(12px,env(safe-area-inset-bottom,0px))]">
        {screen === 'title' && <TitleScreen onContinue={continueGame} onNewGame={startNewGame} />}
        {screen === 'create' && <CreateCharacterScreen onDone={afterCreate} />}
        {screen === 'intro' && <SceneScreen scene={intro} onDone={afterIntro} />}

        {screen === 'game' && phase === 'open' && (
          <>
            <Hud />
            <ShopScreen onOpenRestock={() => setRestockOpen(true)} />
          </>
        )}

        {screen === 'game' && phase === 'night' && <SummaryScreen />}

        {screen === 'game' && phase === 'ended' && <EndedScreen />}

        <AnimatePresence>{showRestock && <RestockSheet key="restock" onClose={() => setRestockOpen(false)} />}</AnimatePresence>

        <AnimatePresence>{screen === 'game' && paused && phase === 'open' && <PauseScreen key="pause" />}</AnimatePresence>
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
