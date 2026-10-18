import { describe, expect, it } from 'vitest'
import { clockMinutes, msAtHour, timeOfDay } from './clock'
import { PLANNED_LAST_HOUR } from './config'
import { describeWants, makeFiller } from './filler'
import { createRng } from './rng'
import { fromSave, parseSave, toSave } from './save'
import { apologize, buildQueue, choose, give, newGame, nextDay, resolveGive, restock, setPaused, summarizeDay, tick, todayStories } from './game'
import type { GameContent, GameState, VisitScript } from './types'

const lines = { greet: 'chào', thanks: 'cảm ơn', outOfStock: 'hết', leftAngry: 'giận', wrongItem: 'nhầm' }

const visit = (id: string, wants: VisitScript['wants'], patienceMs = 10_000): VisitScript => ({
  id,
  customer: id,
  wants,
  patienceMs,
  lines,
})

const content: GameContent = {
  items: {
    mi: { id: 'mi', name: 'Mì', buyPrice: 3_000, sellPrice: 5_000, unit: 'gói', noun: 'mì' },
    gao: { id: 'gao', name: 'Gạo', buyPrice: 10_000, sellPrice: 15_000, unit: 'ký', noun: 'gạo' },
  },
  days: [{ day: 1, randomCount: 0, visits: [visit('a', [{ itemId: 'mi', maxQty: 5 }])] }],
  randomPool: [
    { ...visit('r1', [{ itemId: 'mi', maxQty: 1 }]), weight: 1 },
    { ...visit('r2', [{ itemId: 'mi', maxQty: 1 }]), weight: 1, minDay: 3 },
  ],
  fillers: {
    customers: [{ name: 'Chú xóm trên', self: 'chú', player: 'con' }],
    items: { mi: { weight: 1, maxQty: 3 }, gao: { weight: 1, maxQty: 2 } },
    lines: {
      greet: ['bán {self} {wants} nghen {player}'],
      thanks: ['cảm ơn {player}'],
      outOfStock: ['hết hả'],
      leftAngry: ['lâu quá'],
      wrongItem: ['{self} mua {wants} mà'],
    },
  },
}

describe('resolveGive', () => {
  const wantsMi = visit('x', [{ itemId: 'mi', maxQty: 3 }])

  it('đưa đúng món, đúng số lượng', () => {
    const o = resolveGive(wantsMi, { mi: 2 }, { mi: 10 }, content.items)
    expect(o.kind).toBe('sold')
    expect(o.moneyDelta).toBe(10_000)
    expect(o.inventoryDelta).toEqual({ mi: -2 })
  })

  it('đưa dư so với tối đa: khách chỉ lấy tối đa', () => {
    const o = resolveGive(wantsMi, { mi: 8 }, { mi: 10 }, content.items)
    expect(o.inventoryDelta).toEqual({ mi: -3 })
  })

  it('không bán vượt tồn kho dù khay ghi nhiều hơn', () => {
    const o = resolveGive(wantsMi, { mi: 3 }, { mi: 1 }, content.items)
    expect(o.inventoryDelta).toEqual({ mi: -1 })
  })

  it('có món khách không cần → đưa nhầm, không bán gì', () => {
    const o = resolveGive(wantsMi, { mi: 1, gao: 1 }, { mi: 5, gao: 5 }, content.items)
    expect(o.kind).toBe('wrong-item')
    expect(o.moneyDelta).toBe(0)
  })

  it('khay rỗng → đưa nhầm', () => {
    expect(resolveGive(wantsMi, {}, { mi: 5 }, content.items).kind).toBe('wrong-item')
    expect(resolveGive(wantsMi, { mi: 0 }, { mi: 5 }, content.items).kind).toBe('wrong-item')
  })

  it('khách cần 2 món, đưa đủ 1 món vẫn bán được', () => {
    const v = visit('x', [
      { itemId: 'mi', maxQty: 2 },
      { itemId: 'gao', maxQty: 2 },
    ])
    const o = resolveGive(v, { gao: 1 }, { gao: 5 }, content.items)
    expect(o.kind).toBe('sold')
    expect(o.moneyDelta).toBe(15_000)
  })
})

