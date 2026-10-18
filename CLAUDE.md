# CLAUDE.md

Game mobile web "Tiệm Tạp Hoá Bà Ngoại": quản lí tiệm tạp hoá bà ngoại để lại ở một làng quê miền Tây, mỗi ngày khoảng 5 phút, khách tới từng người, có câu chuyện và lựa chọn. Side project làm vì vui của Long.

**Trước khi đổi luật game, đọc `DECISIONS.md`.** File đó ghi mọi quyết định đã chốt và ai chọn. Đổi luật thì cập nhật file đó trong cùng thay đổi.

## Làm việc với Long

- Trả lời bằng tiếng Việt, giữ thuật ngữ dev bằng tiếng Anh.
- Với quyết định thiết kế hoặc kiến trúc: đưa 2–3 lựa chọn kèm trade-off, đừng tự chốt một hướng.
- Yêu cầu mơ hồ thì hỏi lại trước khi code. Đặc biệt với luật game: một thay đổi nhỏ có thể đụng tới nhiều cơ chế.
- Thẳng thắn, không khen xã giao. Thấy hướng nào có rủi ro (scope creep, phá vỡ luật đã chốt) thì nói.
- Long đang luyện fundamentals (JS, TS, React). Khi dùng một pattern không hiển nhiên, giải thích ngắn vì sao.
- Làm từng bước nhỏ chạy được, không gom nhiều tính năng vào một lần.

## Lệnh

```bash
npm run dev           # dev server, mở bằng DevTools chế độ điện thoại (390×844)
npm run dev -- --host # mở trên điện thoại thật cùng Wi-Fi
npm test              # Vitest, test engine
npx tsc -b            # type-check
npm run lint          # oxlint
npm run build         # build thường → dist/
npm run build:single  # gộp 1 file HTML → dist-single/
```

Sau mỗi thay đổi: `npx tsc -b && npm test`. Cả hai phải sạch.

## Stack

Vite 8, React 19, TypeScript 6 (strict), Tailwind CSS v4 (cấu hình bằng `@theme` trong `src/index.css`, không có `tailwind.config.js`), Vitest, `motion` (animation), `howler` (âm thanh). Không có backend, không có router, không có thư viện state (tự viết `Store` + `useSyncExternalStore`). Lưu game bằng localStorage, chỉ lưu đầu mỗi ngày.

## Kiến trúc

