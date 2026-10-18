export type Mood = 'normal' | 'happy' | 'worried' | 'sad'

const SKINS = ['#f3c9a2', '#e9b98f', '#f6d3b3', '#dcaa7f']
const SHIRTS = ['#7fb3c9', '#e59b7b', '#9cc28a', '#d7a6c8', '#e8c56a', '#8fa3d6']
const HAIRS = ['#3b2a22', '#4a3328', '#2e2420', '#5a3a2a']

function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/**
 * Nhân vật chibi tạm vẽ bằng SVG, chỉ để thay chỗ cho asset thật.
 * Màu suy ra từ tên nên mỗi NPC luôn trông giống nhau giữa các ngày.
 */
export function Chibi({ name, mood }: { name: string; mood: Mood }) {
  const h = hash(name)
  const elder = /^(Ông|Bà)/.test(name)
  const skin = SKINS[h % SKINS.length]
  const shirt = SHIRTS[(h >> 3) % SHIRTS.length]
  const hair = elder ? '#d9d4cc' : HAIRS[(h >> 5) % HAIRS.length]
  const ink = '#4a3426'

  const eyes =
    mood === 'happy' ? (
      <g fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round">
        <path d="M54 84 q8 -9 16 0" />
        <path d="M90 84 q8 -9 16 0" />
      </g>
    ) : mood === 'sad' ? (
      <g fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round">
        <path d="M54 82 q8 8 16 0" />
        <path d="M90 82 q8 8 16 0" />
      </g>
    ) : (
      <g fill={ink}>
        <ellipse cx="62" cy="84" rx="6" ry="7.5" />
        <ellipse cx="98" cy="84" rx="6" ry="7.5" />
        <circle cx="64" cy="81" r="2" fill="#fff" />
        <circle cx="100" cy="81" r="2" fill="#fff" />
      </g>
    )

  const brows =
    mood === 'worried' || mood === 'sad' ? (
      <g fill="none" stroke={ink} strokeWidth="3.5" strokeLinecap="round">
        <path d="M52 70 l14 -5" />
        <path d="M108 70 l-14 -5" />
      </g>
    ) : null

  const mouth =
    mood === 'happy' ? (
      <path d="M68 100 q12 14 24 0 z" fill="#c4564a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
    ) : mood === 'sad' ? (
      <path d="M70 106 q10 -8 20 0" fill="none" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />
    ) : mood === 'worried' ? (
      <path d="M70 103 q5 -4 10 0 q5 4 10 0" fill="none" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />
    ) : (
      <path d="M72 100 q8 7 16 0" fill="none" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />
    )

  return (
    <svg viewBox="0 0 160 190" className="h-full w-auto" aria-hidden="true">
      {/* thân */}
      <path d="M30 190 q0 -62 50 -62 q50 0 50 62 z" fill={shirt} />
      <path d="M44 150 q36 16 72 0" fill="none" stroke="rgb(255 255 255 / 0.35)" strokeWidth="5" strokeLinecap="round" />
      {/* đầu */}
      <circle cx="80" cy="80" r="50" fill={skin} />
      <ellipse cx="66" cy="58" rx="16" ry="9" fill="rgb(255 255 255 / 0.35)" />
      {/* tóc */}
      {elder ? (
        <g fill={hair}>
          <path d="M30 78 q2 -50 50 -50 q48 0 50 50 q-10 -26 -50 -26 q-40 0 -50 26z" />
          <circle cx="80" cy="26" r="14" />
        </g>
      ) : (
        <path d="M28 82 q0 -56 52 -56 q52 0 52 56 q-14 -8 -22 -28 q-22 18 -62 14 q-10 6 -20 14z" fill={hair} />
      )}
      {/* má hồng */}
      <ellipse cx="50" cy="98" rx="9" ry="6" fill="#f29c8f" opacity="0.6" />
      <ellipse cx="110" cy="98" rx="9" ry="6" fill="#f29c8f" opacity="0.6" />
      {brows}
      {eyes}
      {mouth}
      {mood === 'sad' && <path d="M106 92 q-4 8 0 12 q4 -4 0 -12z" fill="#8fc6e6" />}
    </svg>
  )
}
