/**
 * Bộ sinh số ngẫu nhiên có seed (mulberry32).
 * Cùng seed → cùng kết quả, nên test được và tái hiện được bug.
 */
function mulberry32(a: number): [value: number, next: number] {
  const next = (a + 0x6d2b79f5) >>> 0
  let t = next
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next]
}

export function createRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    const [value, next] = mulberry32(a)
    a = next
    return value
  }
}

/**
 * Dùng khi trạng thái bộ ngẫu nhiên nằm trong GameState: chạy fn với một rng bắt đầu từ rngState,
 * trả về kết quả kèm rngState mới để lưu lại. Bên ngoài nhìn vào vẫn là hàm thuần.
 */
export function drawRandom<T>(rngState: number, fn: (rng: () => number) => T): [result: T, rngState: number] {
  let a = rngState >>> 0
  const rng = () => {
    const [value, next] = mulberry32(a)
    a = next
    return value
  }
  const result = fn(rng)
  return [result, a]
}

export function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

/** Bốc ngẫu nhiên theo trọng số. Trả về index, -1 nếu danh sách rỗng. */
export function pickWeighted<T extends { weight: number }>(rng: () => number, list: T[]): number {
  const total = list.reduce((sum, x) => sum + Math.max(0, x.weight), 0)
  if (total <= 0) return -1
  let r = rng() * total
  for (let i = 0; i < list.length; i++) {
    r -= Math.max(0, list[i].weight)
    if (r < 0) return i
  }
  return list.length - 1
}
