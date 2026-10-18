import { motion } from 'motion/react'
import { type FormEvent, useState } from 'react'
import { profile } from '../../controllers'
import { cleanName, type Gender, PROFILE_NAME_MAX } from '../../controllers/ProfileController'
import { useStore } from '../../hooks/useStore'

type Props = { onDone: () => void }

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Cháu trai' },
  { value: 'female', label: 'Cháu gái' },
]

/** Tạo nhân vật: tên + cháu trai/cháu gái. Đã có hồ sơ thì điền sẵn để sửa. */
export function CreateCharacterScreen({ onDone }: Props) {
  const saved = useStore(profile, (p) => p)
  // State tạm của form để trong component; chỉ ghi vào ProfileController khi bấm Tiếp tục
  const [name, setName] = useState(saved?.name ?? '')
  const [gender, setGender] = useState<Gender | null>(saved?.gender ?? null)
  const ready = cleanName(name) !== '' && gender !== null

  // Dùng <form> + onSubmit: bấm Enter/"Xong" trên bàn phím điện thoại cũng gửi được
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (gender && profile.setProfile(name, gender)) onDone()
  }

  return (
    <motion.form
      onSubmit={submit}
      className="flex flex-1 flex-col justify-center gap-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <header className="text-center">
        <h1 className="font-display text-[32px] leading-tight font-extrabold">Cháu của bà</h1>
        <p className="mt-1 text-[15px] text-ink-soft text-pretty">Bà con trong xóm sẽ gọi bạn theo tên và vai vế này.</p>
      </header>

      <div className="clay flex flex-col gap-5 p-5">
        <label className="flex flex-col gap-2">
          <span className="font-semibold">Tên</span>
          {/* text-[17px]: chữ dưới 16px thì Safari iPhone tự phóng to trang khi chạm vào ô nhập */}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={PROFILE_NAME_MAX}
            autoComplete="off"
            autoCapitalize="words"
            enterKeyHint="done"
            placeholder="Vd: Minh"
            className="h-[52px] rounded-2xl border-2 border-card-edge bg-paper px-4 text-[17px] outline-none focus:border-sun-deep"
          />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-semibold">Bạn là</legend>
          <div className="grid grid-cols-2 gap-3">
            {GENDERS.map((g) => (
              <button
                key={g.value}
                type="button"
                aria-pressed={gender === g.value}
                onClick={() => setGender(g.value)}
                className={`btn-3d h-[52px] text-[17px] ${gender === g.value ? '' : 'btn-soft'}`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <button type="submit" disabled={!ready} className="btn-3d h-[58px] text-[19px]">
        Tiếp tục
      </button>
    </motion.form>
  )
}
