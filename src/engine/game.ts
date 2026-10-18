import { msAtHour } from './clock'
import {
  DAY_LENGTH_MS,
  FILLER_CUTOFF_MS,
  FIRST_ARRIVAL_MS,
  GAP_MAX_MS,
  GAP_MIN_MS,
  LAST_DAY,
  LEAVE_MAX_MS,
  LEAVE_MIN_MS,
  PLANNED_LAST_HOUR,
  PLANNED_LOOKAHEAD_MS,
  RANDOM_ONLY_DAY_COUNT,
  READ_MS_PER_CHAR,
  START_INVENTORY,
  START_MONEY,
  WRONG_ITEM_PENALTY,
} from './config'
import { makeFiller } from './filler'
import { createRng, drawRandom, pickWeighted, randInt } from './rng'
import type {
  CurrentVisit,
  GameContent,
  GameState,
  Inventory,
  ItemId,
  Item,
  Outcome,
  QueuedVisit,
  Tray,
  VisitScript,
} from './types'

// Tất cả hàm ở đây là hàm thuần: nhận state cũ, trả state mới, không đụng tới UI hay thời gian thật.

const emptyOutcome = (visitId: string | null, kind: Outcome['kind']): Outcome => ({
  visitId,
  kind,
  moneyDelta: 0,
  inventoryDelta: {},
  bondDeltas: {},
})

// ---------- Bán hàng ----------

/**
 * Người chơi đưa một khay hàng cho khách.
 * - Khay rỗng, hoặc có món khách không cần → 'wrong-item' (không bán gì).
 * - Đúng món: mỗi món bán min(số trong khay, khách muốn tối đa, tồn kho). Dư thì khách trả lại.
 */
export function resolveGive(
  visit: VisitScript,
  tray: Tray,
  inventory: Inventory,
  items: Record<ItemId, Item>,
): Outcome {
  const wanted = new Map(visit.wants.map((w) => [w.itemId, w.maxQty]))
  const entries = Object.entries(tray).filter(([, qty]) => qty > 0)
  if (entries.length === 0 || entries.some(([id]) => !wanted.has(id))) {
    return emptyOutcome(visit.id, 'wrong-item')
  }

  const outcome = emptyOutcome(visit.id, 'sold')
  for (const [id, trayQty] of entries) {
    const item = items[id]
    if (!item) continue // content lỗi tên món: bỏ qua thay vì làm sập game
    const qty = Math.max(0, Math.min(Math.floor(trayQty), wanted.get(id) ?? 0, inventory[id] ?? 0))
    if (qty === 0) continue
    outcome.moneyDelta += item.sellPrice * qty
    outcome.inventoryDelta[id] = -qty
  }
  // Khay toàn món đã hết hàng (dữ liệu khay cũ): coi như đưa nhầm, không bán gì
  return outcome.moneyDelta > 0 ? outcome : emptyOutcome(visit.id, 'wrong-item')
}

/** Thời gian khách đứng lại sau câu cuối, đủ để đọc hết câu. */
export function readTimeMs(line: string): number {
  return Math.min(LEAVE_MAX_MS, Math.max(LEAVE_MIN_MS, line.length * READ_MS_PER_CHAR))
}

function leaving(cur: CurrentVisit, line: string): CurrentVisit {
  return { ...cur, status: 'leaving', leaveInMs: readTimeMs(line), line }
}

function leaveAngry(state: GameState, cur: CurrentVisit): GameState {
  const s = applyOutcome(state, emptyOutcome(cur.visit.id, 'left-angry'))
  return { ...s, current: { ...leaving(cur, cur.visit.lines.leftAngry), patienceLeftMs: 0 } }
}

export function applyOutcome(state: GameState, outcome: Outcome): GameState {
  const inventory = { ...state.inventory }
  for (const [id, delta] of Object.entries(outcome.inventoryDelta)) {
    inventory[id] = Math.max(0, (inventory[id] ?? 0) + delta)
  }
  return {
    ...state,
    money: state.money + outcome.moneyDelta,
    inventory,
    todayLog: [...state.todayLog, outcome],
  }
}

export function give(state: GameState, tray: Tray, content: GameContent): GameState {
  const cur = state.current
  if (state.phase !== 'open' || !cur || cur.status !== 'waiting') return state

  const outcome = resolveGive(cur.visit, tray, state.inventory, content.items)

  if (outcome.kind === 'wrong-item') {
    const s = applyOutcome(state, outcome)
    const patienceLeftMs = cur.patienceLeftMs - cur.visit.patienceMs * WRONG_ITEM_PENALTY
    if (patienceLeftMs <= 0) return leaveAngry(s, cur)
    return { ...s, current: { ...cur, patienceLeftMs, line: cur.visit.lines.wrongItem } }
  }

  const s = applyOutcome(state, outcome)
  const story = cur.visit.story
  if (story && story.choices.length > 0) {
    // Bán xong, khách có chuyện để kể: kiên nhẫn đứng yên tới khi người chơi trả lời
    return { ...s, current: { ...cur, status: 'story', line: story.text } }
  }
  return { ...s, current: leaving(cur, cur.visit.lines.thanks) }
}

