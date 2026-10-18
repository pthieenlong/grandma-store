import type { ItemId } from '../../engine/types'

// Gom mọi icon trong assets/items/, tên file = id món. Thêm món mới chỉ cần thả <id>.webp vào thư mục.
const ICONS = Object.fromEntries(
  Object.entries(import.meta.glob<string>('../../assets/items/*.webp', { eager: true, import: 'default' })).map(([path, url]) => [
    path.split('/').pop()!.replace('.webp', ''),
    url,
  ]),
)

type Props = { id: ItemId; className?: string }

/** Icon món hàng (ảnh trang trí: tên món luôn có chữ đi kèm, nên alt rỗng). Chưa có icon thì không vẽ gì. */
export function ItemIcon({ id, className = 'size-9' }: Props) {
  const src = ICONS[id]
  if (!src) return null
  return <img src={src} alt="" aria-hidden="true" draggable={false} className={`shrink-0 object-contain select-none ${className}`} />
}
