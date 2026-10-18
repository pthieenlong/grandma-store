import { fromSave, parseSave, type SaveData, toSave } from '../engine/save'
import type { GameContent, GameState } from '../engine/types'
import type { GameController } from './GameController'
import { browserStorage } from './storage'
import { Store } from './Store'

export type SaveInfo = {
  savedDay: number | null // bản lưu đang ở ngày nào; null = chưa có bản lưu
}

/** Chỉ cần 3 hàm này của localStorage; test truyền bản giả. */
export type SaveStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const STORAGE_KEY = 'tiem-ba-ngoai:save:v1'

/**
 * Lưu game vào localStorage. Bản lưu luôn là đầu một ngày (xem engine/save.ts), nên chỉ cần ghi khi
 * sang ngày, đóng cửa, hết game hoặc bắt đầu ván mới, không ghi theo từng nhịp đồng hồ.
 * Không lưu được (trình duyệt chặn) thì game vẫn chạy, chỉ là tải lại trang sẽ chơi lại từ đầu.
 */
export class SaveController extends Store<SaveInfo> {
  private readonly storage: SaveStorage | null
  private data: SaveData | null

  constructor(storage: SaveStorage | null = browserStorage()) {
    let data: SaveData | null = null
    try {
      data = parseSave(storage?.getItem(STORAGE_KEY) ?? null)
    } catch {
      // getItem ném lỗi: coi như chưa có bản lưu
    }
    super({ savedDay: data?.day ?? null })
    this.storage = storage
    this.data = data
  }

  /** GameState dựng lại từ bản lưu, hoặc null nếu chưa có. Truyền vào GameController lúc khởi tạo. */
  restore(content: GameContent): GameState | null {
    return this.data ? fromSave(this.data, content) : null
  }

  /**
   * Nghe game và tự lưu. State lúc gọi hàm này (vừa tải lên, hoặc ván mới chưa chơi) không được ghi:
   * người chơi phải bấm "Mở cửa tiệm" (game.newGame()) thì mới có bản lưu.
   */
  bindGame(game: GameController): () => void {
    let prev = game.getSnapshot()
    return game.subscribe(() => {
      const s = game.getSnapshot()
      // seed đổi = ván mới (kể cả khi ván cũ cũng đang ở ngày 1)
      if (s.day !== prev.day || s.phase !== prev.phase || s.seed !== prev.seed) this.write(toSave(s))
      prev = s
    })
  }

  private write(data: SaveData | null): void {
    this.data = data
    this.setState({ savedDay: data?.day ?? null })
    try {
      if (data) this.storage?.setItem(STORAGE_KEY, JSON.stringify(data))
      else this.storage?.removeItem(STORAGE_KEY)
    } catch {
      // Hết chỗ hoặc bị chặn: bỏ qua, ván đang chơi vẫn chạy bình thường
    }
  }
}
