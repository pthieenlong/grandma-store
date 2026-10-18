/** Chỉ cần 2 hàm này của localStorage; test truyền bản giả. */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>

/** localStorage có thể ném lỗi (chế độ ẩn danh, bị chặn) hoặc không tồn tại (lúc chạy test). */
export function browserStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}
