import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";
import Settings from "./Settings";

storage.christmasDay ??= 24;
storage.lastShown ??= null;

const getDaysToChristmas = (): number => {
  const now = new Date();
  const targetDay = storage.christmasDay;

  const christmas = new Date(now.getFullYear(), 11, targetDay);

  if (now > christmas) christmas.setFullYear(now.getFullYear() + 1);

  const difference = christmas.getTime() - now.getTime();
  return Math.floor(difference / (1000 * 60 * 60 * 24));
};

export default {
  onLoad() {
    setTimeout(() => {
      const now = new Date();
      const currentDate = now.toISOString().slice(0, 10);

      if (storage.lastShown !== currentDate) {
        const days = getDaysToChristmas();
        showToast(
          `Only ${days} days until Christmas (counting to Dec ${storage.christmasDay})! 🎁`
        );
        storage.lastShown = currentDate;
      }
    }, 1000);
  },

  settings: Settings,
};