# Tiệm Tạp Hoá Bà Ngoại — v0.3

Game quản lí tiệm tạp hoá bà để lại, ở một làng quê miền Tây. React + Vite + TypeScript + Tailwind v4.

## Chạy

```bash
npm install
npm run dev          # mở http://localhost:5173, dùng DevTools chế độ điện thoại
npm test             # test engine
npm run build        # build thường (dist/)
npm run build:single # gộp thành 1 file HTML (dist-single/) để mở thử trên điện thoại
```

Muốn chơi trên điện thoại thật khi dev: `npm run dev -- --host`, rồi mở địa chỉ IP máy tính trên điện thoại (cùng Wi-Fi).

## Cấu trúc

```
src/
  engine/        Luật game. Hàm thuần, không biết gì về React.
    types.ts       Kiểu dữ liệu: Item, VisitScript, GameState, Outcome…
    config.ts      Mọi con số cân bằng (độ dài ngày, tiền khởi đầu, khoảng nghỉ giữa khách)
    game.ts        resolveSale, tick, restock, startDay, summarizeDay…
    game.test.ts   Test bằng Vitest
  content/       Nội dung game, viết bằng JSON. Thêm kịch bản = thêm file.
    items.json
    days/day-XX.json     Khách viết sẵn cho từng ngày
    random-visits.json   Khách ngẫu nhiên (weight, minDay)
  controllers/   GameController (giữ state, chạy đồng hồ), Store (class cha)
  hooks/useStore.ts      Đọc state từ controller trong React
  ui/            Giao diện
    components/  Hud, Chibi (nhân vật tạm vẽ bằng SVG, sẽ thay bằng asset thật)
    screens/     ShopScreen, RestockSheet, SummaryScreen
```

## Luật đã chốt

- 1 ngày ≈ 5 phút. Hết giờ hoặc hết khách thì đóng cửa.
- Khách tới từng người một, có thanh kiên nhẫn. Hết kiên nhẫn thì bỏ về.
- Khách chỉ nói yêu cầu trong câu thoại (`lines.greet` phải ghi rõ món và số tối đa).
- Người chơi chạm vào món trên kệ để bỏ vào khay (chạm nhiều lần để tăng, chạm chip trong khay để bớt), rồi bấm **Đưa hàng**.
- Đúng món: bán min(số trong khay, tối đa của khách, tồn kho). Đưa dư thì khách trả lại phần dư.
- Có món khách không cần: khách nói `lines.wrongItem`, mất 25% kiên nhẫn (`WRONG_ITEM_PENALTY`), khay được trả lại.
- Nút **Hết hàng rồi**: khách nói `lines.outOfStock` rồi về.
- Khách có `story` thì sau khi **bán thành công** sẽ kể chuyện và cho 3 câu trả lời. Lúc này kiên nhẫn đứng yên, đồng hồ ngày vẫn chạy. Chọn xong khách đáp lại (`reply`) rồi về.
- Hết hàng, đưa nhầm tới mức bỏ về, hoặc hết kiên nhẫn thì **mất câu chuyện** đó.
- Hết giờ lúc đang trò chuyện thì chờ người chơi trả lời xong mới đóng cửa.
- Lựa chọn hiện chỉ đổi lời đáp và được ghi vào log (`Outcome.choiceIndex`), chưa ảnh hưởng gì khác. Màn Tổng kết có mục "Chuyện hôm nay".
- Nhập hàng được bất cứ lúc nào, giá như nhau. Màn nhập hàng **không dừng đồng hồ**.
- Nút tạm dừng thì dừng mọi thứ.
- `Outcome.bondDeltas` đã có sẵn nhưng luôn rỗng, chờ hệ thống Gắn bó.

## Chưa làm

Gắn bó / dân làng rời đi, win/fail, hội thoại lựa chọn, sổ nợ, kỷ niệm, lưu game, asset thật.