describe('vòng đời khách', () => {
  const arrive = () => {
    let s = newGame(content, 1)
    s = { ...s, inventory: { mi: 3, gao: 3 } }
    return tick(s, s.nextArrivalInMs, content) // khách đầu tiên tới
  }

  it('khách tới sau khoảng chờ', () => {
    const s = arrive()
    expect(s.current?.visit.id).toBe('a')
    expect(s.current?.status).toBe('waiting')
  })

  it('đưa đúng: cộng tiền, khách cảm ơn rồi đi', () => {
    let s = give(arrive(), { mi: 3 }, content)
    expect(s.money).toBe(150_000 + 15_000)
    expect(s.inventory.mi).toBe(0)
    expect(s.current?.line).toBe('cảm ơn')
    s = tick(s, 5_000, content)
    expect(s.current).toBeNull()
  })

  it('đưa nhầm: khách nhắc lại, mất 25% kiên nhẫn, vẫn đứng chờ', () => {
    const s = give(arrive(), { gao: 1 }, content)
    expect(s.current?.status).toBe('waiting')
    expect(s.current?.line).toBe('nhầm')
    expect(s.current?.patienceLeftMs).toBe(7_500)
    expect(s.inventory.gao).toBe(3)
    expect(s.todayLog.at(-1)?.kind).toBe('wrong-item')
  })

  it('đưa nhầm nhiều lần thì khách bỏ về', () => {
    let s = arrive()
    for (let i = 0; i < 4; i++) s = give(s, { gao: 1 }, content)
    expect(s.current?.status).toBe('leaving')
    expect(s.current?.line).toBe('giận')
  })

  it('báo hết hàng: khách về, ghi log out-of-stock', () => {
    const s = apologize(arrive())
    expect(s.current?.status).toBe('leaving')
    expect(s.current?.line).toBe('hết')
    expect(s.todayLog.at(-1)?.kind).toBe('out-of-stock')
  })

  it('hết kiên nhẫn thì bỏ về và ghi log left-angry', () => {
    const s = tick(arrive(), 10_001, content)
    expect(s.current?.status).toBe('leaving')
    expect(s.current?.line).toBe('giận')
    expect(s.todayLog.at(-1)?.kind).toBe('left-angry')
  })

  it('không đưa hàng được khi khách đang rời đi', () => {
    const once = give(arrive(), { mi: 1 }, content)
    expect(give(once, { mi: 1 }, content)).toBe(once)
    expect(apologize(once)).toBe(once)
  })

  it('khách có tên về rồi thì khách vô danh tới tiếp, không đóng cửa sớm', () => {
    let s = give(arrive(), { mi: 1 }, content)
    for (let i = 0; i < 20; i++) s = tick(s, 1_000, content)
    expect(s.phase).toBe('open')
    expect(s.current?.visit.id).toMatch(/^filler-/)
    expect(s.current?.visit.story).toBeUndefined()
  })

  it('sát giờ đóng cửa thì không đón khách vô danh nữa', () => {
    const s0 = newGame({ ...content, days: [] , randomPool: [] }, 1)
    const s = tick({ ...s0, elapsedMs: s0.dayLengthMs - 5_000 }, s0.nextArrivalInMs, content)
    expect(s.current).toBeNull()
  })

  it('hết giờ thì đóng cửa dù khách đang chờ', () => {
    const s0 = arrive()
    const s = tick({ ...s0, elapsedMs: s0.dayLengthMs - 50 }, 100, content)
    expect(s.phase).toBe('night')
  })
})

describe('trò chuyện sau khi bán', () => {
  const story = {
    text: 'chuyện',
    choices: [
      { text: 'A', reply: 'đáp A' },
      { text: 'B', reply: 'đáp B' },
      { text: 'C', reply: 'đáp C' },
    ],
  }
  const storyContent: GameContent = {
    ...content,
    days: [{ day: 1, randomCount: 0, visits: [{ ...visit('s', [{ itemId: 'mi', maxQty: 2 }]), story }] }],
  }
  const arrive = (inventory: Record<string, number> = { mi: 5 }) => {
    let s: GameState = { ...newGame(storyContent, 1), inventory }
    s = tick(s, s.nextArrivalInMs, storyContent)
    return s
  }

  it('bán xong thì khách kể chuyện thay vì cảm ơn', () => {
    const s = give(arrive(), { mi: 1 }, storyContent)
    expect(s.current?.status).toBe('story')
    expect(s.current?.line).toBe('chuyện')
    expect(s.money).toBe(150_000 + 5_000)
  })

  it('đang trò chuyện: kiên nhẫn đứng yên, đồng hồ ngày vẫn chạy', () => {
    const s0 = give(arrive(), { mi: 1 }, storyContent)
    const s1 = tick(s0, 60_000, storyContent)
    expect(s1.current?.status).toBe('story')
    expect(s1.current?.patienceLeftMs).toBe(s0.current?.patienceLeftMs)
    expect(s1.elapsedMs).toBe(s0.elapsedMs + 60_000)
  })

  it('chọn câu trả lời: khách đáp lại rồi đi, log ghi lựa chọn', () => {
    let s = choose(give(arrive(), { mi: 1 }, storyContent), 1)
    expect(s.current?.status).toBe('leaving')
    expect(s.current?.line).toBe('đáp B')
    expect(s.todayLog.at(-1)).toMatchObject({ kind: 'story', choiceIndex: 1 })
    expect(todayStories(s, storyContent)).toEqual([{ customer: 's', said: 'B' }])
    s = tick(s, 10_000, storyContent)
    expect(s.current).toBeNull()
  })

  it('lựa chọn không tồn tại thì bỏ qua', () => {
    const s = give(arrive(), { mi: 1 }, storyContent)
    expect(choose(s, 5)).toBe(s)
    expect(choose(s, -1)).toBe(s)
  })

  it('hết hàng thì mất câu chuyện', () => {
    const s = apologize(arrive({ mi: 0 }))
    expect(s.current?.status).toBe('leaving')
    expect(choose(s, 0)).toBe(s)
  })

  it('hết giờ lúc đang trò chuyện: chờ trả lời xong mới đóng cửa', () => {
    let s = give(arrive(), { mi: 1 }, storyContent)
    s = tick(s, 10 * 60 * 1000, storyContent)
    expect(s.phase).toBe('open')
    s = choose(s, 0)
    s = tick(s, 10_000, storyContent)
    expect(s.phase).toBe('night')
  })
})

