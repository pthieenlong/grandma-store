import { LAST_DAY } from './config'
import { newGame, startDay } from './game'
import type { GameContent, GameState, Inventory } from './types'

// Lưu game: bản lưu luôn là ĐẦU một ngày. Tải lại giữa ngày thì chơi lại ngày đó từ đầu.
// Chỉ lưu vài con số; lịch khách dựng lại bằng startDay từ seed + content, nên sửa content JSON
// không làm hỏng bản lưu cũ (bản lưu không chứa câu thoại nào).

export const SAVE_VERSION = 1

export type SaveData = {
  version: typeof SAVE_VERSION
  seed: number
  day: number
  money: number
  inventory: Inventory
}

/**
 * Bản lưu ứng với state hiện tại, hoặc null nếu game đã kết thúc (xoá bản lưu).
 * - Đang mở cửa: đầu ngày hôm nay (tiền và kho lúc mở cửa, bỏ qua mọi thứ đã bán/nhập trong ngày).
 * - Buổi tối: đầu ngày mai, với tiền và kho cuối ngày. Tải lại lúc này thì bỏ qua màn Tổng kết.
 * - Tối ngày cuối: vẫn là đầu ngày cuối, để tải lại không mất luôn ván chơi.
 */
export function toSave(state: GameState): SaveData | null {
  if (state.phase === 'ended') return null
  const base = { version: SAVE_VERSION, seed: state.seed } as const
  if (state.phase === 'night' && state.day < state.lastDay) {
    return { ...base, day: state.day + 1, money: state.money, inventory: state.inventory }
  }
  return { ...base, day: state.day, money: state.startMoney, inventory: state.startInventory }
}

/** Dựng lại GameState đầu ngày từ bản lưu. Món có trong content mà bản lưu không có thì kho = 0, món lạ bị bỏ. */
export function fromSave(save: SaveData, content: GameContent): GameState {
  const inventory: Inventory = {}
  for (const id of Object.keys(content.items)) inventory[id] = save.inventory[id] ?? 0
  const base = newGame(content, save.seed)
  return startDay({ ...base, money: save.money, inventory }, Math.min(save.day, base.lastDay), content)
}

const isInt = (n: unknown, min: number, max = Number.MAX_SAFE_INTEGER): n is number =>
  typeof n === 'number' && Number.isInteger(n) && n >= min && n <= max

/** Đọc bản lưu một cách phòng thủ: JSON hỏng, sai version, sai kiểu thì coi như chưa có bản lưu. */
export function parseSave(raw: string | null): SaveData | null {
  if (!raw) return null
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null) return null
  const d = data as Record<string, unknown>
  if (d.version !== SAVE_VERSION || !isInt(d.seed, 0) || !isInt(d.day, 1, LAST_DAY)) return null
  if (typeof d.money !== 'number' || !Number.isFinite(d.money)) return null
  if (typeof d.inventory !== 'object' || d.inventory === null) return null

  // Bỏ từng món sai kiểu thay vì bỏ cả bản lưu: mất một món còn hơn mất cả ván
  const inventory: Inventory = {}
  for (const [id, qty] of Object.entries(d.inventory)) {
    if (isInt(qty, 0)) inventory[id] = qty
  }
  return { version: SAVE_VERSION, seed: d.seed, day: d.day, money: d.money, inventory }
}
