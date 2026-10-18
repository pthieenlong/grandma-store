type Listener = () => void

/**
 * Kho state tối giản, làm class cha cho các controller.
 * Khớp đúng hợp đồng mà React.useSyncExternalStore cần: getSnapshot() + subscribe(listener).
 * State luôn được thay bằng object mới (không sửa tại chỗ), nên React so sánh bằng `===` là biết có đổi hay không.
 */
export class Store<T> {
  protected state: T
  private readonly listeners = new Set<Listener>()

  constructor(initial: T) {
    this.state = initial
  }

  // Viết dạng arrow function (class field) thay vì method thường: `this` luôn trỏ đúng instance
  // kể cả khi tách hàm ra truyền đi, vd useSyncExternalStore(store.subscribe, store.getSnapshot).
  getSnapshot = (): T => this.state

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** Thay state và báo cho mọi listener. Cùng object thì bỏ qua, để không re-render vô ích. */
  protected setState(next: T): void {
    if (Object.is(next, this.state)) return
    this.state = next
    for (const listener of this.listeners) listener()
  }
}
