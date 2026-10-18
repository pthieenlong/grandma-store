import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, type KeyValueStorage, SettingsController } from './SettingsController'

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial }
  const storage: KeyValueStorage = {
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = v
    },
  }
  return { storage, data }
}

const KEY = 'tiem-ba-ngoai:settings:v1'

describe('SettingsController', () => {
  it('chưa lưu gì thì dùng mặc định', () => {
    expect(new SettingsController(memoryStorage().storage).getSnapshot()).toEqual(DEFAULT_SETTINGS)
  })

  it('đổi cài đặt thì lưu ngay, mở lại vẫn còn', () => {
    const { storage } = memoryStorage()
    const a = new SettingsController(storage)
    a.setMusicVolume(0.2)
    a.setReduceMotion(true)
    const b = new SettingsController(storage)
    expect(b.getSnapshot()).toMatchObject({ musicVolume: 0.2, reduceMotion: true })
  })

  it('âm lượng bị kẹp trong 0–1', () => {
    const s = new SettingsController(memoryStorage().storage)
    s.setSfxVolume(5)
    expect(s.getSnapshot().sfxVolume).toBe(1)
    s.setSfxVolume(-1)
    expect(s.getSnapshot().sfxVolume).toBe(0)
    s.setSfxVolume(Number.NaN)
    expect(s.getSnapshot().sfxVolume).toBe(0)
  })

  it('tắt tiếng giữ nguyên mức âm lượng, chỉ âm lượng thật sự về 0', () => {
    const s = new SettingsController(memoryStorage().storage)
    s.setMusicVolume(0.5)
    s.toggleMute()
    expect(s.getSnapshot().musicVolume).toBe(0.5)
    expect(s.effectiveMusicVolume).toBe(0)
    s.toggleMute()
    expect(s.effectiveMusicVolume).toBe(0.5)
  })

  it('dữ liệu lưu bị hỏng hoặc sai kiểu thì dùng mặc định cho phần hỏng', () => {
    expect(new SettingsController(memoryStorage({ [KEY]: '{oops' }).storage).getSnapshot()).toEqual(DEFAULT_SETTINGS)
    const partial = memoryStorage({ [KEY]: JSON.stringify({ musicVolume: 0.3, muted: 'yes', sfxVolume: 9 }) })
    expect(new SettingsController(partial.storage).getSnapshot()).toEqual({ ...DEFAULT_SETTINGS, musicVolume: 0.3, sfxVolume: 1 })
  })

  it('không đổi gì thì không báo, không lưu', () => {
    const { storage, data } = memoryStorage()
    const s = new SettingsController(storage)
    let calls = 0
    s.subscribe(() => calls++)
    s.setReduceMotion(false)
    expect(calls).toBe(0)
    expect(data[KEY]).toBeUndefined()
  })

  it('localStorage ném lỗi hoặc không có thì vẫn chạy', () => {
    const broken: KeyValueStorage = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    const s = new SettingsController(broken)
    s.setMusicVolume(0.1)
    expect(s.getSnapshot().musicVolume).toBe(0.1)
    expect(new SettingsController(null).getSnapshot()).toEqual(DEFAULT_SETTINGS)
  })
})
