# Tiệm Tạp Hoá Bà Ngoại — Quyết định thiết kế

Tài liệu gom mọi quyết định đã chốt giữa Long và Claude, tính tới bản **v0.3** (18/10/2026).
Mỗi quyết định ghi rõ **ai chọn**:

- **Long**: Long đã chọn hoặc đồng ý rõ ràng. Muốn đổi thì cân nhắc kỹ.
- **Claude (mặc định)**: Claude tự quyết để code chạy được, Long chưa xác nhận. Đổi thoải mái.

Khi đổi luật game, cập nhật file này cùng lúc với code.

---

## 1. Tổng quan

| | |
|---|---|
| Thể loại | Game quản lí cửa hàng theo ngày + lựa chọn hội thoại, chơi trên điện thoại (trình duyệt) |
| Mục tiêu dự án | **Làm vì vui.** Không bán, không lên app store. Ưu tiên giữ hứng thú và làm xong từng phần chơi được. |
| Nhân vật chính | Đứa cháu ở Sài Gòn, áp lực công việc nên về quê (lấy cảm hứng Stardew Valley, nhưng đặt ở Việt Nam). |
| Premise | Bà ngoại **đã mất**, để lại căn nhà và tiệm tạp hoá. Bà không xuất hiện trong game. |
| Động lực | Giữ nơi ở và kỷ niệm của bà, song song với xây dựng tình cảm với dân làng. |
| Xung đột | Một công ty bất động sản muốn mua đất cả làng để xây resort, cho hạn tới **Tết**. |
| Giọng văn | Thoại giọng miền Tây ("hông", "nghen", "bây", "chớ"). NPC gọi người chơi là cháu bà, dân Sài Gòn về. |

**Hướng đi riêng so với Stardew:** dựa vào văn hoá thờ cúng và ký ức gia đình Việt (bàn thờ bà, thắp nhang mỗi tối, đám giỗ, Tết là dịp con cháu về quê).

---

## 2. Win / Fail

> **Trạng thái: đã chốt hướng, CHƯA code.** Game hiện tại chạy 30 ngày rồi hiện màn "Tết tới rồi", chưa có thắng/thua.

| Quyết định | Nội dung | Ai chọn |
|---|---|---|
| Fail state | Dân làng rời đi vì người chơi không xây đủ tình cảm để họ ở lại. | Long |
| Chỉ 1 điều kiện thua | Không có thua riêng kiểu "mất nhà của bà". Nhà nằm trong làng, làng mất thì nhà mất. | Long |
| Đơn vị đo | Theo **hộ** (khoảng 6–8 hộ), mỗi hộ có chỉ số **Gắn bó** 0–100. Đây là điểm giữa: người chơi thấy rõ "nhà ông Bảy sắp đi", nhưng không phải viết story riêng cho quá nhiều nhân vật. | Long đồng ý |
| Gắn bó giảm dần | Mỗi ngày giảm nhẹ vì công ty vẫn đi vận động. Tăng nhờ hành động của người chơi. | Long đồng ý |
| Ngưỡng rời làng | Gắn bó < 20 thì hộ đó ký đền bù và rời đi. **Không cứu lại được.** | Long đồng ý |
| Thua sớm | Quá nửa số hộ đã rời đi trước Tết. | Long đồng ý |
| Thua lúc deadline | Tới Tết vẫn không đủ số hộ ở lại. | Long đồng ý |
| Thắng | Tới Tết còn đủ hộ thì công ty rút lui. 2–3 mức kết: trọn vẹn (không ai đi), vui buồn lẫn lộn (giữ được làng nhưng vài hộ đã đi). | Long đồng ý |
| Hiển thị Gắn bó | **Bằng số** (vd 73), không chỉ bằng chữ. | Long |
| Áp lực hiện dần | NPC than thở, bán đồ đạc trước khi rời đi. Người chơi phải thấy cảnh báo, không bị thua bất ngờ. | Claude đề xuất |