```
src/
  engine/     Luật game. Hàm thuần, KHÔNG import React hay DOM.
    types.ts      Kiểu dữ liệu (Item, VisitScript, Story, GameState, Outcome…)
    config.ts     Mọi con số cân bằng game
    game.ts       resolveGive, give, choose, apologize, restock, tick, setPaused, startDay, summarizeDay…
    clock.ts      Giờ trong game (6h–20h) suy ra từ elapsedMs
    filler.ts     Sinh khách vô danh từ mẫu câu
    rng.ts        Ngẫu nhiên có seed (mulberry32), drawRandom cho rng lưu trong state
    save.ts       toSave / fromSave / parseSave: bản lưu đầu ngày { seed, day, money, inventory }
    game.test.ts
  controllers/ "Vỏ" có state + side effect, viết bằng class, mỗi class một instance (singleton)
    Store.ts            Class cha: getSnapshot / subscribe / setState (hợp đồng của useSyncExternalStore)
    GameController.ts   Giữ GameState, chạy vòng lặp rAF (gom nhịp 100ms), tự tạm dừng khi app bị ẩn, method cho từng hành động, onOutcome
    ProfileController.ts   Tên + giới tính người chơi, lưu localStorage riêng; cleanName()
    SettingsController.ts  Âm lượng nhạc/hiệu ứng, tắt tiếng, giảm chuyển động; lưu localStorage (phòng thủ khi bị chặn)
    AudioController.ts  Bọc Howler: hiệu ứng, nhạc nền crossfade, nghe GameController (Outcome → tiếng). Im lặng tới khi start() trong lần chạm đầu
    SaveController.ts   Nghe game, ghi bản lưu khi sang ngày / đóng cửa / ván mới; restore() dựng lại GameState lúc tải trang
    storage.ts          browserStorage(): localStorage đọc phòng thủ, dùng chung cho Settings và Save
    audioSources.ts     Danh sách file trong src/assets/audio/ (placeholder; thay file thật thì giữ nguyên tên)
    index.ts            Chỗ duy nhất tạo instance: `save`, `game` (dựng từ bản lưu nếu có), `settings`, `profile`, `audio`
    *.test.ts           FrameScheduler giả / storage giả, không cần trình duyệt
  assets/audio/  mp3 (hiệu ứng), opus + mp3 (nhạc lặp). Sinh lại placeholder: scripts/gen_placeholder_audio.py
  assets/items/  Icon món hàng <itemId>.webp (128px, nền trong suốt); ItemIcon tự gom bằng import.meta.glob
  assets/scene/  shop.webp (khung cảnh tiệm), counter.webp (tủ kính trước mặt khách)
                 Ảnh AI gen gốc để trong scratch/ (gitignore), xử lý bằng scripts/process_generated_images.py
  content/    Nội dung game bằng JSON
    items.json, fillers.json, days/day-XX.json, random-visits.json, scenes/intro.json, index.ts (gom bằng import.meta.glob)
  hooks/useStore.ts   useStore(controller, selector): đọc một phần state, chỉ re-render khi phần đó đổi
  ui/         React components (screens/, components/, format.ts: money, hhmm, renderLine)
    selectors.ts  Selector dùng chung cho useStore (giờ game, biểu cảm, kiên nhẫn…)
  App.tsx     Chọn màn: title → create (tạo nhân vật) → intro (SceneScreen) → game; vào game mới game.start(), rồi chọn màn theo phase → chọn màn theo phase; MotionConfig theo cài đặt giảm chuyển động
```

Luồng dữ liệu: UI gọi method của controller (`game.give(tray)`) → controller gọi hàm thuần trong `game.ts` → lưu `GameState` mới bằng `setState` → component đang `useStore` được báo để render lại. Engine không biết controller tồn tại; content truyền vào constructor nên test dùng content giả được.

Kiến trúc kiểu "lõi thuần, vỏ OOP": luật game nằm trong hàm thuần, class chỉ giữ state và lo side effect (vòng lặp, sau này là âm thanh, localStorage).

Vòng đời một khách (`CurrentVisit.status`):
`waiting` (kiên nhẫn giảm) → đưa đúng → `story` nếu khách có `story` (kiên nhẫn đứng yên) → chọn câu trả lời → `leaving` → `null`.
Đưa nhầm: vẫn `waiting`, trừ kiên nhẫn. Hết hàng / hết kiên nhẫn: thẳng sang `leaving`.

## Quy tắc bắt buộc

**Engine**
- Hàm trong `engine/` phải thuần: không mutate state cũ, không `Math.random()` (dùng `createRng(seed)`), không đụng DOM, không `Date.now()`. Ngoại lệ duy nhất hiện có: seed mặc định của `newGame()`.
- Mọi thay đổi tiền, kho, sự kiện trong ngày phải tạo một `Outcome` và đi qua `applyOutcome`. Màn Tổng kết chỉ đọc `todayLog`, đừng tính tiền ở nơi khác.
- Không xoá `Outcome.bondDeltas` dù hiện luôn rỗng: đây là chỗ cho hệ thống Gắn bó sắp làm.
- Con số cân bằng mới thì đặt trong `config.ts`, không hard-code trong `game.ts` hay UI.
- Action không hợp lệ (sai phase, sai status, index ngoài khoảng) thì trả về **đúng object state cũ**, không throw. Test đang kiểm tra bằng `toBe`.
- Thêm hoặc đổi luật trong engine thì thêm test trong `game.test.ts`.

