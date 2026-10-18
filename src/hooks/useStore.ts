import { useSyncExternalStore } from 'react'
import type { Store } from '../controllers/Store'

/**
 * Đọc một phần state từ controller; component chỉ re-render khi phần đó đổi (so bằng `===`).
 *
 * LƯU Ý: selector phải trả về giá trị có sẵn trong state (number, string, hoặc object/mảng nằm sẵn trong state).
 * Đừng tạo object mới trong selector, vd `s => ({ money: s.money })`: mỗi lần gọi ra object khác nhau,
 * React tưởng state luôn đổi và render lặp vô hạn. Cần nhiều giá trị thì gọi useStore nhiều lần.
 */
export function useStore<T, S>(store: Store<T>, selector: (state: T) => S): S {
  return useSyncExternalStore(store.subscribe, () => selector(store.getSnapshot()))
}
