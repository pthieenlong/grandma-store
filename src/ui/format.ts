import type { Profile } from '../controllers/ProfileController'
import { timeOfDay, type TimeOfDay } from '../engine/clock'

export const money = (n: number) => `${n.toLocaleString('vi-VN')}đ`

export const signedMoney = (n: number) => (n > 0 ? `+${money(n)}` : n < 0 ? `−${money(-n)}` : money(0))

const TIME_OF_DAY_LABEL: Record<TimeOfDay, string> = {
  morning: 'sáng',
  noon: 'trưa',
  afternoon: 'chiều',
  evening: 'tối',
}

/** 450 → "7:30" */
export function hhmm(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}:${m.toString().padStart(2, '0')}`
}

/** 450 → "sáng" */
export const timeOfDayLabel = (minutes: number) => TIME_OF_DAY_LABEL[timeOfDay(minutes)]

/**
 * Thay chỗ trống trong câu thoại theo hồ sơ người chơi:
 * - `{name}` → tên người chơi
 * - `{nam|nữ}` → chọn theo giới tính, vd "{Thằng|Con nhỏ} này" → "Thằng này" / "Con nhỏ này"
 * Chưa có hồ sơ thì tên là "cháu", giới tính lấy bản nam (chỉ để không vỡ chữ, bình thường không xảy ra).
 * Viết hoa chữ đầu: câu của khách vô danh ghép từ mẫu, chỗ trống có thể đứng đầu câu ("{anh|chị} ơi…").
 */
export function renderLine(text: string, profile: Profile | null): string {
  const male = profile?.gender !== 'female'
  // Thay giới tính trước rồi mới thay tên: tên đã được bỏ { } | nên không bị đọc nhầm thành chỗ trống
  const out = text
    .replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (_, m: string, f: string) => (male ? m : f))
    .replace(/\{name\}/g, profile?.name ?? 'cháu')
  return out.charAt(0).toLocaleUpperCase('vi-VN') + out.slice(1)
}
