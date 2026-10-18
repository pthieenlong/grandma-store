"""Xử lý ảnh AI gen (trong scratch/) thành asset cho game (trong src/assets/).

    python3 scripts/process_generated_images.py

Cần Python 3 + numpy + Pillow (có WebP). Gen lại ảnh thì sửa đường dẫn/toạ độ cắt ở cuối file rồi chạy lại.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SCRATCH = ROOT / 'scratch'
OUT = ROOT / 'src' / 'assets'

ITEM_IDS = ['mi-goi', 'nuoc-mam', 'gao', 'dau-an', 'keo-me', 'nhang', 'vo', 'dau-gio', 'banh-trang']  # thứ tự 3x3 trong ảnh


def remove_white_background(img: Image.Image, threshold=244, feather_px=2) -> Image.Image:
    """Xoá nền trắng: chỉ xoá vùng gần trắng THÔNG RA MÉP ẢNH (flood fill từ viền),
    nên phần trắng nằm bên trong vật (bao gạo, nhãn vở…) được giữ lại. Viền được làm mềm cho khỏi răng cưa và viền trắng."""
    rgb = np.asarray(img.convert('RGB')).astype(np.float32)
    h, w, _ = rgb.shape
    near_white = (rgb.min(axis=2) >= threshold)

    # Flood fill trên mặt nạ nhị phân: 255 = gần trắng; tô 128 cho vùng nối với mép ảnh
    # .copy(): ảnh từ fromarray dùng chung bộ nhớ numpy ở chế độ chỉ đọc, floodfill sẽ âm thầm không ghi được gì
    mask = Image.fromarray(np.where(near_white, 255, 0).astype(np.uint8), 'L').copy()
    for x in range(w):
        for y in (0, h - 1):
            if mask.getpixel((x, y)) == 255:
                ImageDraw.floodfill(mask, (x, y), 128)
    for y in range(h):
        for x in (0, w - 1):
            if mask.getpixel((x, y)) == 255:
                ImageDraw.floodfill(mask, (x, y), 128)
    background = np.asarray(mask) == 128

    # Dải viền: pixel không phải nền nhưng nằm sát nền trong vòng feather_px
    band = np.zeros_like(background)
    grown = background.copy()
    for _ in range(feather_px):
        g = grown.copy()
        g[1:, :] |= grown[:-1, :]
        g[:-1, :] |= grown[1:, :]
        g[:, 1:] |= grown[:, :-1]
        g[:, :-1] |= grown[:, 1:]
        band |= g & ~grown
        grown = g

    alpha = np.where(background, 0.0, 1.0)
    # Trong dải viền: càng trắng càng trong suốt, rồi "gỡ" phần trắng đã pha vào màu (khỏi viền trắng mờ)
    whiteness = rgb.min(axis=2) / 255.0
    edge_alpha = np.clip((1.0 - whiteness) / (1.0 - threshold / 255.0 + 1e-6), 0.0, 1.0)
    alpha = np.where(band, np.minimum(alpha, edge_alpha), alpha)
    a = alpha[..., None]
    unmixed = np.where(a > 0.01, (rgb - 255.0 * (1 - a)) / np.maximum(a, 0.01), rgb)
    out = np.dstack([np.clip(unmixed, 0, 255), alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')


def paint_enclosed_white(img: Image.Image, color=(92, 62, 42), min_area=60, threshold=165) -> Image.Image:
    """Tô màu cho các mảng trắng BỊ BAO KÍN bên trong vật (vd vách sau tấm kính tủ), giữ độ sáng tối để còn khối.
    Chỉ tô mảng lớn hơn min_area pixel, nên chữ/nhãn trắng nhỏ trên bao bì vẫn giữ nguyên."""
    arr = np.asarray(img.convert('RGBA')).astype(np.float32)
    rgb, alpha = arr[..., :3], arr[..., 3]
    # Vách sau kính là xám nhạt (~197), không trắng hẳn; điều kiện ít màu (max-min nhỏ) để không tô nhầm bao bì có màu
    light = (rgb.min(axis=2) >= threshold) & (alpha > 200) & (rgb.max(axis=2) - rgb.min(axis=2) < 24)

    # Gán nhãn từng mảng bằng floodfill (giá trị 1..254 xoay vòng), đếm diện tích từng mảng
    mask = Image.fromarray(np.where(light, 255, 0).astype(np.uint8), 'L').copy()
    paint = np.zeros(light.shape, bool)
    label = 1
    for y, x in zip(*np.nonzero(light)):
        if mask.getpixel((int(x), int(y))) != 255:
            continue
        ImageDraw.floodfill(mask, (int(x), int(y)), label)
        region = np.asarray(mask) == label
        if region.sum() >= min_area:
            paint |= region
        mask = Image.fromarray(np.where(region, 0, np.asarray(mask)).astype(np.uint8), 'L').copy()  # trả nhãn để dùng lại
        label = label % 250 + 1

    # Nới 1px để tô luôn viền chuyển màu (pixel nửa trắng nửa gỗ), tránh viền sáng quanh mảng
    grown = paint.copy()
    grown[1:, :] |= paint[:-1, :]
    grown[:-1, :] |= paint[1:, :]
    grown[:, 1:] |= paint[:, :-1]
    grown[:, :-1] |= paint[:, 1:]
    band = grown & ~paint & (rgb.min(axis=2) >= threshold - 40)

    lum = rgb.mean(axis=2, keepdims=True) / 255.0
    shaded = np.array(color, np.float32) * (0.8 + 0.6 * (lum - 0.75))  # chỗ sáng hơn thì gỗ sáng hơn chút, giữ khối
    out = rgb.copy()
    out[paint] = shaded[paint]
    out[band] = 0.5 * rgb[band] + 0.5 * shaded[band]
    return Image.fromarray(np.dstack([np.clip(out, 0, 255), alpha]).astype(np.uint8), 'RGBA')


def trim(img: Image.Image, pad_ratio=0.06, square=False) -> Image.Image:
    """Cắt sát phần có hình (theo alpha), chừa lề; square=True thì đặt vào giữa ô vuông."""
    bbox = img.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    img = img.crop(bbox)
    w, h = img.size
    side = max(w, h) if square else None
    pad = round((side or max(w, h)) * pad_ratio)
    cw, ch = (side + 2 * pad, side + 2 * pad) if square else (w + 2 * pad, h + 2 * pad)
    canvas = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    canvas.paste(img, ((cw - w) // 2, (ch - h) // 2))
    return canvas


def resize_to(img: Image.Image, width: int) -> Image.Image:
    return img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)


def save_webp(img: Image.Image, path: Path, width: int, quality=82):
    path.parent.mkdir(parents=True, exist_ok=True)
    img = resize_to(img, width)
    height = img.height
    img.save(path, 'WEBP', quality=quality, method=6)
    print(f'{path.relative_to(ROOT)}  {width}x{height}  {path.stat().st_size / 1024:.1f} KB')


def items():
    sheet = Image.open(SCRATCH / 'Gemini_Generated_Image_1wd2en1wd2en1wd2.png')
    cell = sheet.width // 3
    for i, item_id in enumerate(ITEM_IDS):
        r, c = divmod(i, 3)
        icon = sheet.crop((c * cell, r * cell, (c + 1) * cell, (r + 1) * cell))
        icon = trim(remove_white_background(icon), square=True)
        save_webp(icon, OUT / 'items' / f'{item_id}.webp', 128)


def shop_background():
    bg = Image.open(SCRATCH / 'Gemini_Generated_Image_qkunspqkunspqkun.png').convert('RGB')
    # Cắt theo tỉ lệ khung cảnh trong game (358:168), bỏ góc phải dưới có watermark ✦ của Gemini (~x 2780–2845, y 1300–1360)
    width = 2760
    height = round(width * 168 / 358)
    save_webp(bg.crop((0, 0, width, height)), OUT / 'scene' / 'shop.webp', 1074, quality=78)


def counter():
    shelf = Image.open(SCRATCH / 'Gemini_Generated_Image_s7ndgcs7ndgcs7nd.png')
    # Lấy mặt gỗ + khoảng 1,5 tầng kệ trên cùng; phần dưới sẽ khuất dưới mép khung cảnh
    part = shelf.crop((100, 100, 4028, 640))
    cut = resize_to(trim(remove_white_background(part), pad_ratio=0), 1074)
    # Vách sau tấm kính đang trắng (không thông ra mép nên không bị tách nền): tô nâu gỗ cho hợp tủ
    save_webp(paint_enclosed_white(cut), OUT / 'scene' / 'counter.webp', 1074)


if __name__ == '__main__':
    items()
    shop_background()
    counter()
