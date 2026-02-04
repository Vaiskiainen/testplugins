import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";
import Settings from "./Settings";  // adjust path if needed, assuming same folder

export const getDaysToChristmas = (targetDay = 24) => {
  const now = new Date();
  let christmas = new Date(now.getFullYear(), 11, targetDay);
  if (now > christmas) {
    christmas.setFullYear(now.getFullYear() + 1);
  }
  const difference = christmas.getTime() - now.getTime();
  return Math.floor(difference / (1000 * 60 * 60 * 24));
};

export default {
  onLoad() {
    const now = new Date();
    const currentDate = now.toISOString().slice(0, 10);  // YYYY-MM-DD

    // storage is a persistent proxy object; it auto-saves changes
    if (storage.lastShown !== currentDate) {
      const targetDay = storage.countOn25th ? 25 : 24;
      const days = getDaysToChristmas(targetDay);
      const targetLabel = storage.countOn25th ? "Christmas Day" : "Christmas Eve";
      showToast(`Only ${days} days until ${targetLabel}! 🎁`);
      storage.lastShown = currentDate;  // this persists across reloads/enables
    }
  },

  settings: Settings,  // lowercase "settings" key, points to the component
};
