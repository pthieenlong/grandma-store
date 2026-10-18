import { describe, expect, it } from 'vitest'
import { newGame } from '../engine/game'
import type { GameContent, VisitScript } from '../engine/types'
import { type FrameScheduler, GameController } from './GameController'
import { SaveController, type SaveStorage } from './SaveController'

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

const KEY = 'tiem-ba-ngoai:save:v1'

function memoryStorage(initial: Record<string, string> = {}) {
  const data: Record<string, string> = { ...initial }
  let writes = 0
  const storage: SaveStorage = {
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      writes++
      data[k] = v
    },
    removeItem: (k) => {
      writes++
      delete data[k]
    },
  }
  return { storage, data, writes: () => writes }
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
  const flush = (ms: number) => {
    for (let t = 0; t < ms; t += 20) {
      now += 20
      const callbacks = [...pending.values()]
      pending.clear()
      for (const cb of callbacks) cb(now)
    }
  }
  return { scheduler, flush }
}

/** Game còn 1 giây là đóng cửa, quầy trống, không có khách nào sắp tới */
function gameNearClosing(seed: number, day = 1) {
  const fake = fakeScheduler()
  const s = newGame(content, seed)
  const initialState = { ...s, day, elapsedMs: s.dayLengthMs - 1_000, queue: [], nextArrivalInMs: 60_000 }
  const game = new GameController(content, { initialState, scheduler: fake.scheduler })
  return { game, flush: fake.flush }
}

describe('SaveController', () => {
  it('chưa có bản lưu thì restore trả về null', () => {
    const save = new SaveController(memoryStorage().storage)
    expect(save.getSnapshot().savedDay).toBeNull()
    expect(save.restore(content)).toBeNull()
  })

  it('chỉ gắn vào game thì chưa ghi gì; bấm ván mới mới có bản lưu ngày 1', () => {
    const mem = memoryStorage()
    const save = new SaveController(mem.storage)
    const game = new GameController(content, { seed: 1 })
    save.bindGame(game)
    expect(mem.writes()).toBe(0)
    game.newGame()
    expect(save.getSnapshot().savedDay).toBe(1)
    expect(JSON.parse(mem.data[KEY])).toMatchObject({ day: 1, seed: game.getSnapshot().seed })
  })

  it('đồng hồ chạy và tạm dừng trong ngày thì không ghi', () => {
    const mem = memoryStorage()
    const { game, flush } = gameNearClosing(3)
    new SaveController(mem.storage).bindGame(game)
    game.start()
    flush(500)
    game.pause()
    game.resume()
    expect(game.getSnapshot().phase).toBe('open')
    expect(mem.writes()).toBe(0)
  })

  it('đóng cửa thì lưu đầu ngày mai; tải lại thì vào thẳng ngày mai', () => {
    const mem = memoryStorage()
    const { game, flush } = gameNearClosing(3)
    const save = new SaveController(mem.storage)
    save.bindGame(game)
    game.start()
    flush(2_000)
    expect(game.getSnapshot().phase).toBe('night')
    expect(save.getSnapshot().savedDay).toBe(2)

    const reloaded = new SaveController(mem.storage).restore(content)
    expect(reloaded).toMatchObject({ day: 2, phase: 'open', seed: 3, money: game.getSnapshot().money })
  })

  it('hết game (Đón Tết) thì xoá bản lưu', () => {
    const mem = memoryStorage()
    const { game, flush } = gameNearClosing(2, newGame(content).lastDay)
    const save = new SaveController(mem.storage)
    save.bindGame(game)
    game.start()
    flush(2_000) // tối ngày cuối: vẫn giữ bản lưu đầu ngày cuối
    expect(save.getSnapshot().savedDay).toBe(game.getSnapshot().lastDay)
    game.nextDay()
    expect(game.getSnapshot().phase).toBe('ended')
    expect(mem.data[KEY]).toBeUndefined()
    expect(save.getSnapshot().savedDay).toBeNull()
  })

  it('bản lưu hỏng thì coi như chưa có', () => {
    const save = new SaveController(memoryStorage({ [KEY]: '{hỏng' }).storage)
    expect(save.getSnapshot().savedDay).toBeNull()
    expect(save.restore(content)).toBeNull()
  })

  it('localStorage ném lỗi thì game vẫn chạy', () => {
    const broken: SaveStorage = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    }
    const save = new SaveController(broken)
    const game = new GameController(content, { seed: 1 })
    save.bindGame(game)
    expect(() => game.newGame()).not.toThrow()
    expect(save.getSnapshot().savedDay).toBe(1)
  })
})
