import { describe, expect, it } from 'vitest'
import type { GameContent, Outcome, VisitScript } from '../engine/types'
import { type FrameScheduler, GameController } from './GameController'

const lines = { greet: 'chào', thanks: 'cảm ơn', outOfStock: 'hết', leftAngry: 'giận', wrongItem: 'nhầm' }
const visit = (id: string): VisitScript => ({ id, customer: id, wants: [{ itemId: 'mi', maxQty: 5 }], patienceMs: 10_000, lines })

const content: GameContent = {
  items: { mi: { id: 'mi', name: 'Mì', buyPrice: 3_000, sellPrice: 5_000, unit: 'gói', noun: 'mì' } },
  days: [{ day: 1, randomCount: 0, visits: [visit('a')] }],
  randomPool: [],
  fillers: {
    customers: [{ name: 'Chú', self: 'chú', player: 'con' }],
    items: { mi: { weight: 1, maxQty: 2 } },
    lines: { greet: ['{wants}'], thanks: ['x'], outOfStock: ['x'], leftAngry: ['x'], wrongItem: ['{wants}'] },
  },
}

/** Scheduler giả: frame chỉ chạy khi test gọi flush(ms). */
function fakeScheduler() {
  let now = 0
  let nextId = 1
  const pending = new Map<number, (now: number) => void>()
  const scheduler: FrameScheduler = {
    request: (cb) => {
      pending.set(nextId, cb)
      return nextId++
    },
    cancel: (id) => {
      pending.delete(id)
    },
    now: () => now,
  }
  /** Cho thời gian trôi `ms`, chạy từng frame 20ms (chia hết cho các mốc test dùng). */
  const flush = (ms: number) => {
    for (let t = 0; t < ms; t += 20) {
      now += 20
      const callbacks = [...pending.values()]
      pending.clear()
      for (const cb of callbacks) cb(now)
    }
  }
  return { scheduler, flush, isRunning: () => pending.size > 0 }
}

const setup = () => {
  const fake = fakeScheduler()
  const game = new GameController(content, { seed: 1, scheduler: fake.scheduler })
  return { game, ...fake }
}

describe('GameController', () => {
  it('chưa start thì đồng hồ chưa chạy', () => {
    const { game, flush } = setup()
    flush(1_000)
    expect(game.getSnapshot().elapsedMs).toBe(0)
  })

  it('start rồi thì đồng hồ chạy theo frame, gom nhịp khoảng 100ms', () => {
    const { game, flush } = setup()
    game.start()
    flush(1_000)
    const { elapsedMs } = game.getSnapshot()
    expect(elapsedMs).toBeGreaterThanOrEqual(900)
    expect(elapsedMs).toBeLessThanOrEqual(1_000)
  })

  it('tạm dừng thì tắt vòng lặp, chơi tiếp thì chạy lại', () => {
    const { game, flush, isRunning } = setup()
    game.start()
    flush(500)
    game.pause()
    expect(isRunning()).toBe(false)
    const frozen = game.getSnapshot().elapsedMs
    flush(1_000)
    expect(game.getSnapshot().elapsedMs).toBe(frozen)
    game.resume()
    flush(500)
    expect(game.getSnapshot().elapsedMs).toBeGreaterThan(frozen)
  })

  it('hết giờ thì vòng lặp tự tắt, sang ngày mới thì tự chạy lại', () => {
    const { game, flush, isRunning } = setup()
    game.start()
    flush(game.getSnapshot().dayLengthMs + 1_000)
    expect(game.getSnapshot().phase).toBe('night')
    expect(isRunning()).toBe(false)
    game.nextDay()
    expect(game.getSnapshot().day).toBe(2)
    expect(isRunning()).toBe(true)
  })

  it('báo cho subscriber khi state đổi, hành động không hợp lệ thì không báo', () => {
    const { game } = setup()
    let calls = 0
    const unsubscribe = game.subscribe(() => calls++)
    game.apologize() // chưa có khách: không hợp lệ
    expect(calls).toBe(0)
    game.restock('mi', 1)
    expect(calls).toBe(1)
    unsubscribe()
    game.restock('mi', 1)
    expect(calls).toBe(1)
  })

  it('restock trả về false khi không nhập được', () => {
    const { game } = setup()
    expect(game.restock('mi', 1_000)).toBe(false)
    expect(game.restock('khong-co', 1)).toBe(false)
  })

  it('onOutcome nhận từng Outcome mới', () => {
    const { game, flush } = setup()
    const seen: Outcome['kind'][] = []
    game.onOutcome((o) => seen.push(o.kind))
    game.restock('mi', 2)
    game.start()
    flush(5_000) // khách 'a' tới
    game.give({ mi: 9 }) // dư so với tồn kho → vẫn bán được
    expect(seen).toEqual(['restock', 'sold'])
  })

  it('start gọi 2 lần (StrictMode) không chạy 2 vòng lặp', () => {
    const { game, flush } = setup()
    game.start()
    game.start()
    flush(1_000)
    expect(game.getSnapshot().elapsedMs).toBeLessThanOrEqual(1_000)
  })
})

describe('GameController: rời app', () => {
  it('app bị ẩn lúc đang mở tiệm thì tự tạm dừng, quay lại vẫn dừng chờ người chơi', () => {
    const { game, flush, isRunning } = setup()
    game.start()
    flush(500)
    game.setAppHidden(true)
    expect(game.getSnapshot().paused).toBe(true)
    expect(isRunning()).toBe(false)
    game.setAppHidden(false)
    expect(game.getSnapshot().paused).toBe(true)
  })

  it('buổi tối (Tổng kết) thì ẩn app không đổi gì', () => {
    const { game, flush } = setup()
    game.start()
    flush(game.getSnapshot().dayLengthMs + 1_000)
    const night = game.getSnapshot()
    game.setAppHidden(true)
    expect(game.getSnapshot()).toBe(night)
  })
})