**Chưa chốt:**
- Ngưỡng thắng: giữ lại bao nhiêu hộ (vd 5/8)?
- Phá sản có tính là thua không, hay cho âm tiền / thua gián tiếp?
- Số ngày tới Tết: code đang để 30 (khoảng 2,5 tiếng chơi). Lựa chọn khác là 60–90 ngày (sâu hơn nhưng cần nhiều sự kiện hơn).
- Số hộ: wireframe đang vẽ 6 hộ.

**Ý tưởng chưa chốt (Claude đề xuất):**
- *Dân làng là người giữ ký ức về bà.* Gắn bó với một hộ đạt mốc thì hộ đó kể chuyện về bà và mở khoá một Kỷ niệm. Hộ rời làng thì mất luôn những ký ức đó. Như vậy "giữ làng" và "giữ kỷ niệm của bà" trở thành một việc.
- *Cuốn sổ nợ cũ của bà.* Đòi nợ thì có tiền nhưng mất lòng, xoá nợ thì được lòng nhưng tiệm khó khăn. Mỗi dòng nợ là một câu chuyện về bà.

---

## 3. Nguyên tắc thiết kế

| Nguyên tắc | Ý nghĩa | Ai chọn |
|---|---|---|
| Tiền là phương tiện, tình cảm là mục tiêu | Mọi quyết định trong tiệm nên có trade-off giữa tiền và Gắn bó, để phần quản lí không bị rời khỏi phần cứu làng. | Long đồng ý |
| Lựa chọn không có đúng/sai rõ ràng | Người chơi không đoán được lựa chọn nào tốt hay xấu, lựa chọn nào cũng hợp lý. | Long |
| Ẩn lúc chọn, hiện sau | Lúc chọn không thấy hệ quả. Ngay sau đó NPC đổi biểu cảm, cuối ngày màn Tổng kết hiện số. | Claude đề xuất, Long đồng ý |
| Kết quả theo tính cách NPC | Cùng một câu, người này thích người kia phật ý. Người chơi học dần tính từng người, nên đây là kỹ năng chứ không phải may rủi. *Chưa code.* | Claude đề xuất |
| Làm đơn giản trước | Xây từng cơ chế một, chạy được rồi mới thêm. | Long |
| Giữ hình dạng dữ liệu, hoãn logic | Hệ thống chưa làm (Gắn bó) vẫn có chỗ trong dữ liệu (`Outcome.bondDeltas`) để sau này không phải đập lại. | Claude đề xuất |

---

## 4. Cơ chế đã làm (v0.3)

### 4.1 Thời gian

