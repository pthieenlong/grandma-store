import { motion } from 'motion/react'
import { useState } from 'react'
import { save } from '../../controllers'
import { useStore } from '../../hooks/useStore'
import { ShopBackdrop } from '../components/ShopBackdrop'

type Props = {
  onContinue: () => void // chơi tiếp từ bản lưu
  onNewGame: () => void // tạo nhân vật → intro → ngày 1 (bản lưu cũ chỉ bị ghi đè ở cuối intro)
}

/**
 * Màn mở đầu. Ngoài việc chào người chơi, cú chạm đầu tiên ("Bắt đầu" / "Chơi tiếp" / "Ván mới") còn dùng để
 * mở khoá âm thanh: trình duyệt điện thoại chỉ cho phát âm thanh sau khi người chơi đã chạm.
 */
export function TitleScreen({ onContinue, onNewGame }: Props) {
  const savedDay = useStore(save, (s) => s.savedDay)
  const [confirming, setConfirming] = useState(false) // đang hỏi lại trước khi xoá bản lưu

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

      {savedDay === null ? (
        <button type="button" onClick={onNewGame} className="btn-3d h-[60px] text-[20px]">
          Bắt đầu
        </button>
      ) : confirming ? (
        <div className="clay flex flex-col gap-3 p-4" role="group" aria-labelledby="confirm-new-game">
          <p id="confirm-new-game" className="text-center text-[15px] leading-relaxed text-pretty">
            Chơi lại từ ngày 1? Bạn sẽ mất ván đang chơi ở ngày {savedDay}.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {/* autoFocus vào nút an toàn: lỡ bấm Enter cũng không mất bản lưu */}
            <button type="button" autoFocus onClick={() => setConfirming(false)} className="btn-3d btn-soft h-[50px] text-[16px]">
              Thôi
            </button>
            <button type="button" onClick={onNewGame} className="btn-3d btn-tile h-[50px] text-[16px]">
              Chơi lại
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <button type="button" onClick={onContinue} className="btn-3d flex h-[60px] flex-col items-center justify-center leading-tight">
            <span className="text-[20px]">Chơi tiếp</span>
            <span className="text-[13px] font-semibold opacity-85">Ngày {savedDay}</span>
          </button>
          <button type="button" onClick={() => setConfirming(true)} className="btn-3d btn-soft h-[48px] text-[16px]">
            Ván mới
          </button>
        </div>
      )}
    </motion.div>
  )
}
