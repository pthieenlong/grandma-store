import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { profile } from '../../controllers'
import type { Scene } from '../../engine/types'
import { useStore } from '../../hooks/useStore'
import { renderLine } from '../format'

type Props = { scene: Scene; onDone: () => void }

/** Cảnh kể chuyện nhiều trang (intro, sau này là sự kiện giữa các ngày). Bấm "Tiếp" để sang trang, có thể bỏ qua. */
export function SceneScreen({ scene, onDone }: Props) {
  const me = useStore(profile, (p) => p)
  const [index, setIndex] = useState(0)
  const page = scene.pages[index]
  const isLast = index >= scene.pages.length - 1
  const next = () => (isLast ? onDone() : setIndex(index + 1))

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex min-h-[44px] items-center justify-between">
        <p className="sr-only">
          Trang {index + 1} trên {scene.pages.length}
        </p>
        <div className="flex gap-1.5" aria-hidden="true">
          {scene.pages.map((_, i) => (
            <span key={i} className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-sun-deep' : 'w-2 bg-card-edge'}`} />
          ))}
        </div>
        {!isLast && (
          <button type="button" onClick={onDone} className="min-h-[44px] px-3 text-[15px] font-semibold text-ink-soft">
            Bỏ qua
          </button>
        )}
      </div>

      {/* mode="wait": trang cũ mờ đi xong trang mới mới hiện, không chồng lên nhau */}
      <AnimatePresence mode="wait">
        <motion.article
          key={index}
          className="flex flex-1 flex-col justify-center gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          aria-live="polite"
        >
          <h2 className="font-display text-[28px] leading-tight font-extrabold">{page.title}</h2>
          {page.lines.map((line, i) => (
            <p key={i} className="text-[17px] leading-relaxed text-pretty">
              {renderLine(line, me)}
            </p>
          ))}
        </motion.article>
      </AnimatePresence>

      {/* Cùng một nút cho mọi trang nên focus không mất khi sang trang: bấm Enter liên tục là đọc hết */}
      <button type="button" autoFocus onClick={next} className="btn-3d h-[58px] text-[19px]">
        {isLast ? scene.doneLabel : 'Tiếp'}
      </button>
    </div>
  )
}