| Luật | Giá trị | Ai chọn |
|---|---|---|
| Một ngày chạy theo thời gian thực | ≈ 5 phút (`DAY_LENGTH_MS`) | Long |
| Có thanh tiến độ ngày | Đồng hồ trong game. **Không hiện số khách trong ngày**: người chơi không biết hôm nay còn bao nhiêu khách. | Long |
| Thanh thời gian chạy liên tục | Nhích theo từng nhịp 100ms (không theo bước 10 phút của đồng hồ), phần đã đầy có sọc chéo trôi; tạm dừng thì sọc đứng, giảm chuyển động thì sọc không trôi. Cập nhật thẳng `style.width` qua `game.subscribe`, không re-render React. | Long (yêu cầu), Claude (cách làm) |
| Đồng hồ trong game | Mở cửa 6:00, đóng 20:00 (`OPEN_HOUR`, `CLOSE_HOUR`). 1 tiếng game ≈ 21 giây thật. **Chỉ để hiển thị**: suy ra từ `elapsedMs` (`engine/clock.ts`), luật vẫn tính bằng ms. | Long |
| Đồng hồ nhảy từng 10 phút | `CLOCK_STEP_MIN`, cho đỡ rối mắt (kiểu Stardew). | Claude (mặc định) |
| Buổi trong ngày | Sáng < 11h, trưa < 13h, chiều < 18h, còn lại là tối. Hiện chỉ dùng cho nhãn và màu trời. | Claude (mặc định) |
| Trời đổi màu theo giờ | Rạng sáng → trưa → chiều tà → chạng vạng, mặt trời đi vòng cung. Nhân vật và quầy không bị tối (như có đèn trong tiệm). | Long (chọn hướng), Claude (màu, mốc giờ) |
| Quá 20:00 lúc đang trò chuyện | Đồng hồ đứng ở 20:00. | Claude (mặc định) |
| Đếm ngược Tết | "Còn X ngày tới Tết" dưới "Ngày X". Chưa dùng âm lịch. | Long |
| Chỉ có 2 phase | `open` → `night` (Tổng kết). Không có phase buổi sáng riêng: đầu ngày là lúc chưa có khách, người chơi tự nhập hàng. | Claude (mặc định) |
| Hết giờ thì đóng cửa | Khách đang chờ thì không bị tính là bỏ về giận. | Claude (mặc định) |
| Không đóng cửa sớm | Khách tới liên tục tới 20:00 (bỏ luật "hết khách thì đóng cửa sớm" của v0.3). | Long |
| Nút tạm dừng | Dừng mọi thứ: đồng hồ, kiên nhẫn. | Claude (mặc định) |
| Màn tạm dừng | Chỉnh âm lượng nhạc nền / hiệu ứng, tắt tiếng, giảm chuyển động ngay tại chỗ. Esc để chơi tiếp. Không có "Chơi lại" hay "Hướng dẫn". | Long |
| Tự tạm dừng khi rời app | Chuyển tab / khoá màn hình thì tự tạm dừng; quay lại thấy màn tạm dừng, phải tự bấm "Chơi tiếp". Buổi tối (Tổng kết) thì không ảnh hưởng. | Long |
| Màn mở đầu | Tên game + "Mở cửa tiệm". Đồng hồ chỉ chạy sau khi bấm. Cú chạm này dùng để mở khoá âm thanh trên điện thoại (bước 4). | Long |
| Tab bị ẩn thì tự dừng | Dùng `requestAnimationFrame`, không cộng dồn `setInterval`. Từ v0.4 còn bật luôn `paused` (xem dòng "Tự tạm dừng khi rời app"). | Claude (kỹ thuật) |

### 4.2 Khách hàng

| Luật | Giá trị | Ai chọn |
|---|---|---|
| Từng khách một | Không dồn dập 2–3 khách cùng lúc. Tối đa 1 khách ở quầy. | Long |
| Có thanh kiên nhẫn | Mỗi khách có `patienceMs` riêng (12–25 giây). Hết kiên nhẫn thì bỏ về. | Long |
| Khoảng nghỉ giữa 2 khách | Khách đầu tới sau 4 giây, sau đó cách nhau 2–5 giây (ngẫu nhiên). Trước đây 6–14 giây: chơi thử thấy quầy trống gần nửa thời gian. Rút ngày không giúp vì tỉ lệ trống tính theo từng lượt khách. | Long (chọn giảm gap), Claude (con số) |
| Khách tới liên tục | Quầy trống là có khách tiếp, khoảng 20–25 khách/ngày (ước lượng, chưa đo). Không còn "hết khách". | Long |
| Quầy trống giữa 2 khách | Để cảnh trống, không hiện chữ (trước là "Quầy đang vắng, khách sắp tới…": giọng hệ thống, lại nháy liên tục khi gap ngắn). Chỉ hiện "Sắp đóng cửa rồi" khi gần đóng cửa. | Long |
| Khách vô danh lấp chỗ trống | Tự sinh từ `content/fillers.json`: tên vai (Bà bán xôi, Chú thợ hồ…), món ngẫu nhiên theo `weight`, câu thoại ghép từ mẫu (`{self}`, `{player}`, `{wants}`). **Không có story**, được lặp lại. | Long |
| Khách vô danh mua gì | 1 món, 20% là 2 món (`FILLER_TWO_ITEMS_CHANCE`). Số lượng 1 tới `maxQty` của món. Kiên nhẫn 12–20 giây. | Claude (mặc định) |
| Khách có tên rải đều trong ngày | Khách kịch bản + khách ngẫu nhiên có tên được lên lịch đều từ 6h tới 16h (`PLANNED_LAST_HOUR`), giữ thứ tự viết. Tới hạn trong 20 giây (`PLANNED_LOOKAHEAD_MS`) thì quầy chờ họ, không cho khách vô danh chen. Kết quả: khách có chuyện luôn tới trước khoảng 17h. | Long (chọn hướng), Claude (con số) |
| Sát giờ đóng cửa | Còn dưới 10 giây (`FILLER_CUTOFF_MS`) thì không đón khách vô danh nữa. | Claude (mặc định) |
| Khách theo kịch bản từng ngày | `content/days/day-XX.json`, giữ đúng thứ tự viết. | Long |
| Thêm khách ngẫu nhiên có tên | Bốc từ `random-visits.json` theo `weight`, lọc theo `minDay`, không trùng trong một ngày, chen vào vị trí ngẫu nhiên trong lịch khách có tên. | Long |
| Ngày chưa có kịch bản | 5 khách ngẫu nhiên có tên, còn lại là khách vô danh. | Claude (mặc định) |
| Ngẫu nhiên có seed | Cùng seed ra cùng hàng đợi, để test và tái hiện bug. | Claude (kỹ thuật) |