**Content (JSON)**
- Mỗi khách phải có đủ 5 câu: `greet`, `thanks`, `outOfStock`, `leftAngry`, `wrongItem`.
- `greet` phải nói rõ món và số lượng tối đa, vì UI không liệt kê yêu cầu, người chơi chỉ đọc được từ câu này.
- `wrongItem` nên nhắc lại món cần mua.
- Xưng hô theo giới tính người chơi viết inline `{nam|nữ}` (vd `{Thằng|Con nhỏ} này`, `{anh|chị}`), tên người chơi là `{name}`. UI thay lúc hiển thị bằng `renderLine`; engine và `todayLog` giữ câu gốc. Đừng viết cứng "anh", "cậu", "thằng" khi nói về người chơi.
- `story` (không bắt buộc): `text` + đúng 3 `choices`, mỗi choice có `text` và `reply`. Các lựa chọn phải đều hợp lý, không có câu nào rõ ràng là "đúng".
- `id` khách phải duy nhất trên toàn bộ content (`findVisit` tìm theo id). Khách kịch bản đặt hậu tố ngày: `co-hai-d3`.
- `itemId` phải tồn tại trong `items.json`.
- Giọng miền Tây, NPC gọi người chơi là "con/cháu/em" tuỳ vai vế. Bà ngoại đã mất, không bao giờ xuất hiện trực tiếp.

**UI**
- Thiết kế cho điện thoại trước: rộng tối đa 440px, mục tiêu 390×844. Vùng chạm tối thiểu 44px.
- Dùng token màu và class có sẵn trong `src/index.css`: `clay`, `btn-3d` (+ `btn-soft`, `btn-sun`), `bar`, các màu `paper/card/ink/leaf/tile/sun/sky/wood`. Không thêm màu literal mới nếu token đã có.
- Font: `font-display` (Baloo 2) cho tiêu đề, mặc định là Be Vietnam Pro.
- Không dùng emoji làm icon. Icon giao diện thì vẽ SVG inline, có `aria-hidden` hoặc `aria-label`. Hình món hàng dùng `<ItemIcon id>` (ảnh trang trí, tên món luôn có chữ đi kèm).
- Ảnh asset: WebP, nhỏ gọn (icon 128px, cảnh rộng 1074px = 3x của 358px), import qua Vite để `build:single` nhúng được.
- Dùng `<button>` thật cho mọi thứ bấm được. Nút chỉ có icon phải có `aria-label`.
- Chữ trên UI viết tiếng Việt, ngắn, nói theo góc nhìn người chơi.
- Tôn trọng giảm chuyển động: cả `prefers-reduced-motion` của máy lẫn nút trong màn tạm dừng. Animation motion: dùng `useReducedMotionConfig()` (không dùng `useReducedMotion()`, hook đó bỏ qua cài đặt trong game). Animation CSS mới: thêm vào cả `@media (prefers-reduced-motion)` lẫn `:root[data-reduce-motion]` trong `index.css`.
- State tạm của UI (khay hàng, sheet đang mở) để trong component. State game thì chỉ nằm trong controller, đổi qua method của controller.
- Selector truyền vào `useStore` phải trả về giá trị có sẵn trong state, không tạo object mới (sẽ render lặp vô hạn).
- Component tự đọc state bằng `useStore` với selector hẹp nhất có thể, không nhận cả `state` qua props. `elapsedMs` và `patienceLeftMs` đổi mỗi 100ms: chỉ component nhỏ (`PatienceBar`) được đọc trực tiếp; còn lại đọc giá trị suy ra (`selectClockMinutes`, `selectMood`). Trong event handler cần state lúc bấm thì dùng `game.getSnapshot()`, không subscribe.
- Controller mới thì kế thừa `Store`, tạo instance trong `controllers/index.ts`, export class riêng để test tự `new`. Không dùng `static getInstance()`.

**Chung**
- Code identifier bằng tiếng Anh, comment bằng tiếng Việt.
- Không thêm dependency mới khi chưa hỏi Long.
- Không chuyển sang Next.js, không thêm backend, không thêm Three.js. Các quyết định này đã chốt, xem `DECISIONS.md` mục 7.

## Đang dở / sắp làm

Xem `DECISIONS.md` mục 5 và 9. Việc lớn tiếp theo có khả năng nhất là hệ thống Gắn bó: model `Household`, gắn điểm vào `StoryChoice`, Gắn bó giảm dần mỗi ngày, màn Làng, rồi tới win/fail.
