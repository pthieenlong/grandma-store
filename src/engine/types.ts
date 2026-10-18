// ===== Dữ liệu tĩnh (content, nằm trong src/content/*.json) =====

export type ItemId = string

export type Item = {
  id: ItemId
  name: string
  buyPrice: number // giá nhập
  sellPrice: number // giá bán (cố định ở v0.1)
  unit: string // đơn vị khi nói: "gói", "chai"… (khách vô danh dùng để ghép câu)
  noun: string // tên món khi nói: "mì", "nước mắm"…
}

/** Khách muốn mua TỐI ĐA maxQty. Tiệm còn ít hơn thì bán đúng số còn lại. */
export type Want = { itemId: ItemId; maxQty: number }

export type VisitLines = {
  greet: string // PHẢI nói rõ khách cần món gì, tối đa bao nhiêu: người chơi chỉ đọc được từ đây
  thanks: string // bán được (dù chỉ một phần)
  outOfStock: string // người chơi báo hết hàng
  leftAngry: string // hết kiên nhẫn
  wrongItem: string // đưa nhầm món, khách nhắc lại
}

/** Khay hàng người chơi đang gom để đưa cho khách: itemId -> số lượng */
export type Tray = Record<ItemId, number>

/** Một câu trả lời của người chơi và câu khách đáp lại. */
export type StoryChoice = { text: string; reply: string }

/** Câu chuyện khách kể sau khi mua được hàng. Chưa có tác dụng gì ngoài lời thoại (chờ hệ thống Gắn bó). */
export type Story = { text: string; choices: StoryChoice[] }

export type VisitScript = {
  id: string
  customer: string
  wants: Want[]
  patienceMs: number
  lines: VisitLines
  story?: Story // chỉ hiện khi bán thành công; hết hàng hoặc khách bỏ về thì mất chuyện
}

export type DayScript = {
  day: number
  visits: VisitScript[] // khách viết sẵn, giữ đúng thứ tự
  randomCount: number // thêm bao nhiêu khách ngẫu nhiên
}

export type RandomVisit = VisitScript & {
  weight: number // càng lớn càng hay xuất hiện
  minDay?: number // chỉ xuất hiện từ ngày này trở đi
}

/** Khách vô danh lấp chỗ trống giữa các khách có tên. Tự sinh, không có story. */
export type FillerCustomer = {
  name: string
  self: string // khách tự xưng: "bà", "chú", "con"…
  player: string // khách gọi người chơi: "con", "em", "anh"…
}

export type FillerContent = {
  customers: FillerCustomer[]
  items: Record<ItemId, { weight: number; maxQty: number }> // món khách vô danh hay mua
  /** Mẫu câu. Chỗ trống: {self} {player} {wants} ("2 gói mì với 1 chai nước mắm"). */
  lines: Record<keyof VisitLines, string[]>
}

export type GameContent = {
  items: Record<ItemId, Item>
  days: DayScript[]
  randomPool: RandomVisit[]
  fillers: FillerContent
}

/** Một trang trong cảnh kể chuyện (intro, sau này là sự kiện giữa các ngày). Câu có thể chứa {name}, {nam|nữ}. */
export type ScenePage = { title: string; lines: string[] }

export type Scene = {
  id: string
  pages: ScenePage[]
  doneLabel: string // chữ trên nút ở trang cuối
}

// ===== Trạng thái game (thay đổi khi chơi) =====

export type Inventory = Record<ItemId, number>

export type OutcomeKind = 'sold' | 'out-of-stock' | 'left-angry' | 'wrong-item' | 'story' | 'restock'

/** Mọi thứ xảy ra trong ngày đều được ghi lại bằng Outcome. Màn Tổng kết chỉ đọc log này. */
export type Outcome = {
  visitId: string | null
  kind: OutcomeKind
  moneyDelta: number
  inventoryDelta: Inventory
  bondDeltas: Record<string, number> // v0.1: luôn {}. Giữ sẵn hình dạng cho hệ thống Gắn bó sau này.
  choiceIndex?: number // chỉ có ở kind 'story': người chơi chọn câu trả lời nào
}

/** Khách có tên (kịch bản hoặc ngẫu nhiên) đã lên lịch trong ngày. */
export type QueuedVisit = {
  visit: VisitScript
  arriveAtMs: number // mốc elapsedMs dự kiến tới; tới trễ hơn nếu quầy đang bận
}

export type CurrentVisit = {
  visit: VisitScript
  status: 'waiting' | 'story' | 'leaving' // 'story': kiên nhẫn đứng yên, đồng hồ ngày vẫn chạy
  patienceLeftMs: number
  line: string // câu đang hiển thị
  leaveInMs: number // chỉ dùng khi status = 'leaving'
}

export type Phase = 'open' | 'night' | 'ended'

export type GameState = {
  day: number
  lastDay: number
  phase: Phase
  paused: boolean // tạm dừng: đồng hồ, kiên nhẫn, khách tới đều đứng yên
  dayLengthMs: number
  elapsedMs: number
  money: number
  startMoney: number // tiền đầu ngày, cho màn Tổng kết
  startInventory: Inventory // kho đầu ngày, để lưu game (bản lưu luôn là đầu một ngày)
  inventory: Inventory
  queue: QueuedVisit[] // chỉ khách có tên; khách vô danh sinh lúc quầy trống
  current: CurrentVisit | null
  nextArrivalInMs: number // quầy trống bao lâu nữa thì có khách
  arrivedToday: number
  todayLog: Outcome[]
  seed: number
  rngState: number // trạng thái bộ ngẫu nhiên trong ngày, để tick vẫn là hàm thuần
}
