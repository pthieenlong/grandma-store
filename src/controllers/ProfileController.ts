import { browserStorage, type KeyValueStorage } from './storage'
import { Store } from './Store'

export type Gender = 'male' | 'female'

/** Hồ sơ người chơi: NPC gọi theo tên và vai vế này (xem renderLine trong ui/format.ts). */
export type Profile = {
  name: string
  gender: Gender
}

export const PROFILE_NAME_MAX = 16

const STORAGE_KEY = 'tiem-ba-ngoai:profile:v1'

/**
 * Làm sạch tên người chơi nhập: gộp dấu tiếng Việt về một dạng (NFC), bỏ khoảng trắng thừa,
 * bỏ ký tự trùng cú pháp chỗ trống trong câu thoại ({ } |), cắt còn tối đa PROFILE_NAME_MAX ký tự.
 */
export function cleanName(raw: string): string {
  const name = raw.normalize('NFC').replace(/[{}|]/g, '').replace(/\s+/g, ' ').trim()
  // Array.from đếm theo ký tự thật, không cắt đôi một ký tự ngoài BMP (vd emoji) như slice
  return Array.from(name).slice(0, PROFILE_NAME_MAX).join('').trim()
}

const isGender = (g: unknown): g is Gender => g === 'male' || g === 'female'

/** Đọc hồ sơ đã lưu một cách phòng thủ: sai kiểu hay JSON hỏng thì coi như chưa có. */
function parseProfile(raw: string | null): Profile | null {
  if (!raw) return null
  try {
    const d: unknown = JSON.parse(raw)
    if (typeof d !== 'object' || d === null) return null
    const { name, gender } = d as Record<string, unknown>
    if (typeof name !== 'string' || !isGender(gender)) return null
    const clean = cleanName(name)
    return clean ? { name: clean, gender } : null
  } catch {
    return null
  }
}

/**
 * Tên và giới tính người chơi, lưu riêng với bản lưu game: ván mới vẫn giữ hồ sơ cũ để điền sẵn.
 * null = chưa tạo nhân vật.
 */
export class ProfileController extends Store<Profile | null> {
  private readonly storage: KeyValueStorage | null

  constructor(storage: KeyValueStorage | null = browserStorage()) {
    let initial: Profile | null = null
    try {
      initial = parseProfile(storage?.getItem(STORAGE_KEY) ?? null)
    } catch {
      // getItem ném lỗi: coi như chưa có
    }
    super(initial)
    this.storage = storage
  }

  /** Trả về false nếu tên rỗng sau khi làm sạch (không đổi gì). */
  setProfile(name: string, gender: Gender): boolean {
    const clean = cleanName(name)
    if (!clean) return false
    const next = { name: clean, gender }
    this.setState(next)
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Bị chặn: hồ sơ vẫn dùng được trong phiên này
    }
    return true
  }
}