### 4.3 Bán hàng

| Luật | Giá trị | Ai chọn |
|---|---|---|
| Giá bán cố định | Không cho người chơi tự đặt giá (v0.x). | Claude (mặc định), Long chưa phản đối |
| Khách muốn mua "tối đa N" | Tiệm còn bao nhiêu bán bấy nhiêu, không vượt N. Không có trường hợp "tất cả hoặc không". | Long |
| Yêu cầu chỉ nằm trong câu thoại | UI không liệt kê món khách cần. Người chơi phải đọc `lines.greet`. | Long |
| Tự chọn món thay vì bấm "Bán" | Chạm món trên **Kệ hàng** để bỏ vào **Khay**, chạm nhiều lần để tăng, chạm chip trong khay để bớt, rồi bấm **Đưa hàng**. | Long |
| Không cho bỏ vào khay quá tồn kho | Món hết hàng bị làm mờ trên kệ. | Claude (mặc định) |
| Đưa nhầm món | Khách nhắc lại (`lines.wrongItem`), mất 25% kiên nhẫn (`WRONG_ITEM_PENALTY`), khay trả về rỗng. Nhầm khoảng 4 lần là khách bỏ về. | Long (chọn hướng), Claude (con số 25%) |
| Đưa dư | Khách chỉ lấy đủ mức tối đa, trả lại phần dư, **không** tính là nhầm. | Claude (mặc định) |
| Khách cần 2 món, chỉ đưa đủ 1 | Vẫn bán được món đó. | Claude (mặc định) |
| Nút "Hết hàng rồi" | Khách nói `lines.outOfStock` rồi về. | Claude (mặc định) |
| Khách đứng lại sau câu cuối | Lâu hay nhanh theo độ dài câu: 55ms/ký tự, từ 2,2 tới 6 giây. | Claude (mặc định) |

### 4.4 Nhập hàng

| Luật | Giá trị | Ai chọn |
|---|---|---|
| Nhập được bất cứ lúc nào trong ngày | Kể cả khi đang có khách. | Long |
| Giá nhập giữa ngày | **Như giá thường.** Cái giá phải trả (đắt hơn, hàng tới trễ…) tạm để yên, xây dần sau. | Long |
| Màn nhập hàng không dừng đồng hồ | Khách đang chờ vẫn mất kiên nhẫn. Người chơi tự học: nhập lúc vắng khách thì an toàn. | Claude (mặc định) |
| Nút +1 / +5 | Không đủ tiền thì nút bị khoá. | Claude (mặc định) |

