import type { DayScript, FillerContent, GameContent, Item, RandomVisit } from '../engine/types'
import fillersJson from './fillers.json'
import itemsJson from './items.json'
import randomJson from './random-visits.json'

// Tự động gom mọi file days/day-XX.json. Thêm ngày mới = thêm file, không cần sửa code.
const dayModules = import.meta.glob<DayScript>('./days/*.json', { eager: true, import: 'default' })

const items = Object.fromEntries((itemsJson as Item[]).map((it) => [it.id, it]))
const days = Object.values(dayModules).sort((a, b) => a.day - b.day)

export const content: GameContent = {
  items,
  days,
  randomPool: randomJson as RandomVisit[],
  fillers: fillersJson as FillerContent,
}
