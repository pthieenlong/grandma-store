import { Howl } from 'howler'
import { clockMinutes } from '../engine/clock'
import type { GameState, OutcomeKind } from '../engine/types'
import type { GameController } from './GameController'
import type { SettingsController } from './SettingsController'

export type SfxName = 'coin' | 'wrong' | 'bell' | 'tap' | 'angry' | 'restock' | 'night'
export type MusicName = 'day' | 'evening'

/** Đường dẫn file cho từng âm thanh, theo thứ tự ưu tiên (Howler phát file đầu tiên trình duyệt hỗ trợ). */
export type AudioSources = {
  sfx: Record<SfxName, string[]>
  music: Record<MusicName, string[]>
}

/** Phần nhỏ của Howl mà controller cần. Test truyền bản giả để kiểm tra mà không phát tiếng thật. */
export type SoundHandle = {
  play: () => void
  stop: () => void
  pause: () => void
  playing: () => boolean
  getVolume: () => number
  setVolume: (volume: number) => void
  fade: (from: number, to: number, ms: number, onDone?: () => void) => void
}
export type SoundFactory = (options: { src: string[]; loop: boolean }) => SoundHandle

const howlFactory: SoundFactory = ({ src, loop }) => {
  const howl = new Howl({ src, loop, preload: true })
  return {
    play: () => {
      howl.play()
    },
    stop: () => {
      howl.stop()
    },
    pause: () => {
      howl.pause()
    },
    playing: () => howl.playing(),
    getVolume: () => howl.volume(),
    setVolume: (v) => {
      howl.volume(v)
    },
    fade: (from, to, ms, onDone) => {
      if (onDone) howl.once('fade', onDone)
      howl.fade(from, to, ms)
    },
  }
}

// Mức to nhỏ tương đối giữa các tiếng (nhân với âm lượng người chơi chọn). Chỉnh ở đây khi tiếng nào nghe quá to.
const SFX_GAIN: Record<SfxName, number> = { coin: 0.9, wrong: 0.8, bell: 0.6, tap: 0.45, angry: 0.8, restock: 0.7, night: 0.9 }
const MUSIC_GAIN = 0.5 // nhạc nền nhỏ hơn hiệu ứng, để tiếng "ting" luôn nghe rõ
const CROSSFADE_MS = 1_500
const EVENING_FROM_HOUR = 17

// ---------- Luật âm thanh (hàm thuần, test riêng được) ----------

/** Outcome nào kêu tiếng gì. null = im lặng. */
export function sfxForOutcome(kind: OutcomeKind): SfxName | null {
  switch (kind) {
    case 'sold':
      return 'coin'
    case 'wrong-item':
      return 'wrong'
    case 'left-angry':
      return 'angry'
    case 'restock':
      return 'restock'
    case 'out-of-stock':
    case 'story':
      return null
  }
}

/** Nhạc nền theo lúc: ban ngày nhạc vui, từ 17h và buổi tối (Tổng kết) nhạc chậm. */
export function musicFor(s: GameState): MusicName {
  if (s.phase === 'open') return clockMinutes(s.elapsedMs, s.dayLengthMs) < EVENING_FROM_HOUR * 60 ? 'day' : 'evening'
  return s.phase === 'night' ? 'evening' : 'day'
}

/**
 * Bộ điều khiển âm thanh: phát hiệu ứng, nhạc nền chuyển mượt (crossfade), theo âm lượng trong SettingsController.
 * Không giữ state cho UI nên không kế thừa Store.
 *
 * Trình duyệt điện thoại chặn âm thanh cho tới lần chạm đầu tiên, nên mọi thứ im lặng cho tới khi gọi start()
 * (gọi trong lúc người chơi bấm "Mở cửa tiệm").
 */
export class AudioController {
  private readonly settings: SettingsController
  private readonly sources: AudioSources
  private readonly createSound: SoundFactory
  private readonly sounds = new Map<string, SoundHandle>() // tạo khi dùng lần đầu
  private started = false
  private hidden = false
  private currentMusic: MusicName | null = null
  private wantedMusic: MusicName | null = null

