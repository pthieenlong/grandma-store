import { game } from '../../controllers'
import { useStore } from '../../hooks/useStore'
import { selectPatience } from '../selectors'

type Props = { className?: string; fill?: string }

/**
 * Thanh kiên nhẫn của khách đang chờ. Đây là chỗ DUY NHẤT ở quầy phải render lại mỗi nhịp 100ms,
 * nên tách thành component nhỏ riêng: mỗi nhịp chỉ vẽ lại đúng cái thanh này.
 */
export function PatienceBar({ className = '', fill = 'bg-leaf' }: Props) {
  const patience = useStore(game, selectPatience)
  if (patience === null) return null
  return (
    <div className={`bar h-[9px]! ${className}`}>
      <span className={patience < 0.35 ? 'bg-tile' : fill} style={{ width: `${patience * 100}%` }} />
    </div>
  )
}