describe('nhập hàng', () => {
  it('trừ tiền, cộng kho', () => {
    const r = restock(newGame(content, 1), 'gao', 2, content)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.state.money).toBe(150_000 - 20_000)
      expect(r.state.inventory.gao).toBe(2)
    }
  })

  it('không đủ tiền thì từ chối', () => {
    const r = restock(newGame(content, 1), 'gao', 1000, content)
    expect(r).toEqual({ ok: false, reason: 'no-money' })
  })

  it('số lượng không hợp lệ thì từ chối', () => {
    expect(restock(newGame(content, 1), 'gao', -1, content).ok).toBe(false)
    expect(restock(newGame(content, 1), 'gao', 1.5, content).ok).toBe(false)
  })
})

describe('khách vô danh', () => {
  it('câu chào nói rõ món và số lượng, câu nhầm nhắc lại món', () => {
    const v = makeFiller(createRng(3), 1, 0, content)!
    const wants = describeWants(v.wants, content)
    expect(v.lines.greet).toBe(`Bán chú ${wants} nghen con`)
    expect(v.lines.wrongItem).toBe(`Chú mua ${wants} mà`)
    expect(v.customer).toBe('Chú xóm trên')
  })

  it('số lượng không vượt maxQty, không mua trùng món', () => {
    for (let seed = 0; seed < 50; seed++) {
      const v = makeFiller(createRng(seed), 1, 0, content)!
      expect(new Set(v.wants.map((w) => w.itemId)).size).toBe(v.wants.length)
      for (const w of v.wants) expect(w.maxQty).toBeLessThanOrEqual(content.fillers.items[w.itemId].maxQty)
    }
  })

  it('content thiếu thì không sinh khách, không làm sập game', () => {
    const empty = { ...content, fillers: { ...content.fillers, customers: [] } }
    expect(makeFiller(createRng(1), 1, 0, empty)).toBeNull()
    const s0 = newGame({ ...empty, days: [], randomPool: [] }, 1)
    expect(tick(s0, s0.nextArrivalInMs, empty).current).toBeNull()
  })

  it('cùng seed thì cùng chuỗi khách vô danh', () => {
    const run = () => {
      let s = newGame({ ...content, days: [], randomPool: [] }, 9)
      const ids: string[] = []
      for (let i = 0; i < 200; i++) {
        s = tick(s, 1_000, content)
        if (s.current?.status === 'waiting') {
          ids.push(s.current.line)
          s = apologize(s)
        }
      }
      return ids
    }
    expect(run().length).toBeGreaterThan(3)
    expect(run()).toEqual(run())
  })
})

describe('chỗ trống giới tính trong mẫu câu khách vô danh', () => {
  it('makeFiller thay {self}/{player}/{wants} nhưng giữ {nam|nữ} và {name} để UI thay lúc hiển thị', () => {
    const c: GameContent = {
      ...content,
      fillers: {
        ...content.fillers,
        customers: [{ name: 'Con nhỏ xóm dưới', self: 'con', player: '{anh|chị}' }],
        lines: { ...content.fillers.lines, greet: ['{player} {name} ơi, bán {self} {wants}'] },
      },
    }
    const f = makeFiller(createRng(1), 1, 0, c)
    expect(f?.lines.greet).toMatch(/^\{anh\|chị\} \{name\} ơi, bán con /)
  })
})

