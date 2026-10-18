import { CLOCK_STEP_MIN, CLOSE_HOUR, OPEN_HOUR } from './config'

export type TimeOfDay = 'morning' | 'noon' | 'afternoon' | 'evening'

/**
 * Giờ trong game, tính bằng số phút kể từ 0:00, làm tròn xuống theo CLOCK_STEP_MIN.
 * Chỉ để hiển thị: luật game vẫn tính bằng elapsedMs.
 * Quá giờ (đang trò chuyện dở lúc đóng cửa) thì đồng hồ đứng ở giờ đóng cửa.
 */
export function clockMinutes(elapsedMs: number, dayLengthMs: number): number {
  const t = dayLengthMs > 0 ? Math.min(1, Math.max(0, elapsedMs / dayLengthMs)) : 1
  const raw = OPEN_HOUR * 60 + t * (CLOSE_HOUR - OPEN_HOUR) * 60
  return Math.floor(raw / CLOCK_STEP_MIN) * CLOCK_STEP_MIN
}

/** Buổi trong ngày theo cách nói thường ngày: sáng tới 11h, trưa tới 13h, chiều tới 18h, sau đó là tối. */
export function timeOfDay(minutes: number): TimeOfDay {
  if (minutes < 11 * 60) return 'morning'
  if (minutes < 13 * 60) return 'noon'
  if (minutes < 18 * 60) return 'afternoon'
  return 'evening'
}

/** Ngược với clockMinutes: giờ game (vd 16 = 16:00) → mốc elapsedMs tương ứng. */
export function msAtHour(hour: number, dayLengthMs: number): number {
  const t = (hour - OPEN_HOUR) / (CLOSE_HOUR - OPEN_HOUR)
  return Math.min(1, Math.max(0, t)) * dayLengthMs
}
