import { FILLER_PATIENCE_MAX_MS, FILLER_PATIENCE_MIN_MS, FILLER_TWO_ITEMS_CHANCE } from './config'
import { pickWeighted, randInt } from './rng'
import type { GameContent, VisitLines, VisitScript, Want } from './types'

// Khách vô danh: tự sinh từ mẫu câu trong content/fillers.json, lấp chỗ trống giữa các khách có tên.

const pick = <T>(rng: () => number, list: T[]): T => list[randInt(rng, 0, list.length - 1)]

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase('vi-VN') + s.slice(1)

/** [{mi-goi, 2}, {nuoc-mam, 1}] → "2 gói mì với 1 chai nước mắm" */
export function describeWants(wants: Want[], content: GameContent): string {
  return wants
    .map((w) => {
      const item = content.items[w.itemId]
      return item ? `${w.maxQty} ${item.unit} ${item.noun}` : `${w.maxQty} ${w.itemId}`
    })
    .join(' với ')
}

/**
 * Sinh một khách vô danh. Trả về null nếu content không đủ để sinh (thiếu khách, món hoặc mẫu câu).
 * `n` chỉ để tạo id duy nhất trong ngày.
 */
export function makeFiller(rng: () => number, day: number, n: number, content: GameContent): VisitScript | null {
  const { customers, items, lines } = content.fillers
  const pool = Object.entries(items)
    .filter(([id]) => content.items[id])
    .map(([itemId, cfg]) => ({ itemId, ...cfg }))
  const lineKeys = Object.keys(lines) as (keyof VisitLines)[]
  if (customers.length === 0 || pool.length === 0 || lineKeys.some((k) => lines[k].length === 0)) return null

  const wantCount = pool.length > 1 && rng() < FILLER_TWO_ITEMS_CHANCE ? 2 : 1
  const wants: Want[] = []
  for (let i = 0; i < wantCount; i++) {
    const idx = pickWeighted(rng, pool)
    if (idx < 0) break
    const { itemId, maxQty } = pool.splice(idx, 1)[0]
    wants.push({ itemId, maxQty: randInt(rng, 1, Math.max(1, maxQty)) })
  }
  if (wants.length === 0) return null

  const who = pick(rng, customers)
  const vars: Record<string, string> = { self: who.self, player: who.player, wants: describeWants(wants, content) }
  const fill = (template: string) => capitalize(template.replace(/\{(\w+)\}/g, (m, key: string) => vars[key] ?? m))
  const line = (key: keyof VisitLines) => fill(pick(rng, lines[key]))

  return {
    id: `filler-d${day}-${n}`,
    customer: who.name,
    wants,
    patienceMs: randInt(rng, FILLER_PATIENCE_MIN_MS, FILLER_PATIENCE_MAX_MS),
    lines: {
      greet: line('greet'),
      thanks: line('thanks'),
      outOfStock: line('outOfStock'),
      leftAngry: line('leftAngry'),
      wrongItem: line('wrongItem'),
    },
  }
}