describe('lịch khách có tên', () => {
  const many: GameContent = {
    ...content,
    days: [{ day: 1, randomCount: 0, visits: ['a', 'b', 'c', 'd'].map((id) => visit(id, [{ itemId: 'mi', maxQty: 1 }])) }],
  }

  it('rải đều, giữ thứ tự, tới hạn trước PLANNED_LAST_HOUR', () => {
    const q = buildQueue(1, many, 1, 300_000)
    expect(q.map((x) => x.visit.id)).toEqual(['a', 'b', 'c', 'd'])
    const times = q.map((x) => x.arriveAtMs)
    expect([...times].sort((x, y) => x - y)).toEqual(times)
    expect(times.at(-1)!).toBeLessThan(msAtHour(PLANNED_LAST_HOUR, 300_000))
  })

  it('khách có tên tới hạn thì được mời trước khách vô danh', () => {
    let s = newGame(many, 1)
    s = tick(s, s.nextArrivalInMs, many)
    expect(s.current?.visit.id).toBe('a')
    // Cho khách a về, tua tới lúc b tới hạn
    s = apologize(s)
    s = tick(s, 10_000, many)
    s = { ...s, elapsedMs: s.queue[0].arriveAtMs }
    s = tick(s, s.nextArrivalInMs, many)
    expect(s.current?.visit.id).toBe('b')
  })
})

describe('ngày mới và tổng kết', () => {
  it('khách ngẫu nhiên không trùng và tôn trọng minDay', () => {
    const c = { ...content, days: [] }
    const day1 = buildQueue(1, c, 42).map((q) => q.visit.id)
    expect(day1).not.toContain('r2')
    expect(new Set(day1).size).toBe(day1.length)
  })

  it('cùng seed cho cùng hàng đợi', () => {
    expect(buildQueue(5, content, 7)).toEqual(buildQueue(5, content, 7))
  })

  it('tổng kết khớp với log', () => {
    let s = newGame(content, 1)
    const r = restock(s, 'mi', 2, content)
    if (r.ok) s = r.state
    s = tick(s, s.nextArrivalInMs, content)
    s = give(s, { gao: 1 }, content) // nhầm 1 lần
    s = give(s, { mi: 2 }, content)
    const sum = summarizeDay(s)
    expect(sum.restockCost).toBe(6_000)
    expect(sum.wrongItem).toBe(1)
    expect(sum.revenue).toBe(sum.endMoney - sum.startMoney + sum.restockCost)
  })

  it('sang ngày mới reset log, giữ tiền và kho', () => {
    let s = tick(newGame(content, 1), 10 * 60 * 1000, content)
    const money = s.money
    s = nextDay(s, content)
    expect(s.day).toBe(2)
    expect(s.phase).toBe('open')
    expect(s.todayLog).toEqual([])
    expect(s.money).toBe(money)
  })
})

describe('tạm dừng', () => {
  it('đang tạm dừng thì đồng hồ và kiên nhẫn đứng yên', () => {
    let s = newGame(content, 1)
    s = tick(s, s.nextArrivalInMs, content)
    const paused = setPaused(s, true)
    expect(tick(paused, 5_000, content)).toBe(paused)
    const resumed = tick(setPaused(paused, false), 1_000, content)
    expect(resumed.elapsedMs).toBe(s.elapsedMs + 1_000)
  })

  it('không đổi gì thì trả về đúng state cũ', () => {
    const s = newGame(content, 1)
    expect(setPaused(s, false)).toBe(s)
    const night = { ...s, phase: 'night' as const }
    expect(setPaused(night, true)).toBe(night)
  })
})

describe('đồng hồ trong game', () => {
  const day = 300_000

  it('mở cửa 6:00, giữa ngày 13:00, hết giờ 20:00', () => {
    expect(clockMinutes(0, day)).toBe(6 * 60)
    expect(clockMinutes(day / 2, day)).toBe(13 * 60)
    expect(clockMinutes(day, day)).toBe(20 * 60)
  })

  it('nhảy từng 10 phút, làm tròn xuống', () => {
    // 1 phút game ≈ 357ms thật: 3s là 6:08 → hiện 6:00, 4s là 6:11 → hiện 6:10
    expect(clockMinutes(3_000, day)).toBe(6 * 60)
    expect(clockMinutes(4_000, day)).toBe(6 * 60 + 10)
  })

  it('quá giờ lúc đang trò chuyện thì đứng ở 20:00', () => {
    expect(clockMinutes(day + 20_000, day)).toBe(20 * 60)
  })

  it('chia buổi sáng / trưa / chiều / tối', () => {
    expect(timeOfDay(6 * 60)).toBe('morning')
    expect(timeOfDay(11 * 60)).toBe('noon')
    expect(timeOfDay(13 * 60)).toBe('afternoon')
    expect(timeOfDay(18 * 60)).toBe('evening')
  })
})

