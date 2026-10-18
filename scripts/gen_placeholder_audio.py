"""Sinh âm thanh placeholder cho Tiệm Tạp Hoá Bà Ngoại.

Mọi thứ tổng hợp bằng toán (sine, Karplus-Strong), không dùng file mẫu nào. Cần Python 3 + numpy, và ffmpeg để nén.

    python3 scripts/gen_placeholder_audio.py /tmp/tiem-audio
    # Hiệu ứng → mp3; nhạc → opus (lặp liền mạch) + mp3 (dự phòng cho Safari)
    for n in coin wrong bell tap angry restock night; do
      ffmpeg -y -i /tmp/tiem-audio/$n.wav -ac 1 -codec:a libmp3lame -b:a 64k src/assets/audio/$n.mp3
    done
    for n in music-day music-evening; do
      ffmpeg -y -i /tmp/tiem-audio/$n.wav -ac 1 -codec:a libopus -b:a 40k src/assets/audio/$n.opus
      ffmpeg -y -i /tmp/tiem-audio/$n.wav -ac 1 -codec:a libmp3lame -b:a 56k src/assets/audio/$n.mp3
    done

Có file âm thanh thật thì bỏ script này đi, chỉ cần thay file trong src/assets/audio/ (giữ nguyên tên).
"""

import sys
import wave
from pathlib import Path

import numpy as np

SR = 44100
rng = np.random.default_rng(7)


def t_axis(sec):
    return np.arange(int(SR * sec)) / SR


def env(n, attack=0.005, decay=0.2):
    """Đường bao: lên nhanh, tắt dần theo hàm mũ."""
    t = np.arange(n) / SR
    a = np.clip(t / attack, 0, 1)
    return a * np.exp(-t / decay)


def tone(freq, sec, decay=0.2, partials=((1, 1.0),), attack=0.004):
    t = t_axis(sec)
    out = sum(amp * np.sin(2 * np.pi * freq * mul * t) for mul, amp in partials)
    return out * env(len(t), attack, decay)


def pluck(freq, sec, damping=0.996, brightness=0.5):
    """Karplus-Strong: một bộ đệm nhiễu chạy vòng, mỗi vòng lấy trung bình 2 mẫu kề nhau → giống tiếng dây gảy."""
    n = int(SR * sec)
    period = max(2, int(round(SR / freq)))
    buf = rng.uniform(-1, 1, period)
    # Làm mềm nhiễu ban đầu cho tiếng bớt chói (giống gảy bằng ngón thay vì móng)
    for _ in range(int((1 - brightness) * 4)):
        buf = 0.5 * (buf + np.roll(buf, 1))
    out = np.empty(n)
    for i in range(n):
        j = i % period
        out[i] = buf[j]
        buf[j] = damping * 0.5 * (buf[j] + buf[(j + 1) % period])
    return out * env(n, 0.002, sec)


def place(track, sound, at_sec, gain=1.0, wrap=False):
    """Cộng `sound` vào `track` tại thời điểm at_sec. wrap=True: phần dư cuộn về đầu (để nhạc lặp liền mạch)."""
    start = int(at_sec * SR)
    for k in range(len(sound)):
        idx = start + k
        if idx >= len(track):
            if not wrap:
                break
            idx %= len(track)
        track[idx] += sound[k] * gain


def normalize(x, peak_db=-3.0):
    peak = np.max(np.abs(x)) or 1.0
    return x / peak * (10 ** (peak_db / 20))


def fade_edges(x, ms=4):
    n = int(SR * ms / 1000)
    x = x.copy()
    x[:n] *= np.linspace(0, 1, n)
    x[-n:] *= np.linspace(1, 0, n)
    return x


def write(path, x):
    data = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def note(name):
    """'C4' → tần số."""
    names = {'C': -9, 'D': -7, 'E': -5, 'F': -4, 'G': -2, 'A': 0, 'B': 2}
    semis = names[name[0]] + (1 if '#' in name else 0)
    octave = int(name[-1])
    return 440.0 * 2 ** ((semis + (octave - 4) * 12) / 12)


# ---------- Hiệu ứng ----------

def sfx_coin():
    # "Ting ting": 2 nốt cao, nốt sau ngân dài hơn
    a = tone(note('E6'), 0.12, 0.05, ((1, 1), (2, 0.25)))
    b = tone(note('B6'), 0.45, 0.14, ((1, 1), (2, 0.2), (3, 0.08)))
    out = np.zeros(int(SR * 0.5))
    place(out, a, 0)
    place(out, b, 0.07)
    return normalize(out, -4)


def sfx_wrong():
    # 2 nốt trầm đi xuống, tiếng tam giác mềm (không chói như còi)
    def tri(f, sec):
        t = t_axis(sec)
        wave_ = 2 / np.pi * np.arcsin(np.sin(2 * np.pi * f * t))
        return wave_ * env(len(t), 0.005, 0.09)
    out = np.zeros(int(SR * 0.32))
    place(out, tri(note('G3'), 0.15), 0)
    place(out, tri(note('D3'), 0.2), 0.12)
    return normalize(out, -5)


def sfx_bell():
    # Chuông treo cửa "leng keng": các hoạ âm không chẵn (giống kim loại), gõ 2 lần
    partials = ((1, 1), (2.76, 0.5), (5.4, 0.25), (8.93, 0.1))
    strike = tone(1650, 0.9, 0.28, partials, attack=0.001)
    out = np.zeros(int(SR * 1.0))
    place(out, strike, 0)
    place(out, tone(1850, 0.8, 0.22, partials, attack=0.001), 0.11, 0.6)
    return normalize(out, -8)


