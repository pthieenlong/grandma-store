import { useEffect, useRef } from 'react'
import { game } from '../../controllers'
import { useStore } from '../../hooks/useStore'

type Props = { valueText: string } // giờ trong game để trình đọc màn hình đọc, vd "7:40 sáng"

const progressOf = () => {
  const s = game.getSnapshot()
  return Math.min(1, s.elapsedMs / s.dayLengthMs)
}

/**
 * Thanh thời gian trong ngày, chạy liên tục theo từng nhịp 100ms.
 *
 * Không đi qua React: đăng ký thẳng vào game.subscribe rồi sửa style.width qua ref. Giá trị này đổi 10 lần/giây
 * mà chỉ để vẽ, nếu dùng useStore thì component render lại 10 lần/giây, mất phần hiệu năng đã tối ưu ở HUD.
 * React chỉ render lại khi tạm dừng / chơi tiếp (để sọc đứng yên hay trôi).
 */
export function DayProgress({ valueText }: Props) {
  const barRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLSpanElement>(null)
  const paused = useStore(game, (s) => s.paused)

  useEffect(() => {
    const apply = () => {
      const p = progressOf()
      if (fillRef.current) fillRef.current.style.width = `${p * 100}%`
      barRef.current?.setAttribute('aria-valuenow', String(Math.round(p * 100)))
    }
    apply()
    return game.subscribe(apply)
  }, [])

  return (
    <div
      ref={barRef}
      className="bar bar-running"
      data-paused={paused || undefined}
      role="progressbar"
      aria-label="Thời gian trong ngày"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={valueText}
    >
      <span ref={fillRef} className="bg-sun" style={{ width: `${progressOf() * 100}%` }} />
    </div>
  )
}