### 4.5 Trò chuyện sau khi bán

| Luật | Giá trị | Ai chọn |
|---|---|---|
| Câu chuyện xuất hiện sau khi bán thành công | Khách có `story` thì kể chuyện thay vì cảm ơn. | Long |
| 3 câu trả lời | Mỗi câu có `reply` riêng của khách. | Long |
| Lúc trò chuyện | Kiên nhẫn đứng yên, đồng hồ ngày vẫn chạy. | Long |
| Bán hỏng là mất chuyện | Hết hàng, khách bỏ về, đưa nhầm tới mức khách đi thì không được nghe chuyện đó. | Claude (mặc định) |
| Hết giờ lúc đang trò chuyện | Chờ trả lời xong mới đóng cửa, không cắt ngang. | Claude (mặc định) |
| Lựa chọn chưa có tác dụng | Chỉ đổi câu đáp, được ghi vào log (`Outcome.choiceIndex`) để gắn điểm Gắn bó sau. | Claude (mặc định) |
| Không phải khách nào cũng có chuyện | 12/19 khách có chuyện. Khách ngẫu nhiên phần lớn mua xong là về. | Claude (mặc định) |

**Mạch chuyện hiện có (ngày 1–3):** chú Tám thấy người đo đất "quy hoạch" → anh Sáu lên huyện gặp công ty du lịch → dì Năm kể có người hỏi mua đất nhà anh Sáu. Người mặc vest (khách ngẫu nhiên từ ngày 2) là người của dự án.

### 4.6 Tổng kết cuối ngày

- Tiền đầu ngày, bán hàng, nhập hàng, cuối ngày.
- Đếm: khách mua, hết hàng, đưa nhầm, bỏ về.
- "Chuyện hôm nay": khách nào kể chuyện, người chơi đã đáp gì.
- Kho còn lại.
- Nút "Thắp nhang cho bà, đi ngủ" để sang ngày mới. Ngày cuối là "Đón Tết".

---

## 5. Hoãn lại / chưa làm

| Mục | Trạng thái |
|---|---|
| Hệ thống Gắn bó, hộ rời làng, win/fail | Hoãn. "Tính tới relationship sau." Dữ liệu đã chừa sẵn `bondDeltas`. |
| Sổ ghi nợ (cho khách mua thiếu) | Hoãn. "Tập trung cái đơn giản trước." |
| Giá phải trả khi nhập hàng giữa ngày | Hoãn. "Xây dựng từ từ lên." |
| Lựa chọn tốn tiền/tốn hàng | Chưa quyết. Ví dụ "anh cho thêm một cục kẹo" của Thằng Tí hiện **không** trừ kho. |
| Tính cách NPC (`traits`) | Chưa làm. |
| Kỷ niệm về bà | Mới có nhãn trên UI, chưa có nội dung. |
| Màn Làng (danh sách hộ + Gắn bó) | Có trong wireframe, chưa code. |
| Lưu game | Chưa có. Tải lại trang là chơi lại từ đầu. |
| Asset thật | Đã có icon món hàng, khung cảnh tiệm, tủ kính. Nhân vật vẫn là SVG tạm, âm thanh là placeholder tổng hợp. |

**Edge case đã ghi nhận, chưa xử lý:**
- ~~Hết giờ mà khách mang story vẫn còn trong hàng đợi thì mất story đó.~~ Đã xử lý ở v0.4: khách có tên được lên lịch trước 16h.
- Khách vô danh lặp tên khá nhiều trong một ngày (8 vai, khoảng 9–10 lượt), câu chào chỉ có 4 mẫu. Thêm vai và mẫu câu trong `fillers.json` khi thấy nhàm.
- Kinh tế: khách gấp đôi nên doanh thu/ngày gần gấp đôi v0.3, sau khi giảm gap còn tăng thêm (khoảng 20–25 khách/ngày). Chưa chỉnh lại giá hay tiền khởi đầu. Hàng cũng hết nhanh hơn.
- Câu thoại dài (vd chú Tám) có thể khó đọc khi đang vội. Cách nhẹ nhất nếu thấy bực: in đậm tên món trong câu.

