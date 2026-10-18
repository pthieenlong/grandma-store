import { motion } from 'motion/react'
import { ShopBackdrop } from '../components/ShopBackdrop'

type Props = { onStart: () => void }

/**
 * Màn mở đầu. Ngoài việc chào người chơi, cú chạm "Mở cửa tiệm" còn là lần chạm đầu tiên:
 * trình duyệt điện thoại chỉ cho phát âm thanh sau khi người chơi đã chạm, nên nhạc nền (bước sau) sẽ bắt đầu từ đây.
 */
export function TitleScreen({ onStart }: Props) {
  return (
    <motion.div
      className="flex flex-1 flex-col justify-center gap-7"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ShopBackdrop minutes={6 * 60 + 40} label="Tiệm tạp hoá lúc rạng sáng" />

      <header className="text-center">
        <p className="text-[14px] font-semibold tracking-wide text-ink-soft">Một làng quê miền Tây</p>
        <h1 className="mt-1 font-display text-[38px] leading-[1.05] font-extrabold">
          {/* Ngắt dòng tay: để trình duyệt tự ngắt thì hay tách đôi "Tạp / Hoá" */}
          Tiệm Tạp Hoá
          <br />
          Bà Ngoại
        </h1>
        <p className="mx-auto mt-3 max-w-[300px] text-[15px] leading-relaxed text-ink-soft text-pretty">
          Bà để lại căn nhà và cái tiệm nhỏ. Mỗi ngày mở cửa, bán cho bà con trong xóm, nghe họ kể chuyện.
        </p>
      </header>

      <button type="button" onClick={onStart} className="btn-3d h-[60px] text-[20px]">
        Mở cửa tiệm
      </button>
    </motion.div>
  )
}
