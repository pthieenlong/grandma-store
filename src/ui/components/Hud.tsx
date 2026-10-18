import { useAnimate, useReducedMotionConfig } from 'motion/react'
import { useEffect, useRef } from 'react'
import { game, settings } from '../../controllers'
import { CLOSE_HOUR } from '../../engine/config'
import { useStore } from '../../hooks/useStore'
import { hhmm, money, timeOfDayLabel } from '../format'
import { selectClockMinutes } from '../selectors'
import { DayProgress } from './DayProgress'

/** Ô tiền nảy lên mỗi khi tiền đổi (bán được, nhập hàng). Lần render đầu thì không nảy. */
function useMoneyBump(money: number) {
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const reduce = useReducedMotionConfig()
  const prev = useRef(money)
  useEffect(() => {
    if (prev.current === money) return
    prev.current = money
    if (!reduce) animate(scope.current, { scale: [1, 1.12, 1] }, { duration: 0.35 })
  }, [money, reduce, animate, scope])
  return scope
}

/**
 * Thanh trên cùng. Không đọc elapsedMs (đổi mỗi nhịp 100ms) mà đọc giờ trong game (nhảy 10 phút),
 * nên HUD chỉ render lại khoảng 3,6 giây một lần, hoặc khi tiền đổi.
 */
export function Hud() {
  const day = useStore(game, (s) => s.day)
  const lastDay = useStore(game, (s) => s.lastDay)
  const cash = useStore(game, (s) => s.money)
  const paused = useStore(game, (s) => s.paused)
  const minutes = useStore(game, selectClockMinutes)
  const muted = useStore(settings, (s) => s.muted)
  const moneyRef = useMoneyBump(cash)
  const daysToTet = lastDay - day

  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h1 className="min-w-0 self-center font-display text-[26px] leading-none font-extrabold">Ngày {day}</h1>
        <div className="flex items-center gap-2">
          <div ref={moneyRef} className="clay flex items-center gap-1.5 rounded-full! px-3.5 py-2" aria-label={`Tiền: ${money(cash)}`}>
            <span className="grid size-5 place-items-center rounded-full bg-sun text-[11px] font-bold text-ink shadow-[inset_0_-2px_0_var(--color-sun-deep)]">
              đ
            </span>
            <span className="font-display text-[17px] leading-none font-bold tabular-nums">{money(cash)}</span>
          </div>
          <button
            type="button"
            onClick={() => settings.toggleMute()}
            className="btn-3d btn-soft grid size-11 place-items-center rounded-2xl!"
            aria-label={muted ? 'Bật tiếng' : 'Tắt tiếng'}
            aria-pressed={muted}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
              {muted ? (
                <path d="M16 9.5l5 5M21 9.5l-5 5" />
              ) : (
                <>
                  <path d="M15.5 9a4 4 0 0 1 0 6" />
                  <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
                </>
              )}
            </svg>
          </button>
          <button
            type="button"
            onClick={() => game.togglePause()}
            className="btn-3d btn-soft grid size-11 place-items-center rounded-2xl!"
            aria-label={paused ? 'Chơi tiếp' : 'Tạm dừng'}
          >
            {paused ? (
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 5l12 7-12 7z" fill="currentColor" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
                <rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between text-[13px] text-ink-soft tabular-nums">
          <span>
            <span className="font-display text-[17px] leading-none font-bold text-ink">{hhmm(minutes)}</span> {timeOfDayLabel(minutes)}
            <span className="ml-1.5">· đóng cửa {CLOSE_HOUR}:00</span>
          </span>
          {/* Đếm ngược Tết nằm cùng hàng đồng hồ: hàng trên chỉ còn "Ngày X", đủ chỗ cho tiền 7 chữ số + 2 nút trên màn 390px */}
          <span className="font-semibold whitespace-nowrap text-ink">{daysToTet > 0 ? `Còn ${daysToTet} ngày tới Tết` : 'Hôm nay là Tết'}</span>
        </div>
        <DayProgress valueText={`${hhmm(minutes)} ${timeOfDayLabel(minutes)}`} />
      </div>
    </header>
  )
}
