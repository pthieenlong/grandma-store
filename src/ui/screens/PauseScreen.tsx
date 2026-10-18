import { motion } from 'motion/react'
import { useEffect } from 'react'
import { game, settings } from '../../controllers'
import { useStore } from '../../hooks/useStore'
import { Switch } from '../components/Switch'
import { VolumeSlider } from '../components/VolumeSlider'

/** Màn tạm dừng: chỉnh âm thanh và chuyển động ngay tại chỗ. Phải nằm trong <AnimatePresence> để có hiệu ứng đóng. */
export function PauseScreen() {
  const musicVolume = useStore(settings, (s) => s.musicVolume)
  const sfxVolume = useStore(settings, (s) => s.sfxVolume)
  const muted = useStore(settings, (s) => s.muted)
  const reduceMotion = useStore(settings, (s) => s.reduceMotion)

  // Bấm Esc (bàn phím) để chơi tiếp
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') game.resume()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-ink/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        className="clay flex w-full max-w-[360px] flex-col gap-5 p-6"
        initial={{ scale: 0.94, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 12 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      >
        <header className="text-center">
          <h2 id="pause-title" className="font-display text-[26px] leading-tight font-extrabold">
            Tạm dừng
          </h2>
          <p className="mt-1 text-[14px] text-ink-soft">Đồng hồ và khách đều đứng yên.</p>
        </header>

        <section className="flex flex-col gap-3" aria-label="Âm thanh">
          <VolumeSlider label="Nhạc nền" value={musicVolume} disabled={muted} onChange={(v) => settings.setMusicVolume(v)} />
          <VolumeSlider label="Hiệu ứng" value={sfxVolume} disabled={muted} onChange={(v) => settings.setSfxVolume(v)} />
          <Switch label="Tắt tiếng" checked={muted} onChange={() => settings.toggleMute()} />
        </section>

        <div className="border-t-2 border-dashed border-card-edge pt-3">
          <Switch
            label="Giảm chuyển động"
            hint="Khách không đi qua đi lại, không nảy, không lắc"
            checked={reduceMotion}
            onChange={(v) => settings.setReduceMotion(v)}
          />
        </div>

        {/* autoFocus: mở màn là bấm Enter chơi tiếp được, trình đọc màn hình cũng nhảy vào hộp thoại */}
        <button type="button" autoFocus onClick={() => game.resume()} className="btn-3d h-[54px] text-[18px]">
          Chơi tiếp
        </button>
      </motion.div>
    </motion.div>
  )
}
