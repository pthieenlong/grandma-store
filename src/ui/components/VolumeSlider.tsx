import type { CSSProperties } from 'react'

type Props = { label: string; value: number; disabled?: boolean; onChange: (value: number) => void }

/** Thanh kéo âm lượng 0–100%. Lưu dưới dạng 0–1, hiện dạng phần trăm. */
export function VolumeSlider({ label, value, disabled = false, onChange }: Props) {
  const percent = Math.round(value * 100)
  return (
    <label className={`flex flex-col gap-1 ${disabled ? 'opacity-50' : ''}`}>
      <span className="flex justify-between text-[15px] font-semibold">
        {label}
        <span className="font-normal text-ink-soft tabular-nums">{percent}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={percent}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="range h-11 w-full"
        // Biến CSS --fill cho rãnh biết tô màu tới đâu (xem .range trong index.css)
        style={{ '--fill': `${percent}%` } as CSSProperties}
      />
    </label>
  )
}