**Lỗi đã biết:**
- Chibi tạm không phân biệt giới tính (Cô Hai trông giống con trai).

---

## 6. Hình ảnh và assets

| Quyết định | Nội dung | Ai chọn |
|---|---|---|
| Phong cách | Dễ thương, chibi, cozy, hơi hướng 3D. | Long |
| Cách hiểu "3D" | **Trông** 3D (phong cách đất sét: bo tròn dày, nút có mép đổ bóng, bấm thì lún), không phải 3D thật bằng Three.js (scope tăng gấp mấy lần). | Claude đề xuất |
| Nguồn hình | AI generate, vì làm vì vui nên không lo license. Style prompt gợi ý: "3D clay render chibi". | Long đồng ý |
| Thứ tự | Wireframe → cơ chế dùng placeholder → chơi thử thấy ổn → **mới gen asset thật**, để không phải gen lại khi layout đổi. | Claude đề xuất, Long đồng ý |
| Giữ nhân vật nhất quán | Làm "style bible": prompt nền cố định, bảng màu, mỗi NPC một ảnh reference, luôn gen dựa trên reference đó. | Claude đề xuất |
| Animation bằng `motion` | Khách đi vào/ra, lắc khi đưa nhầm, nhảy khi mua được, tiền bay lên, chip khay nảy, màn nhập hàng trượt lên. Gắn lên khung bọc nhân vật (`Customer.tsx`), không vào trong SVG, để thay asset thật vẫn dùng được. `MotionConfig reducedMotion="user"`. | Long (chọn thư viện), Claude (chi tiết) |
| Asset AI gen đầu tiên (Gemini) | Bộ icon 9 món (phong cách đất sét, khớp UI) dùng ở kệ hàng, khay, màn nhập hàng; món hết hàng thì icon xám. Khung cảnh tiệm (render 3D, ánh sáng ban ngày) thay trời/đồi/mái hiên vẽ bằng CSS, cả ở màn mở đầu. Tủ kính làm quầy trước mặt khách. Xử lý bằng `scripts/process_generated_images.py`: tách nền trắng (flood fill từ mép), cắt bỏ watermark Gemini, tô vách sau kính thành nâu gỗ, xuất WebP (~75KB tổng). | Long (chọn dùng), Claude (xử lý) |
| Giờ trong ngày trên khung cảnh ảnh | 3 lớp màu `mix-blend-mode: multiply` (rạng sáng, chiều tà, chạng vạng) phủ lên ảnh, đậm nhạt theo giờ. Khách không bị phủ (như có đèn trong tiệm). Mất mặt trời đi vòng cung của bản CSS. | Long |
| Phong cách nhân vật khi gen | Nên theo phong cách đất sét như bộ icon (khớp UI), không theo render 3D của khung cảnh. | Claude đề xuất |
| Biểu cảm tối thiểu | Mỗi NPC 3 biểu cảm (vui / bình thường / phật ý), vì biểu cảm là kênh phản hồi chính khi kết quả bị ẩn. | Claude đề xuất |

**Công cụ gợi ý:** Leonardo AI (character sheet, có gói free), Midjourney (`--cref`), Nano Banana Pro; Photopea hoặc Krita để tách nền; Figma để mock UI; Google Fonts (nhớ chọn font có tiếng Việt).

**Ước lượng assets:** khoảng 25–30 hình: 3 background (gian tiệm, hiên tối, bản đồ làng), 6 hộ × 3 biểu cảm, 6–10 icon mặt hàng, bàn thờ bà.

