import { motion } from 'motion/react'
import { game } from '../../controllers'
import { useStore } from '../../hooks/useStore'

/** 3 câu trả lời khi khách kể chuyện. */
export function StoryChoices() {
  const choices = useStore(game, (s) => (s.current?.status === 'story' ? s.current.visit.story?.choices : undefined))
  if (!choices) return null

  return (
    <section className="flex flex-col gap-2.5 pb-2" aria-label="Trả lời">
      <p className="text-[13px] text-ink-soft">Khách đang trò chuyện, không cần vội. Bạn trả lời:</p>
      {choices.map((choice, i) => (
        // Bọc motion.div ngoài nút: motion ghi `transform` inline, sẽ đè hiệu ứng lún của .btn-3d nếu đặt chung một element
        <motion.div
          key={i}
          className="flex flex-col"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.08, duration: 0.25 }}
        >
          <button
            type="button"
            onClick={() => game.choose(i)}
            className="btn-3d btn-soft min-h-[54px] rounded-[18px]! px-4 py-3 text-left font-body! text-[15px] leading-snug font-medium!"
          >
            {choice.text}
          </button>
        </motion.div>
      ))}
    </section>
  )
}
