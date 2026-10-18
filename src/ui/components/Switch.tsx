type Props = { label: string; hint?: string; checked: boolean; onChange: (checked: boolean) => void }

/** Công tắc bật/tắt. Dùng <button role="switch"> để trình đọc màn hình đọc được trạng thái bật hay tắt. */
export function Switch({ label, hint, checked, onChange }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
    >
      <span className="flex flex-col">
        <span className="text-[15px] font-semibold">{label}</span>
        {hint && <span className="text-[12px] text-ink-soft">{hint}</span>}
      </span>
      <span
        aria-hidden="true"
        className={`relative h-7 w-12 shrink-0 rounded-full shadow-[inset_0_2px_3px_rgb(74_52_38/0.2)] transition-colors ${checked ? 'bg-leaf' : 'bg-[#ead9bb]'}`}
      >
        <span
          className={`absolute top-1 size-5 rounded-full bg-card shadow-[0_2px_0_var(--color-card-edge)] transition-[left] ${checked ? 'left-6' : 'left-1'}`}
        />
      </span>
    </button>
  )
}
