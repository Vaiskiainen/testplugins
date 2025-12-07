// src/index.ts
import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";
import Settings from "./Settings";

storage.christmasDay ??= 24;
storage.lastShown ??= null;

const getDaysToChristmas = (): number => {
  const now = new Date();
  const targetDay = storage.christmasDay ?? 24;

  let christmas = new Date(now.getFullYear(), 11, targetDay);
  if (now > christmas) christmas.setFullYear(now.getFullYear() + 1);

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((christmas.getTime() - now.getTime()) / msPerDay);
};

const plugin = {
  onLoad: () => {

    setTimeout(() => {
      try {
        const today = new Date().toISOString().slice(0, 10);

        if (storage.lastShown !== today) {
          const days = getDaysToChristmas();
          showToast(
            `${days === 0 ? "IT'S CHRISTMAS!" : `Only ${days} day${days === 1 ? "" : "s"} until Christmas`} (Dec ${storage.christmasDay})`
          );
          storage.lastShown = today;
        }
      } catch (e) {
        console.error("[Christmas Counter] Toast failed:", e);
      }
    }, 1500);
  },

  onUnload: () => {
    
  },

  settings: Settings,
};


export default plugin;