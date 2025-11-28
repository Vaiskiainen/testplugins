import { instead } from "@vendetta/patcher";
import { findByProps, findByStoreName } from "@vendetta/metro";

let patches = [];

export default {
  onLoad() {
    const GuildStore = findByProps("getGuild", "getGuilds");
    const GuildCacheStore = findByStoreName("GuildCacheStore"); // uusi 2025
    const fluxPatcher = findByProps("dispatch", "subscribe");


    if (GuildStore) {
      patches.push(
        instead("getGuild", GuildStore, (args, original) => {
          const guild = original.apply(this, args);
          if (guild) {
            guild.banner = null;
            guild.bannerId = null;
            guild.splash = null; 
          }
          return guild;
        })
      );
    }

    if (GuildCacheStore?.getGuild) {
      patches.push(
        instead("getGuild", GuildCacheStore, (args, original) => {
          const guild = original.apply(this, args);
          if (guild) {
            guild.banner = null;
            guild.bannerId = null;
          }
          return guild;
        })
      );
    }

    patches.push(
      instead("getGuildBannerURL", findByProps("getGuildBannerURL"), () => null),
      instead("getGuildSplashURL", findByProps("getGuildSplashURL"), () => null)
    );

    console.log("[RemoveBanner] Fully loaded – no more banners anywhere!");
  },

  onUnload() {
    patches.forEach(p => p());
    patches = [];
  },

  settings: null
};