def sfx_tap():
    # Gõ mõ gỗ nhẹ: sine ngắn + chút nhiễu
    t = t_axis(0.06)
    body = np.sin(2 * np.pi * 950 * t) * env(len(t), 0.001, 0.012)
    click = rng.uniform(-1, 1, len(t)) * env(len(t), 0.0005, 0.003) * 0.3
    return normalize(body + click, -9)


def sfx_angry():
    # "Hừm" đi xuống: cao độ trượt từ 380Hz xuống 170Hz
    t = t_axis(0.45)
    freq = np.linspace(380, 170, len(t))
    phase = 2 * np.pi * np.cumsum(freq) / SR
    x = (np.sin(phase) + 0.3 * np.sin(2 * phase)) * env(len(t), 0.01, 0.2)
    return normalize(x, -6)


def sfx_restock():
    # Thùng hàng đặt xuống: tiếng "bịch" trầm
    t = t_axis(0.2)
    freq = np.linspace(160, 70, len(t))
    thump = np.sin(2 * np.pi * np.cumsum(freq) / SR) * env(len(t), 0.002, 0.05)
    noise = rng.uniform(-1, 1, len(t)) * env(len(t), 0.001, 0.015) * 0.4
    return normalize(thump + noise, -5)


def sfx_night():
    # Đóng cửa: 3 nốt ngũ cung đi lên, ngân dài
    out = np.zeros(int(SR * 2.2))
    for i, n in enumerate(['G4', 'C5', 'D5']):
        place(out, pluck(note(n), 1.6, 0.998, 0.6), i * 0.22)
    return normalize(out, -6)


# ---------- Nhạc nền ----------

def music(bpm, scale, melody, bass, bars, octave_shift=0, pluck_damp=0.997, gain_mel=1.0):
    """Nhạc lặp: melody là danh sách (bậc trong thang, độ dài tính bằng nốt móc đơn), None = nghỉ.
    Đuôi nốt cuối cuộn về đầu bài để lặp liền mạch."""
    beat = 60 / bpm
    eighth = beat / 2
    length = bars * 4 * beat
    track = np.zeros(int(SR * length))

    def freq(degree):
        octave, idx = divmod(degree, len(scale))
        return note(scale[idx]) * 2 ** (octave + octave_shift)

    # Giai điệu
    pos = 0.0
    for degree, eighths in melody:
        if degree is not None:
            place(track, pluck(freq(degree), min(2.5, eighths * eighth + 1.2), pluck_damp, 0.55), pos, gain_mel, wrap=True)
        pos += eighths * eighth
    assert abs(pos - length) < 1e-6, f'giai điệu dài {pos}s, cần {length}s'

    # Bè trầm: mỗi phách 1 và 3 gảy nốt gốc/quãng 5, nhỏ hơn giai điệu
    for bar in range(bars):
        root, fifth = bass[bar % len(bass)]
        place(track, pluck(freq(root) / 4, 2.0, 0.998, 0.3), bar * 4 * beat, 0.55, wrap=True)
        place(track, pluck(freq(fifth) / 4, 2.0, 0.998, 0.3), bar * 4 * beat + 2 * beat, 0.4, wrap=True)
    return normalize(track, -7)


def music_day():
    # Ngũ cung trưởng (giống "hơi Bắc"): C D E G A. Vui, nhẹ, 92 bpm, 8 ô nhịp
    scale = ['C4', 'D4', 'E4', 'G4', 'A4']
    m = [
        (4, 2), (5, 1), (4, 1), (2, 2), (3, 2),
        (4, 1), (3, 1), (2, 2), (1, 2), (None, 2),
        (2, 2), (3, 1), (4, 1), (5, 2), (7, 2),
        (6, 1), (5, 1), (4, 4), (None, 2),
        (4, 2), (5, 1), (4, 1), (2, 2), (3, 2),
        (4, 1), (3, 1), (2, 2), (1, 2), (0, 2),
        (1, 2), (2, 1), (4, 1), (3, 2), (2, 1), (1, 1),
        (0, 6), (None, 2),
    ]
    bass = [(0, 3), (0, 3), (1, 4), (3, 0), (0, 3), (0, 3), (1, 4), (0, 3)]
    return music(92, scale, m, bass, bars=8)


def music_evening():
    # Ngũ cung thứ (giống "hơi Oán" nhẹ): A C D E G. Chậm, trầm, nhiều chỗ nghỉ, 66 bpm
    scale = ['A3', 'C4', 'D4', 'E4', 'G4']
    m = [
        (3, 3), (2, 1), (1, 2), (None, 2),
        (2, 2), (3, 2), (5, 4),
        (4, 3), (3, 1), (2, 2), (1, 2),
        (0, 6), (None, 2),
        (3, 3), (4, 1), (5, 2), (4, 2),
        (3, 2), (2, 2), (1, 4),
        (2, 3), (1, 1), (0, 2), (1, 2),
        (0, 6), (None, 2),
    ]
    bass = [(0, 3), (1, 4), (3, 0), (0, 3)]
    return music(66, scale, m, bass, bars=8, pluck_damp=0.998, gain_mel=0.9)


SOUNDS = {
    'coin': sfx_coin,
    'wrong': sfx_wrong,
    'bell': sfx_bell,
    'tap': sfx_tap,
    'angry': sfx_angry,
    'restock': sfx_restock,
    'night': sfx_night,
    'music-day': music_day,
    'music-evening': music_evening,
}

if __name__ == '__main__':
    out_dir = Path(sys.argv[1])
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, fn in SOUNDS.items():
        x = fn()
        if not name.startswith('music'):
            x = fade_edges(x)
        write(out_dir / f'{name}.wav', x)
        print(f'{name}: {len(x) / SR:.2f}s')