  constructor(settings: SettingsController, sources: AudioSources, createSound: SoundFactory = howlFactory) {
    this.settings = settings
    this.sources = sources
    this.createSound = createSound
    settings.subscribe(this.applyMusicVolume)
  }

  /** Gọi trong một thao tác chạm của người chơi. */
  start(): void {
    if (this.started) return
    this.started = true
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', this.onVisibilityChange)
    this.switchMusic(this.wantedMusic)
  }

  playSfx(name: SfxName): void {
    const volume = this.settings.effectiveSfxVolume * SFX_GAIN[name]
    if (!this.started || this.hidden || volume <= 0) return
    const sound = this.sound(`sfx:${name}`, this.sources.sfx[name], false)
    sound.setVolume(volume)
    sound.play()
  }

  /** Đổi nhạc nền (null = tắt). Chưa start thì chỉ ghi nhớ, start rồi mới phát. */
  setMusic(name: MusicName | null): void {
    this.wantedMusic = name
    if (this.started) this.switchMusic(name)
  }

  /** App bị ẩn: dừng nhạc (tab ẩn trình duyệt vẫn phát tiếng). Quay lại thì phát tiếp. */
  setAppHidden(hidden: boolean): void {
    if (this.hidden === hidden) return
    this.hidden = hidden
    const music = this.currentMusic ? this.musicSound(this.currentMusic) : null
    if (!music) return
    if (hidden) {
      music.pause()
    } else {
      // Có thể bài này được chọn trong lúc ẩn nên chưa từng phát: đặt âm lượng trước khi phát
      music.setVolume(this.musicVolume)
      music.play()
    }
  }

  /** Nối với game: Outcome → hiệu ứng, khách tới → chuông, đóng cửa → nhạc chuông, giờ trong ngày → nhạc nền. */
  bindGame(game: GameController): () => void {
    let prev = game.getSnapshot()
    this.setMusic(musicFor(prev))

    const offOutcome = game.onOutcome((outcome) => {
      const sfx = sfxForOutcome(outcome.kind)
      if (sfx) this.playSfx(sfx)
    })
    const offState = game.subscribe(() => {
      const s = game.getSnapshot()
      if (s.day === prev.day && s.arrivedToday > prev.arrivedToday) this.playSfx('bell')
      if (prev.phase === 'open' && s.phase === 'night') this.playSfx('night')
      prev = s
      this.setMusic(musicFor(s)) // cùng bài thì không làm gì
    })
    return () => {
      offOutcome()
      offState()
    }
  }

  // ---------- Bên trong ----------

  private get musicVolume(): number {
    return this.settings.effectiveMusicVolume * MUSIC_GAIN
  }

  private sound(key: string, src: string[], loop: boolean): SoundHandle {
    let sound = this.sounds.get(key)
    if (!sound) {
      sound = this.createSound({ src, loop })
      this.sounds.set(key, sound)
    }
    return sound
  }

  private musicSound(name: MusicName): SoundHandle {
    return this.sound(`music:${name}`, this.sources.music[name], true)
  }

  private switchMusic(name: MusicName | null): void {
    if (name === this.currentMusic) return
    const oldName = this.currentMusic
    this.currentMusic = name

    if (oldName) {
      const old = this.musicSound(oldName)
      // Nhỏ dần rồi dừng; nếu trong lúc đó lại quay về bài này thì đừng dừng
      old.fade(old.getVolume(), 0, CROSSFADE_MS, () => {
        if (this.currentMusic !== oldName) old.stop()
      })
    }
    if (!name || this.hidden) return
    const next = this.musicSound(name)
    if (next.playing()) {
      next.fade(next.getVolume(), this.musicVolume, CROSSFADE_MS) // đang nhỏ dần dở dang: kéo to lại
    } else {
      next.setVolume(0)
      next.play()
      next.fade(0, this.musicVolume, CROSSFADE_MS)
    }
  }

  private applyMusicVolume = (): void => {
    if (this.currentMusic) this.musicSound(this.currentMusic).setVolume(this.musicVolume)
  }

  private onVisibilityChange = (): void => {
    this.setAppHidden(document.visibilityState === 'hidden')
  }
}
