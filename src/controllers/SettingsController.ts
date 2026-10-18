import { browserStorage, type KeyValueStorage } from './storage'
import { Store } from './Store'

export type Settings = {
  musicVolume: number // 0–1
  sfxVolume: number // 0–1
  muted: boolean // tắt tiếng nhanh; giữ nguyên mức âm lượng để bật lại là về như cũ
  reduceMotion: boolean // true: luôn giảm chuyển động. false: theo cài đặt của máy
}

export const DEFAULT_SETTINGS: Settings = {
  musicVolume: 0.6,
  sfxVolume: 0.8,
  muted: false,
  reduceMotion: false,
}

export type { KeyValueStorage } from './storage'

const STORAGE_KEY = 'tiem-ba-ngoai:settings:v1'

const clamp01 = (n: unknown, fallback: number) => (typeof n === 'number' && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback)

/** Đọc dữ liệu đã lưu một cách phòng thủ: thiếu field, sai kiểu, JSON hỏng thì dùng mặc định cho field đó. */
function parseSettings(raw: string | null): Settings {
  if (!raw) return DEFAULT_SETTINGS
  try {
    const data: unknown = JSON.parse(raw)
    if (typeof data !== 'object' || data === null) return DEFAULT_SETTINGS
    const d = data as Record<string, unknown>
    return {
      musicVolume: clamp01(d.musicVolume, DEFAULT_SETTINGS.musicVolume),
      sfxVolume: clamp01(d.sfxVolume, DEFAULT_SETTINGS.sfxVolume),
      muted: typeof d.muted === 'boolean' ? d.muted : DEFAULT_SETTINGS.muted,
      reduceMotion: typeof d.reduceMotion === 'boolean' ? d.reduceMotion : DEFAULT_SETTINGS.reduceMotion,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

/**
 * Cài đặt của người chơi: âm lượng, tắt tiếng, giảm chuyển động. Mỗi lần đổi là lưu ngay vào localStorage.
 * Không lưu được (trình duyệt chặn) thì game vẫn chạy bình thường, chỉ là lần sau mở lại về mặc định.
 */
export class SettingsController extends Store<Settings> {
  private readonly storage: KeyValueStorage | null

  constructor(storage: KeyValueStorage | null = browserStorage()) {
    let initial = DEFAULT_SETTINGS
    try {
      initial = parseSettings(storage?.getItem(STORAGE_KEY) ?? null)
    } catch {
      // getItem ném lỗi: dùng mặc định
    }
    super(initial)
    this.storage = storage
  }

  setMusicVolume(volume: number): void {
    this.patch({ musicVolume: clamp01(volume, this.state.musicVolume) })
  }

  setSfxVolume(volume: number): void {
    this.patch({ sfxVolume: clamp01(volume, this.state.sfxVolume) })
  }

  toggleMute(): void {
    this.patch({ muted: !this.state.muted })
  }

  setReduceMotion(reduceMotion: boolean): void {
    this.patch({ reduceMotion })
  }

  /** Âm lượng thật sự để phát: đã tính cả nút tắt tiếng. AudioController (bước sau) sẽ dùng 2 hàm này. */
  get effectiveMusicVolume(): number {
    return this.state.muted ? 0 : this.state.musicVolume
  }

  get effectiveSfxVolume(): number {
    return this.state.muted ? 0 : this.state.sfxVolume
  }

  private patch(changes: Partial<Settings>): void {
    const next = { ...this.state, ...changes }
    const keys = Object.keys(changes) as (keyof Settings)[]
    if (keys.every((k) => next[k] === this.state[k])) return // không đổi gì: không lưu, không báo
    this.setState(next)
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Hết chỗ hoặc bị chặn: bỏ qua, cài đặt vẫn có tác dụng trong phiên này
    }
  }
}
