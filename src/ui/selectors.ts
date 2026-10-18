import { clockMinutes } from '../engine/clock'
import { FILLER_CUTOFF_MS } from '../engine/config'
import type { GameState } from '../engine/types'
import type { Mood } from './components/Chibi'

// Selector cho useStore(game, selector). Quy tắc: chỉ trả về giá trị nguyên thuỷ (number, string, boolean)
// hoặc object có sẵn trong state. Không tạo object/mảng mới, nếu không component sẽ render lặp vô hạn.
//
// Mẹo hiệu năng: elapsedMs và patienceLeftMs đổi mỗi nhịp 100ms. Component nào chỉ cần thứ suy ra từ chúng
// (giờ trong game, biểu cảm khách) thì chọn thứ suy ra đó, để chỉ render lại khi kết quả thật sự đổi.

/** Giờ trong game, nhảy từng 10 phút → component chỉ render lại khoảng 3,6 giây một lần. */
export const selectClockMinutes = (s: GameState) => clockMinutes(s.elapsedMs, s.dayLengthMs)

/** Khoá riêng cho từng lượt khách: cùng một khách vô danh có thể tới nhiều lần trong ngày. */
export const selectVisitKey = (s: GameState) => (s.current ? `${s.current.visit.id}-${s.arrivedToday}` : null)

/** Gần giờ đóng cửa, không đón khách nữa. */
export const selectNearClosing = (s: GameState) => s.dayLengthMs - s.elapsedMs < FILLER_CUTOFF_MS

/** Tiền khách vừa trả trong lượt này (nếu có). Trả về Outcome nằm sẵn trong todayLog nên an toàn với useStore. */
export function selectSold(s: GameState) {
  const cur = s.current
  return cur ? s.todayLog.find((o) => o.visitId === cur.visit.id && o.kind === 'sold') : undefined
}

/** Số lần đã đưa nhầm cho khách đang đứng ở quầy. */
export function selectWrongCount(s: GameState) {
  const cur = s.current
  if (!cur) return 0
  let n = 0
  for (const o of s.todayLog) if (o.visitId === cur.visit.id && o.kind === 'wrong-item') n++
  return n
}

export function selectMood(s: GameState): Mood {
  const cur = s.current
  if (!cur) return 'normal'
  if (cur.status === 'story') return 'normal'
  if (cur.status === 'leaving') return selectSold(s) ? 'happy' : 'sad'
  if (cur.line === cur.visit.lines.wrongItem) return 'worried'
  return cur.patienceLeftMs / cur.visit.patienceMs < 0.35 ? 'worried' : 'normal'
}

/** Kiên nhẫn còn lại 0–1 của khách đang chờ; null nếu không có ai đang chờ. Đổi mỗi nhịp. */
export function selectPatience(s: GameState) {
  const cur = s.current
  return cur?.status === 'waiting' ? Math.max(0, cur.patienceLeftMs / cur.visit.patienceMs) : null
}