describe('lưu game', () => {
  /** Bán 2 gói mì cho khách đầu tiên và nhập thêm 3 ký gạo: tiền và kho đã khác đầu ngày */
  const midDay = () => {
    let s = newGame(content, 5)
    const r = restock(s, 'mi', 3, content)
    if (r.ok) s = r.state
    s = tick(s, s.nextArrivalInMs, content)
    return give(s, { mi: 2 }, content)
  }
  /** Cho thời gian trôi tới khi đóng cửa (khách đang về thì engine chờ khách đi hẳn) */
  const closeShop = (s: GameState) => {
    for (let i = 0; i < 20 && s.phase === 'open'; i++) s = tick(s, 60_000, content)
    return s
  }
  /** Kho giả của test chỉ có mì và gạo; START_INVENTORY dùng id thật nên fromSave bỏ bớt */
  const known = (inv: GameState['inventory']) => ({ mi: inv.mi ?? 0, gao: inv.gao ?? 0 })

  it('đang mở cửa thì lưu đầu ngày hôm nay, bỏ qua những gì đã bán/nhập', () => {
    const start = newGame(content, 5)
    const s = midDay()
    expect(s.money).not.toBe(start.money)
    expect(s.inventory).not.toEqual(start.inventory)
    expect(toSave(s)).toEqual({ version: 1, seed: 5, day: 1, money: start.money, inventory: start.inventory })
  })

  it('buổi tối thì lưu đầu ngày mai, với tiền và kho cuối ngày', () => {
    const night = closeShop(midDay())
    expect(night.phase).toBe('night')
    expect(toSave(night)).toMatchObject({ day: 2, money: night.money, inventory: night.inventory })
  })

  it('tối ngày cuối vẫn lưu đầu ngày cuối; hết game thì xoá bản lưu', () => {
    const s = newGame(content, 5)
    const lastNight = { ...s, day: s.lastDay, phase: 'night' as const, money: 999 }
    expect(toSave(lastNight)).toMatchObject({ day: s.lastDay, money: s.startMoney })
    expect(toSave({ ...s, phase: 'ended' })).toBeNull()
  })

  it('dựng lại đúng ngày đó: cùng lịch khách, tiền, kho như lần chơi trước', () => {
    const night = closeShop(midDay())
    const played = nextDay(night, content) // chơi tiếp bình thường, không tải lại
    const save = toSave(night)
    if (!save) throw new Error('phải có bản lưu')
    const loaded = fromSave(parseSave(JSON.stringify(save))!, content)
    expect(loaded).toEqual({ ...played, inventory: known(played.inventory), startInventory: known(played.inventory) })
  })

  it('món mới trong content thì kho = 0, món không còn trong content thì bỏ', () => {
    const s = fromSave({ version: 1, seed: 1, day: 3, money: 100, inventory: { mi: 4, banh: 9 } }, content)
    expect(s.inventory).toEqual({ mi: 4, gao: 0 })
    expect(s.startInventory).toEqual(s.inventory)
    expect(s.day).toBe(3)
    expect(s.phase).toBe('open')
  })

  it('bản lưu hỏng hoặc sai version thì coi như chưa có', () => {
    const ok = { version: 1, seed: 1, day: 2, money: 0, inventory: {} }
    expect(parseSave(null)).toBeNull()
    expect(parseSave('{hỏng')).toBeNull()
    expect(parseSave('null')).toBeNull()
    expect(parseSave(JSON.stringify({ ...ok, version: 2 }))).toBeNull()
    expect(parseSave(JSON.stringify({ ...ok, day: 0 }))).toBeNull()
    expect(parseSave(JSON.stringify({ ...ok, day: 999 }))).toBeNull()
    expect(parseSave(JSON.stringify({ ...ok, money: 'nhiều' }))).toBeNull()
    expect(parseSave(JSON.stringify(ok))).toEqual(ok)
  })

  it('món sai kiểu trong kho thì bỏ riêng món đó', () => {
    const raw = JSON.stringify({ version: 1, seed: 1, day: 2, money: 0, inventory: { mi: 3, gao: -1, keo: 'x' } })
    expect(parseSave(raw)?.inventory).toEqual({ mi: 3 })
  })
})
