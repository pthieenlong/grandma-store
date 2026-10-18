import { content } from '../content'
import { AudioController } from './AudioController'
import { audioSources } from './audioSources'
import { GameController } from './GameController'
import { ProfileController } from './ProfileController'
import { SaveController } from './SaveController'
import { SettingsController } from './SettingsController'

// Chỗ duy nhất tạo instance controller. Mỗi controller chỉ có một instance cho cả app (singleton):
// ES module chỉ chạy một lần, nên file nào import `game` cũng nhận đúng object này, không cần getInstance().
// Class vẫn được export riêng để test tự tạo instance mới với content giả.
export const save = new SaveController()
// Có bản lưu thì game bắt đầu từ đầu ngày đã lưu; màn mở đầu cho chọn "Chơi tiếp" hay "Ván mới"
export const game = new GameController(content, { initialState: save.restore(content) ?? undefined })
export const settings = new SettingsController()
export const profile = new ProfileController()
export const audio = new AudioController(settings, audioSources)

// Nối âm thanh với game một lần cho cả app. Chưa phát gì cho tới khi audio.start() (lúc bấm "Mở cửa tiệm").
audio.bindGame(game)
// Tự lưu mỗi khi sang ngày / đóng cửa / ván mới
save.bindGame(game)

// Chỉ khi chạy dev: gõ `__game` trong Console của DevTools để xem/điều khiển state (vd __game.getSnapshot()).
if (import.meta.env.DEV) Object.assign(globalThis, { __game: game, __settings: settings, __audio: audio, __save: save, __profile: profile })
