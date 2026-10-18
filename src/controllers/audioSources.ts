import type { AudioSources } from './AudioController'
// Import file âm thanh qua Vite (thay vì để trong public/) để bản build gộp 1 file HTML nhúng luôn âm thanh.
// Đang là placeholder sinh bằng scripts/gen_placeholder_audio.py: thay file thật thì giữ nguyên tên là xong.
import angry from '../assets/audio/angry.mp3'
import bell from '../assets/audio/bell.mp3'
import coin from '../assets/audio/coin.mp3'
import musicDayMp3 from '../assets/audio/music-day.mp3'
import musicDayOpus from '../assets/audio/music-day.opus'
import musicEveningMp3 from '../assets/audio/music-evening.mp3'
import musicEveningOpus from '../assets/audio/music-evening.opus'
import night from '../assets/audio/night.mp3'
import restock from '../assets/audio/restock.mp3'
import tap from '../assets/audio/tap.mp3'
import wrong from '../assets/audio/wrong.mp3'

export const audioSources: AudioSources = {
  sfx: {
    coin: [coin], // bán được
    wrong: [wrong], // đưa nhầm
    bell: [bell], // khách tới
    tap: [tap], // chạm kệ / khay
    angry: [angry], // khách bỏ về giận
    restock: [restock], // nhập hàng
    night: [night], // đóng cửa
  },
  // Nhạc lặp: .opus trước (lặp liền mạch, Chrome/Android), .mp3 dự phòng (Safari; mp3 có khoảng lặng nhỏ ở chỗ lặp)
  music: {
    day: [musicDayOpus, musicDayMp3],
    evening: [musicEveningOpus, musicEveningMp3],
  },
}
