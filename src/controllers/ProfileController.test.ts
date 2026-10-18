import { describe, expect, it } from 'vitest'
import { cleanName, PROFILE_NAME_MAX, ProfileController } from './ProfileController'
import type { KeyValueStorage } from './storage'

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

const KEY = 'tiem-ba-ngoai:profile:v1'

describe('ProfileController', () => {
  it('chưa tạo nhân vật thì là null', () => {
    expect(new ProfileController(memoryStorage().storage).getSnapshot()).toBeNull()
  })

  it('lưu ngay, mở lại vẫn còn', () => {
    const { storage } = memoryStorage()
    expect(new ProfileController(storage).setProfile('  Minh  ', 'female')).toBe(true)
    expect(new ProfileController(storage).getSnapshot()).toEqual({ name: 'Minh', gender: 'female' })
  })

  it('tên rỗng thì không đổi gì', () => {
    const p = new ProfileController(memoryStorage().storage)
    expect(p.setProfile('   ', 'male')).toBe(false)
    expect(p.getSnapshot()).toBeNull()
  })

  it('hồ sơ hỏng hoặc sai kiểu thì coi như chưa có', () => {
    for (const raw of ['{hỏng', 'null', JSON.stringify({ name: 'A', gender: 'x' }), JSON.stringify({ name: 5, gender: 'male' })]) {
      expect(new ProfileController(memoryStorage({ [KEY]: raw }).storage).getSnapshot()).toBeNull()
    }
  })

  it('localStorage ném lỗi thì vẫn dùng được trong phiên', () => {
    const broken: KeyValueStorage = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    const p = new ProfileController(broken)
    expect(p.setProfile('Minh', 'male')).toBe(true)
    expect(p.getSnapshot()?.name).toBe('Minh')
  })
})

describe('cleanName', () => {
  it('bỏ khoảng trắng thừa và ký tự trùng cú pháp chỗ trống', () => {
    expect(cleanName('  Ngọc   Anh ')).toBe('Ngọc Anh')
    expect(cleanName('{name}|x')).toBe('namex')
  })

  it('gộp dấu tiếng Việt về NFC (bàn phím Mac có thể gõ ra dạng tách dấu)', () => {
    expect(cleanName('Ngọc')).toBe('Ngọc')
  })

  it('cắt còn tối đa PROFILE_NAME_MAX ký tự', () => {
    expect(Array.from(cleanName('a'.repeat(40)))).toHaveLength(PROFILE_NAME_MAX)
  })
})
