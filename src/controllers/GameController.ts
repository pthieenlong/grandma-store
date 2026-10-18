import { apologize, choose, give, newGame, nextDay, restock, setPaused, tick } from '../engine/game'
import type { GameContent, GameState, ItemId, Outcome, Tray } from '../engine/types'
import { Store } from './Store'

const STEP_MS = 100 // gom thành từng nhịp 100ms để không cập nhật state 60 lần/giây
const MAX_FRAME_MS = 250 // tab vừa được mở lại: không cho thời gian "nhảy cóc"

/** Nguồn khung hình. Trình duyệt dùng requestAnimationFrame; test truyền bản giả để tự bấm từng frame. */
export type FrameScheduler = {
  request: (callback: (now: number) => void) => number
  cancel: (id: number) => void
  now: () => number
}

const browserScheduler: FrameScheduler = {
  request: (callback) => requestAnimationFrame(callback),
  cancel: (id) => cancelAnimationFrame(id),
  now: () => performance.now(),
}

type OutcomeListener = (outcome: Outcome) => void

/**
 * Bộ điều khiển game: giữ GameState, chạy đồng hồ, nhận hành động của người chơi.
 * Đây là "vỏ" có side effect (requestAnimationFrame, sự kiện tab ẩn/hiện). Luật game vẫn nằm hết trong
 * engine/game.ts dưới dạng hàm thuần: mọi method ở đây chỉ gọi hàm thuần rồi lưu kết quả.
 */
export class GameController extends Store<GameState> {
  private readonly content: GameContent
  private readonly scheduler: FrameScheduler
  private readonly outcomeListeners = new Set<OutcomeListener>()
  private started = false
  private frameId: number | null = null
  private lastFrameAt = 0
  private accumulatedMs = 0

  constructor(content: GameContent, options: { seed?: number; scheduler?: FrameScheduler } = {}) {
    super(newGame(content, options.seed))
    this.content = content
    this.scheduler = options.scheduler ?? browserScheduler
  }

  // ---------- Vòng đời ----------

  /** Bắt đầu chạy đồng hồ. Gọi lại nhiều lần cũng không sao (React StrictMode gọi effect 2 lần). */
  start(): void {
    if (this.started) return
    this.started = true
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', this.onVisibilityChange)
    this.syncLoop()
  }

  stop(): void {
    this.started = false
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.onVisibilityChange)
    this.syncLoop()
  }

  // ---------- Hành động của người chơi ----------

  give(tray: Tray): void {
    this.update(give(this.state, tray, this.content))
  }

  apologize(): void {
    this.update(apologize(this.state))
  }

  choose(index: number): void {
    this.update(choose(this.state, index))
  }

  /** Trả về false nếu không nhập được (không đủ tiền, số lượng sai…). */
  restock(itemId: ItemId, qty: number): boolean {
    const result = restock(this.state, itemId, qty, this.content)
    if (result.ok) this.update(result.state)
    return result.ok
  }

  nextDay(): void {
    this.update(nextDay(this.state, this.content))
  }

  newGame(): void {
    this.update(newGame(this.content))
  }

  pause(): void {
    this.update(setPaused(this.state, true))
  }

  resume(): void {
    this.update(setPaused(this.state, false))
  }

  togglePause(): void {
    this.update(setPaused(this.state, !this.state.paused))
  }

  /**
   * App bị ẩn (chuyển tab, khoá màn hình) thì tự tạm dừng, để lúc quay lại người chơi thấy màn tạm dừng
   * và tự bấm "Chơi tiếp", thay vì khách đang chờ bỏ về ngay. Quay lại thì KHÔNG tự chạy tiếp.
   */
  setAppHidden(hidden: boolean): void {
    if (hidden) this.pause()
    this.lastFrameAt = this.scheduler.now()
  }

  // ---------- Sự kiện ----------

  /**
   * Nghe từng Outcome mới (bán được, đưa nhầm, khách bỏ về…). Dành cho những thứ nằm ngoài React như âm thanh.
   * Không cần sự kiện riêng: mọi chuyện trong ngày đều đã được ghi vào todayLog, chỉ cần xem log dài thêm bao nhiêu.
   */
  onOutcome(listener: OutcomeListener): () => void {
    this.outcomeListeners.add(listener)
    return () => {
      this.outcomeListeners.delete(listener)
    }
  }

  // ---------- Bên trong ----------

  private update(next: GameState): void {
    const prev = this.state
    if (next === prev) return // hành động không hợp lệ: engine trả về đúng state cũ
    this.setState(next)
    this.emitNewOutcomes(prev, next)
    this.syncLoop()
  }

  private emitNewOutcomes(prev: GameState, next: GameState): void {
    if (next.todayLog === prev.todayLog || next.day !== prev.day) return
    for (const outcome of next.todayLog.slice(prev.todayLog.length)) {
      for (const listener of this.outcomeListeners) listener(outcome)
    }
  }

  private get shouldRun(): boolean {
    return this.started && this.state.phase === 'open' && !this.state.paused
  }

  /** Bật hoặc tắt vòng lặp cho khớp với state hiện tại (đóng cửa, tạm dừng, sang ngày mới…). */
  private syncLoop(): void {
    if (this.shouldRun && this.frameId === null) {
      this.lastFrameAt = this.scheduler.now()
      this.accumulatedMs = 0
      this.frameId = this.scheduler.request(this.onFrame)
    } else if (!this.shouldRun && this.frameId !== null) {
      this.scheduler.cancel(this.frameId)
      this.frameId = null
    }
  }

  // Tính thời gian theo mốc của từng frame thay vì đếm setInterval, vì trình duyệt điện thoại
  // làm chậm/dừng timer khi tab bị ẩn. Tab ẩn thì requestAnimationFrame dừng hẳn → game tự đứng yên.
  private onFrame = (now: number): void => {
    this.accumulatedMs += Math.min(now - this.lastFrameAt, MAX_FRAME_MS)
    this.lastFrameAt = now
    if (this.accumulatedMs >= STEP_MS) {
      const dt = this.accumulatedMs
      this.accumulatedMs = 0
      this.update(tick(this.state, dt, this.content)) // có thể làm vòng lặp tắt (hết giờ)
    }
    // update() ở trên có thể đã tắt vòng lặp (frameId = null); chỉ xin frame tiếp khi vẫn đang chạy
    if (this.frameId !== null) this.frameId = this.scheduler.request(this.onFrame)
  }

  private onVisibilityChange = (): void => {
    this.setAppHidden(document.visibilityState === 'hidden')
  }
}
