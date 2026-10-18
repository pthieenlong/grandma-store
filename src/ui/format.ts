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