/** Người chơi chọn câu trả lời; khách đáp lại rồi ra về. */
export function choose(state: GameState, choiceIndex: number): GameState {
  const cur = state.current
  const choice = cur?.visit.story?.choices[choiceIndex]
  if (state.phase !== 'open' || !cur || cur.status !== 'story' || !choice) return state
  const s = applyOutcome(state, { ...emptyOutcome(cur.visit.id, 'story'), choiceIndex })
  return { ...s, current: leaving(cur, choice.reply) }
}

/** Người chơi báo "hết hàng rồi": khách ra về, không bán được gì. */
export function apologize(state: GameState): GameState {
  const cur = state.current
  if (state.phase !== 'open' || !cur || cur.status !== 'waiting') return state
  const s = applyOutcome(state, emptyOutcome(cur.visit.id, 'out-of-stock'))
  return { ...s, current: leaving(cur, cur.visit.lines.outOfStock) }
}

// ---------- Nhập hàng ----------

export type RestockResult = { ok: true; state: GameState } | { ok: false; reason: 'no-money' | 'bad-input' }

export function restock(
  state: GameState,
  itemId: ItemId,
  qty: number,
  content: GameContent,
): RestockResult {
  const item = content.items[itemId]
  if (!item || !Number.isInteger(qty) || qty <= 0 || state.phase !== 'open') {
    return { ok: false, reason: 'bad-input' }
  }
  const cost = item.buyPrice * qty
  if (cost > state.money) return { ok: false, reason: 'no-money' }

  const outcome: Outcome = {
    ...emptyOutcome(null, 'restock'),
    moneyDelta: -cost,
    inventoryDelta: { [itemId]: qty },
  }
  return { ok: true, state: applyOutcome(state, outcome) }
}

// ---------- Thời gian ----------

/**
 * Quầy trống tới lượt đón khách: khách có tên tới hạn (hoặc sắp tới hạn) thì mời họ,
 * không thì sinh một khách vô danh. Sát giờ đóng cửa thì thôi không đón nữa.
 */
function nextVisitor(s: GameState, content: GameContent): GameState {
  const [planned, ...rest] = s.queue
  if (planned && s.elapsedMs >= planned.arriveAtMs - PLANNED_LOOKAHEAD_MS) {
    return { ...s, queue: rest, ...arrive(s, planned.visit) }
  }
  if (s.dayLengthMs - s.elapsedMs < FILLER_CUTOFF_MS) return s
  const [filler, rngState] = drawRandom(s.rngState, (rng) => makeFiller(rng, s.day, s.arrivedToday, content))
  if (!filler) return { ...s, rngState }
  return { ...s, rngState, ...arrive(s, filler) }
}

function arrive(s: GameState, visit: VisitScript): Pick<GameState, 'current' | 'arrivedToday'> {
  return {
    arrivedToday: s.arrivedToday + 1,
    current: { visit, status: 'waiting', patienceLeftMs: visit.patienceMs, line: visit.lines.greet, leaveInMs: 0 },
  }
}

/** Chạy mỗi khung hình với dt = số ms đã trôi qua. Đang tạm dừng thì không có gì xảy ra. */
export function tick(state: GameState, dt: number, content: GameContent): GameState {
  if (state.phase !== 'open' || state.paused || dt <= 0) return state

  let s: GameState = { ...state, elapsedMs: state.elapsedMs + dt }
  const cur = s.current

  if (cur && cur.status === 'waiting') {
    const patienceLeftMs = cur.patienceLeftMs - dt
    if (patienceLeftMs <= 0) {
      s = leaveAngry(s, cur)
    } else {
      s.current = { ...cur, patienceLeftMs }
    }
  } else if (cur && cur.status === 'story') {
    // Đang trò chuyện: chỉ đồng hồ ngày chạy, kiên nhẫn của khách đứng yên
  } else if (cur && cur.status === 'leaving') {
    const leaveInMs = cur.leaveInMs - dt
    if (leaveInMs <= 0) {
      const [gap, rngState] = drawRandom(s.rngState, (rng) => randInt(rng, GAP_MIN_MS, GAP_MAX_MS))
      s.current = null
      s.nextArrivalInMs = gap
      s.rngState = rngState
    } else {
      s.current = { ...cur, leaveInMs }
    }
  } else {
    s.nextArrivalInMs -= dt
    if (s.nextArrivalInMs <= 0) s = nextVisitor(s, content)
  }

  // Hết giờ: khách đang chờ (nếu có) không được tính là bỏ về giận, chỉ là tiệm đóng cửa.
  // Đang trò chuyện hoặc khách đang nói câu cuối thì chờ xong mới đóng, không cắt ngang câu chuyện.
  const inConversation = s.current?.status === 'story' || s.current?.status === 'leaving'
  if (s.elapsedMs >= s.dayLengthMs && !inConversation) return endDay(s)
  return s
}

