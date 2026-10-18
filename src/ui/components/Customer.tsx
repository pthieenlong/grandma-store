import { motion, useAnimate, useReducedMotionConfig } from 'motion/react'
import { useEffect } from 'react'
import { Chibi, type Mood } from './Chibi'

type Props = {
  name: string
  mood: Mood
  wrongCount: number // số lần đã đưa nhầm cho khách này; tăng lên là lắc một cái
}

// Nhún lên xuống như đang bước đi, dùng chung cho lúc vào và lúc ra
const STEPS = [0, -6, 0, -6, 0]

/**
 * Khách đứng ở quầy, có animation đi vào / đi ra / phản ứng.
 * Phải nằm trong <AnimatePresence> thì animation `exit` (đi ra) mới chạy được, vì lúc đó engine đã xoá khách khỏi state.
 * Animation gắn lên khung bọc chứ không gắn vào bên trong Chibi, để sau này thay bằng hình thật vẫn dùng lại được.
 */
export function Customer({ name, mood, wrongCount }: Props) {
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const reduce = useReducedMotionConfig() // theo cả cài đặt của máy lẫn nút trong màn tạm dừng

  // Đưa nhầm: lắc ngang. Theo dõi wrongCount thay vì câu thoại, vì nhầm lần 2 câu thoại y hệt lần 1 nên không đổi gì để bắt
  useEffect(() => {
    if (wrongCount === 0 || reduce) return
    animate(scope.current, { x: [0, -10, 10, -7, 7, -3, 0] }, { duration: 0.45 })
  }, [wrongCount, reduce, animate, scope])

  // Mua được hàng: nhảy lên một cái
  useEffect(() => {
    if (mood !== 'happy' || reduce) return
    animate(scope.current, { y: [0, -16, 0, -5, 0], scaleY: [1, 1.04, 0.95, 1.02, 1] }, { duration: 0.6 })
  }, [mood, reduce, animate, scope])

  return (
    <motion.div
      className="h-full"
      initial={{ x: 150, opacity: 0 }}
      animate={{ x: 0, opacity: 1, y: STEPS }}
      exit={{ x: -150, opacity: 0, y: STEPS }}
      transition={{ duration: 0.7, ease: 'easeOut', opacity: { duration: 0.3 } }}
    >
      <div ref={scope} className="h-full origin-bottom">
        <div className={mood === 'normal' ? 'anim-bob h-full' : 'h-full'}>
          <Chibi name={name} mood={mood} />
        </div>
      </div>
    </motion.div>
  )
}