**Bảng màu UI hiện tại** (`src/index.css`): giấy dó `#f6ebd3`, lá chuối `#5e9b5a` (hành động chính), ngói đỏ `#d9774a` (cảnh báo), nắng `#f2c35b` (thời gian), trời `#cfe6e4`, gỗ `#b07a4f`, mực nâu `#4a3426`. Font: Baloo 2 (tiêu đề), Be Vietnam Pro (chữ thường). Chỉ có giao diện sáng.

**Wireframe:** canvas "Tiệm Tạp Hoá Bà Ngoại – Wireframe" trên claude.ai (https://claude.ai/artifact/16gu2zQTkzdCTeXpuDhTVA). Một số màn đã cũ so với code (vd vẫn còn nút "Bán"), màn Làng và Hội thoại vẫn còn dùng làm tham khảo.

---

## 7. Kỹ thuật

| Quyết định | Lý do / trade-off | Ai chọn |
|---|---|---|
| Vite + React + TypeScript + Tailwind v4 | Next.js không cần thiết: SSR/App Router gần như vô dụng cho game chạy hoàn toàn ở client. | Long |
| Không có backend | Chưa cần. Lưu game sau này dùng localStorage/IndexedDB. | Claude đề xuất |
| Engine là hàm thuần, tách khỏi React | Test được, chỉnh cân bằng không đụng UI. `(state, action) => state`. | Claude (kiến trúc) |
| Lõi thuần, vỏ OOP (controller singleton) | `controllers/`: class kế thừa `Store`, mỗi class một instance tạo trong `controllers/index.ts`. `GameController` thay `useReducer` + `useGameLoop`: giữ state, chạy vòng lặp, method cho hành động. React đọc qua `useStore(controller, selector)` (`useSyncExternalStore`). Đã cân nhắc OOP toàn bộ (class có state sửa tại chỗ) nhưng bỏ: phải viết lại engine và test, React không tự biết khi nào render, khó tái hiện bug. | Long (chọn hướng A), Claude (chi tiết) |
| Component tự đọc state theo phần nhỏ | Mỗi component gọi `useStore(game, selector)` cho đúng phần mình cần; selector dùng chung ở `ui/selectors.ts`. Đo bằng React Profiler (dev, 5 giây có khách chờ): tổng thời gian render 203ms → 27ms, HUD 48 → 1 lần render. Chỉ `PatienceBar` render mỗi nhịp 100ms. | Claude (kỹ thuật) |
| Cài đặt người chơi (`SettingsController`) | Âm lượng nhạc, âm lượng hiệu ứng (0–1, mặc định 0,6 / 0,8), tắt tiếng (giữ mức âm lượng), giảm chuyển động (bật = luôn giảm, tắt = theo máy). Lưu localStorage key `tiem-ba-ngoai:settings:v1`, đọc phòng thủ. Nút tắt tiếng nhanh trên HUD. Chưa có âm thanh thật: chờ bước 4. | Long (chọn mục), Claude (mặc định) |
| Âm thanh (`AudioController` + Howler) | Hiệu ứng: bán được (ting), đưa nhầm, khách tới (chuông), khách bỏ về, nhập hàng, chạm kệ/khay, đóng cửa. Báo hết hàng và chọn câu trả lời: im lặng. Nhạc nền: nhạc ngày trước 17h, nhạc chiều từ 17h và màn Tổng kết, chuyển mượt 1,5 giây. Màn mở đầu im lặng; bấm "Mở cửa tiệm" mới có tiếng (mở khoá âm thanh trên điện thoại). App bị ẩn thì dừng nhạc. Tạm dừng vẫn giữ nhạc để chỉnh âm lượng nghe được. | Long (Howler), Claude (chi tiết) |
| File âm thanh placeholder | Tổng hợp bằng `scripts/gen_placeholder_audio.py` (sine + Karplus-Strong, thang ngũ cung), ~700KB. Đặt trong `src/assets/audio/` và import qua Vite để `build:single` nhúng luôn. Nhạc có `.opus` (lặp liền mạch) + `.mp3` dự phòng cho Safari (có khoảng lặng nhỏ ở chỗ lặp). | Claude (mặc định), chờ thay bằng file thật |
| Singleton bằng instance cấp module | `export const game = new GameController(content)`, không dùng `static getInstance()`: ES module vốn chỉ chạy một lần; export class riêng để test tạo instance sạch. | Claude (kỹ thuật) |
| Tạm dừng là state game | `GameState.paused` + `setPaused()` thuần, `tick` đứng yên khi đang dừng (trước đây là state UI trong `App`). | Claude (kỹ thuật) |
| Mọi thay đổi tiền/kho đi qua `Outcome` | Màn Tổng kết chỉ đọc `todayLog`. Thêm Gắn bó chỉ cần điền `bondDeltas`. | Claude (kiến trúc) |
| Content viết bằng JSON | Thêm ngày mới = thêm file `day-XX.json`, không sửa code. | Claude đề xuất, Long đồng ý |
| Mọi con số cân bằng nằm trong `config.ts` | Chỉnh một chỗ khi tự chơi thử. | Claude (kiến trúc) |
| Test bằng Vitest | 66 test (engine, GameController với scheduler giả, SettingsController với storage giả, AudioController với sound factory giả). | Claude (kỹ thuật) |
| Build single-file | `npm run build:single` gộp thành 1 file HTML để mở thử trên điện thoại. | Claude (kỹ thuật) |
| Thư viện `motion` cho animation | Exit animation (`AnimatePresence`) và spring dễ hơn CSS thuần. Đánh đổi: thêm dependency. Lưu ý: đừng đặt `motion.*` lên chung element với `.btn-3d`, vì motion ghi `transform` inline đè hiệu ứng lún khi bấm; bọc `motion.div` bên ngoài. | Long |
| Chưa dùng Ink | Từng gợi ý Ink cho story phân nhánh. Hiện story chỉ 1 tầng (3 lựa chọn → 1 câu đáp) nên JSON là đủ. Cân nhắc lại khi có hội thoại nhiều tầng. | Claude đề xuất |

---

## 8. Lịch sử phiên bản

| Bản | Thay đổi |
|---|---|
| v0.1 | Vòng lặp 1 ngày: khách tới từng người, kiên nhẫn, nút "Bán", nhập hàng, tổng kết. 3 ngày kịch bản. |
| v0.2 | Bỏ nút "Bán": tự chọn món trên kệ, khay, đưa hàng. Đọc yêu cầu qua câu thoại. Đưa nhầm bị phạt kiên nhẫn. |
| v0.3 | Bán thành công thì khách kể chuyện, 3 câu trả lời. 12 câu chuyện. Mục "Chuyện hôm nay". |
| v0.4 (đang làm) | Đồng hồ 6h–20h, trời đổi màu theo giờ. Khách tới liên tục (khách vô danh tự sinh), khách có chuyện rải đều trước 17h, ẩn số khách. Animation bằng `motion`. Chuyển sang kiến trúc controller, tách ShopScreen để render theo từng phần (bước 2/4, render nhanh hơn khoảng 7 lần). Màn mở đầu, màn tạm dừng, SettingsController (bước 3/4). Âm thanh placeholder bằng Howler (bước 4/4). Asset AI gen đầu tiên: icon món hàng, khung cảnh tiệm, tủ kính. |

---

## 9. Bước tiếp theo (gợi ý, chưa chốt thứ tự)

1. **Chơi thử và chỉnh số liệu:** 5 phút/ngày, kiên nhẫn, phạt đưa nhầm có quá gắt không.
2. **Hệ thống Gắn bó:** model `Household`, gắn điểm vào lựa chọn câu chuyện, giảm dần mỗi ngày, màn Làng.
3. **Win/fail:** chốt ngưỡng thắng, số hộ, có tính phá sản không.
4. **Lưu game** (localStorage), để chơi nhiều phiên.
5. **Viết thêm kịch bản** ngày 4 trở đi.
6. **Gen asset thật** khi gameplay đã ổn định.
