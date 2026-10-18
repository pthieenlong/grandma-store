// Các con số cân bằng game, gom về một chỗ để chỉnh khi tự chơi thử.

export const DAY_LENGTH_MS = 5 * 60 * 1000 // 1 ngày ≈ 5 phút
export const LAST_DAY = 30 // ngày cuối = Tết

// Giờ trong game chỉ để hiển thị, suy ra từ elapsedMs. Luật vẫn tính bằng ms thật.
export const OPEN_HOUR = 6 // mở cửa 6:00
export const CLOSE_HOUR = 20 // đóng cửa 20:00 (14 tiếng game ≈ 5 phút thật, 1 tiếng ≈ 21 giây)
export const CLOCK_STEP_MIN = 10 // đồng hồ nhảy từng 10 phút cho đỡ rối mắt

export const START_MONEY = 150_000
export const START_INVENTORY: Record<string, number> = {
  'mi-goi': 6,
  'nuoc-mam': 2,
  'keo-me': 10,
  nhang: 2,
}

export const FIRST_ARRIVAL_MS = 4_000 // khách đầu tiên tới sau khi mở cửa
export const GAP_MIN_MS = 2_000 // khoảng nghỉ giữa 2 khách (ngắn để quầy không trống lâu)
export const GAP_MAX_MS = 5_000

// Khách có tên được rải đều từ lúc mở cửa tới PLANNED_LAST_HOUR, nên dù tới trễ vẫn kịp trước khoảng 17h.
export const PLANNED_LAST_HOUR = 16
// Khách có tên sắp tới trong khoảng này thì quầy chờ họ, không cho khách vô danh vào chen.
export const PLANNED_LOOKAHEAD_MS = 20_000
// Còn ít hơn chừng này là tới giờ đóng cửa thì không đón khách vô danh nữa (tránh đang gom khay thì bị cắt ngang)
export const FILLER_CUTOFF_MS = 10_000
export const FILLER_PATIENCE_MIN_MS = 12_000
export const FILLER_PATIENCE_MAX_MS = 20_000
export const FILLER_TWO_ITEMS_CHANCE = 0.2 // khách vô danh mua 2 món

// Khách nói câu cuối rồi mới đi; câu càng dài đứng lại càng lâu để kịp đọc
export const LEAVE_MIN_MS = 2_200
export const LEAVE_MAX_MS = 6_000
export const READ_MS_PER_CHAR = 55
export const WRONG_ITEM_PENALTY = 0.25 // đưa nhầm: mất 25% tổng kiên nhẫn của khách

export const RANDOM_ONLY_DAY_COUNT = 5 // ngày chưa có kịch bản: số khách ngẫu nhiên
