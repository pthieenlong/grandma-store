import { describe, expect, it } from 'vitest'
import { newGame } from '../engine/game'
import type { GameContent } from '../engine/types'
import { type AudioSources, AudioController, musicFor, sfxForOutcome, type SoundFactory } from './AudioController'
import { type FrameScheduler, GameController } from './GameController'
import { type KeyValueStorage, SettingsController } from './SettingsController'

const sources: AudioSources = {
  sfx: { coin: ['coin'], wrong: ['wrong'], bell: ['bell'], tap: ['tap'], angry: ['angry'], restock: ['restock'], night: ['night'] },
  music: { day: ['day'], evening: ['evening'] },
}

/** Factory giả: mỗi âm thanh ghi lại các lệnh nhận được; fade xong ngay lập tức. */
function fakeSounds() {
  const log: string[] = []
  const state = new Map<string, { playing: boolean; volume: number }>()
  const factory: SoundFactory = ({ src }) => {
    const name = src[0]
    const s = { playing: false, volume: 1 }
    state.set(name, s)
    return {
      play: () => {
        s.playing = true
        log.push(`play ${name}`)
      },
      stop: () => {
        s.playing = false
        log.push(`stop ${name}`)
      },
      pause: () => {
        s.playing = false
        log.push(`pause ${name}`)
      },
      playing: () => s.playing,
      getVolume: () => s.volume,
      setVolume: (v) => {
        s.volume = v
      },
      fade: (_from, to, _ms, onDone) => {
        s.volume = to
        onDone?.()
      },
    }
  }
  return { factory, log, state }
}

const memory = (): KeyValueStorage => {
  const data: Record<string, string> = {}
  return { getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) }
}

const setup = () => {
  const settings = new SettingsController(memory())
  const fake = fakeSounds()
  const audio = new AudioController(settings, sources, fake.factory)
  return { settings, audio, ...fake }
}

describe('luật âm thanh', () => {
  it('Outcome nào kêu tiếng gì', () => {
    expect(sfxForOutcome('sold')).toBe('coin')
    expect(sfxForOutcome('wrong-item')).toBe('wrong')
    expect(sfxForOutcome('left-angry')).toBe('angry')
    expect(sfxForOutcome('restock')).toBe('restock')
    expect(sfxForOutcome('story')).toBeNull()
  })

  it('nhạc ngày trước 17h, nhạc chiều từ 17h và buổi tối', () => {
    const content: GameContent = { items: {}, days: [], randomPool: [], fillers: { customers: [], items: {}, lines: { greet: [], thanks: [], outOfStock: [], leftAngry: [], wrongItem: [] } } }
    const s = newGame(content, 1)
    expect(musicFor(s)).toBe('day')
    expect(musicFor({ ...s, elapsedMs: s.dayLengthMs * 0.9 })).toBe('evening')
    expect(musicFor({ ...s, phase: 'night' })).toBe('evening')
  })
})

describe('AudioController', () => {
  it('chưa start (chưa chạm) thì im lặng hoàn toàn', () => {
    const { audio, log } = setup()
    audio.setMusic('day')
    audio.playSfx('coin')
    expect(log).toEqual([])
    audio.start()
    expect(log).toEqual(['play day'])
  })

  it('âm lượng hiệu ứng theo cài đặt; tắt tiếng thì không phát', () => {
    const { audio, settings, log, state } = setup()
    audio.start()
    settings.setSfxVolume(0.5)
    audio.playSfx('coin')
    expect(state.get('coin')!.volume).toBeCloseTo(0.5 * 0.9)
    settings.toggleMute()
    audio.playSfx('coin')
    expect(log.filter((l) => l === 'play coin')).toHaveLength(1)
  })

  it('đổi nhạc thì bài cũ nhỏ dần rồi dừng, bài mới to dần', () => {
    const { audio, log, state } = setup()
    audio.start()
    audio.setMusic('day')
    audio.setMusic('evening')
    expect(log).toEqual(['play day', 'stop day', 'play evening'])
    expect(state.get('evening')!.volume).toBeGreaterThan(0)
    audio.setMusic('evening') // cùng bài: không làm gì
    expect(log).toHaveLength(3)
  })

  it('đổi âm lượng nhạc thì bài đang phát đổi theo, tắt tiếng thì về 0', () => {
    const { audio, settings, state } = setup()
    audio.start()
    audio.setMusic('day')
    settings.setMusicVolume(1)
    const loud = state.get('day')!.volume
    settings.setMusicVolume(0.2)
    expect(state.get('day')!.volume).toBeLessThan(loud)
    settings.toggleMute()
    expect(state.get('day')!.volume).toBe(0)
  })

  it('app bị ẩn thì dừng nhạc và hiệu ứng, quay lại phát tiếp', () => {
    const { audio, log } = setup()
    audio.start()
    audio.setMusic('day')
    audio.setAppHidden(true)
    audio.playSfx('coin')
    audio.setAppHidden(false)
    expect(log).toEqual(['play day', 'pause day', 'play day'])
  })
})

describe('AudioController + GameController', () => {
  const content: GameContent = {
    items: { mi: { id: 'mi', name: 'Mì', buyPrice: 3_000, sellPrice: 5_000, unit: 'gói', noun: 'mì' } },
    days: [{ day: 1, randomCount: 0, visits: [{ id: 'a', customer: 'A', wants: [{ itemId: 'mi', maxQty: 5 }], patienceMs: 60_000, lines: { greet: 'g', thanks: 't', outOfStock: 'o', leftAngry: 'l', wrongItem: 'w' } }] }],
    randomPool: [],
    fillers: { customers: [], items: {}, lines: { greet: [], thanks: [], outOfStock: [], leftAngry: [], wrongItem: [] } },
  }

  const manualScheduler = () => {
    let now = 0
    const pending = new Map<number, (n: number) => void>()
    let id = 1
    const scheduler: FrameScheduler = {
      request: (cb) => (pending.set(id, cb), id++),
      cancel: (i) => void pending.delete(i),
      now: () => now,
    }
    const flush = (ms: number) => {
      for (let t = 0; t < ms; t += 20) {
        now += 20
        const cbs = [...pending.values()]
        pending.clear()
        cbs.forEach((cb) => cb(now))
      }
    }
    return { scheduler, flush }
  }

  it('khách tới thì chuông, bán được thì "ting", đóng cửa thì nhạc chuông', () => {
    const { audio, log } = setup()
    const { scheduler, flush } = manualScheduler()
    const game = new GameController(content, { seed: 1, scheduler })
    audio.bindGame(game)
    audio.start()
    game.start()
    game.restock('mi', 1)
    flush(5_000) // khách a tới
    game.give({ mi: 1 })
    flush(game.getSnapshot().dayLengthMs) // hết ngày
    expect(log).toEqual(expect.arrayContaining(['play restock', 'play bell', 'play coin', 'play night']))
    expect(log.indexOf('play bell')).toBeLessThan(log.indexOf('play coin'))
  })
})
