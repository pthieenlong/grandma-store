import { content } from '../content'
import { AudioController } from './AudioController'
import { audioSources } from './audioSources'
import { GameController } from './GameController'
import { SettingsController } from './SettingsController'

// Chỗ duy nhất tạo instance controller. Mỗi controller chỉ có một instance cho cả app (singleton):
// ES module chỉ chạy một lần, nên file nào import `game` cũng nhận đúng object này, không cần getInstance().
// Class vẫn được export riêng để test tự tạo instance mới với content giả.
export const game = new GameController(content)
export const settings = new SettingsController()
export const audio = new AudioController(settings, audioSources)

// Nối âm thanh với game một lần cho cả app. Chưa phát gì cho tới khi audio.start() (lúc bấm "Mở cửa tiệm").
audio.bindGame(game)

// Chỉ khi chạy dev: gõ `__game` trong Console của DevTools để xem/điều khiển state (vd __game.getSnapshot()).
if (import.meta.env.DEV) Object.assign(globalThis, { __game: game, __settings: settings, __audio: audio })
