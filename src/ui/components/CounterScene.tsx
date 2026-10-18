import { AnimatePresence, motion } from "motion/react";
import { game } from "../../controllers";
import { useStore } from "../../hooks/useStore";
import { money } from "../format";
import {
  selectClockMinutes,
  selectMood,
  selectNearClosing,
  selectSold,
  selectVisitKey,
  selectWrongCount,
} from "../selectors";
import { Customer } from "./Customer";
import { ShopBackdrop } from "./ShopBackdrop";

/** Cảnh tiệm có khách đứng ở quầy và tiền bay lên lúc bán được. */
export function CounterScene() {
  const minutes = useStore(game, selectClockMinutes);
  const visitKey = useStore(game, selectVisitKey);
  const customer = useStore(game, (s) => s.current?.visit.customer);
  const mood = useStore(game, selectMood);
  const wrongCount = useStore(game, selectWrongCount);
  const sold = useStore(game, selectSold);
  const nearClosing = useStore(game, selectNearClosing);

  return (
    <ShopBackdrop minutes={minutes}>
      {/* Khách đứng sau tủ kính (tủ cao ~47px, che phần dưới), đầu nằm dưới mái hiên trong ảnh */}
      <div className="absolute inset-x-0 bottom-4 flex h-26 justify-center">
        {/* mode="wait": khách cũ đi khuất hẳn rồi mới hiện khách mới / dòng "sắp đóng cửa".
            Quầy trống giữa 2 khách thì để cảnh trống, không hiện chữ (gap chỉ 2–5s, chữ sẽ nháy liên tục).
            Customer nhận props từ đây (không tự đọc store) để lúc đang đi ra vẫn giữ nguyên biểu cảm cuối,
            vì lúc đó engine đã xoá khách khỏi state. */}
        <AnimatePresence mode="wait">
          {visitKey && customer ? (
            <Customer
              key={visitKey}
              name={customer}
              mood={mood}
              wrongCount={wrongCount}
            />
          ) : nearClosing ? (
            <motion.p
              key="closing"
              className="self-center rounded-full bg-card/80 px-4 py-2 text-[14px] text-ink-soft"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Sắp đóng cửa rồi
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Tiền bay lên từ quầy lúc bán được */}
      <AnimatePresence>
        {sold && (
          <motion.span
            key={visitKey}
            className="pointer-events-none absolute right-[18%] bottom-13 font-display text-[20px] font-extrabold text-leaf-deep tabular-nums [text-shadow:0_2px_0_var(--color-card)]"
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 1, 0], y: -56 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            aria-hidden="true"
          >
            +{money(sold.moneyDelta)}
          </motion.span>
        )}
      </AnimatePresence>
    </ShopBackdrop>
  );
}
