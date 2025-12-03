import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";

const getDaysToChristmas = () => {
  const now = new Date();
  let christmas = new Date(now.getFullYear(), 11, 25);
  if (now > christmas) {
    christmas.setFullYear(now.getFullYear() + 1);
  }

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
        showToast(`Only ${days} days until Christmas! 🎁`);
        storage.lastShown = currentDate;
      }
    }, 1200); // 1.2 seconds ensures UI is ready
  },
};