/** Tạm dừng / chơi tiếp. Chỉ có tác dụng lúc tiệm đang mở; không đổi gì thì trả về đúng state cũ. */
export function setPaused(state: GameState, paused: boolean): GameState {
  if (state.phase !== 'open' || state.paused === paused) return state
  return { ...state, paused }
}

function endDay(state: GameState): GameState {
  return { ...state, phase: 'night', current: null, elapsedMs: Math.min(state.elapsedMs, state.dayLengthMs) }
}

// ---------- Ngày mới ----------

/**
 * Dựng lịch khách có tên trong ngày: khách viết sẵn giữ thứ tự, khách ngẫu nhiên chen vào vị trí ngẫu nhiên,
 * rồi rải đều từ lúc mở cửa tới PLANNED_LAST_HOUR. Khoảng trống ở giữa do khách vô danh lấp.
 */
export function buildQueue(day: number, content: GameContent, seed: number, dayLengthMs = DAY_LENGTH_MS): QueuedVisit[] {
  const rng = createRng(seed * 7919 + day)
  const script = content.days.find((d) => d.day === day)
  const scripted = script?.visits ?? []
  const randomCount = script ? script.randomCount : RANDOM_ONLY_DAY_COUNT

  // Bốc khách ngẫu nhiên, không trùng trong cùng một ngày
  const pool = content.randomPool.filter((v) => (v.minDay ?? 1) <= day)
  const randoms: VisitScript[] = []
  while (randoms.length < randomCount && pool.length > 0) {
    const idx = pickWeighted(rng, pool)
    if (idx < 0) break
    randoms.push(pool[idx])
    pool.splice(idx, 1)
  }

  const visits = [...scripted]
  for (const r of randoms) {
    visits.splice(randInt(rng, 0, visits.length), 0, r)
  }

  const start = FIRST_ARRIVAL_MS
  const end = Math.max(start, msAtHour(PLANNED_LAST_HOUR, dayLengthMs))
  return visits.map((visit, i) => ({
    visit,
    arriveAtMs: Math.round(start + ((end - start) * i) / visits.length),
  }))
}

export function startDay(state: GameState, day: number, content: GameContent): GameState {
  const queue = buildQueue(day, content, state.seed, state.dayLengthMs)
  return {
    ...state,
    day,
    phase: 'open',
    paused: false,
    elapsedMs: 0,
    startMoney: state.money,
    startInventory: state.inventory,
    queue,
    current: null,
    nextArrivalInMs: FIRST_ARRIVAL_MS,
    arrivedToday: 0,
    todayLog: [],
    rngState: (state.seed * 7919 + day * 104729) >>> 0, // khác seed của buildQueue để 2 chuỗi ngẫu nhiên không trùng nhau
  }
}

export function nextDay(state: GameState, content: GameContent): GameState {
  if (state.phase !== 'night') return state
  if (state.day >= state.lastDay) return { ...state, phase: 'ended' }
  return startDay(state, state.day + 1, content)
}

export function newGame(content: GameContent, seed = Date.now() % 1_000_000): GameState {
  const base: GameState = {
    day: 1,
    lastDay: LAST_DAY,
    phase: 'night',
    paused: false,
    dayLengthMs: DAY_LENGTH_MS,
    elapsedMs: 0,
    money: START_MONEY,
    startMoney: START_MONEY,
    inventory: { ...START_INVENTORY },
    startInventory: { ...START_INVENTORY },
    queue: [],
    current: null,
    nextArrivalInMs: 0,
    arrivedToday: 0,
    todayLog: [],
    seed,
    rngState: 0,
  }
  return startDay(base, 1, content)
}

// ---------- Tổng kết ----------

export function findVisit(content: GameContent, visitId: string): VisitScript | undefined {
  for (const d of content.days) {
    const v = d.visits.find((x) => x.id === visitId)
    if (v) return v
  }
  return content.randomPool.find((x) => x.id === visitId)
}

/** Những câu chuyện đã nghe trong ngày và người chơi đã trả lời gì. */
export function todayStories(state: GameState, content: GameContent) {
  return state.todayLog.flatMap((o) => {
    if (o.kind !== 'story' || o.visitId === null || o.choiceIndex === undefined) return []
    const visit = findVisit(content, o.visitId)
    const choice = visit?.story?.choices[o.choiceIndex]
    return visit && choice ? [{ customer: visit.customer, said: choice.text }] : []
  })
}

export function summarizeDay(state: GameState) {
  let revenue = 0
  let restockCost = 0
  let sold = 0
  let outOfStock = 0
  let leftAngry = 0
  let wrongItem = 0
  for (const o of state.todayLog) {
    if (o.kind === 'sold') {
      sold++
      revenue += o.moneyDelta
    } else if (o.kind === 'restock') restockCost += -o.moneyDelta
    else if (o.kind === 'out-of-stock') outOfStock++
    else if (o.kind === 'left-angry') leftAngry++
    else if (o.kind === 'wrong-item') wrongItem++
  }
  return { revenue, restockCost, sold, outOfStock, leftAngry, wrongItem, startMoney: state.startMoney, endMoney: state.money }
}
