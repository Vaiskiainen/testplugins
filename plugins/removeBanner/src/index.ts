import { instead } from "@vendetta/patcher";
import { findByProps, findByStoreName, findByDisplayName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";

import Settings from "./settings.tsx";

let patches: Function[] = [];

const defaults = {
  removeBanner: true,
  removeSplash: false,
  aggressiveMode: true,
};

storage.removeBanner ??= defaults.removeBanner;
storage.removeSplash ??= defaults.removeSplash;
storage.aggressiveMode ??= defaults.aggressiveMode;

export default {
  onLoad() {
    useProxy(storage);

    const unloadAll = () => {
      patches.forEach(p => p());
      patches = [];
    };

    const applyPatches = () => {
      unloadAll();


      [findByProps("getGuild", "getGuilds"), findByStoreName("GuildCacheStore"), findByStoreName("GuildStore")]
        .filter(Boolean)
        .forEach(store => {
          if (store?.getGuild) {
            patches.push(
              instead("getGuild", store, (args, orig) => {
                const guild = orig(...args);
                if (!guild) return guild;
                if (storage.removeBanner) {
                  guild.banner = null;
                  guild.bannerId = null;
                }
                if (storage.removeSplash) guild.splash = null;
                return guild;
              })
            );
          }
        });


      const urlModules = [
        findByProps("getGuildBannerURL"),
        findByProps("getGuildSplashURL"),
        findByProps("getGuildBannerURL", "getGuildSplashURL")
      ].filter(Boolean);

      urlModules.forEach(mod => {
        if (storage.removeBanner && mod.getGuildBannerURL)
          patches.push(instead("getGuildBannerURL", mod, () => null));
        if (storage.removeSplash && mod.getGuildSplashURL)
          patches.push(instead("getGuildSplashURL", mod, () => null));
      });


      if (storage.aggressiveMode) {
        const Header =
          findByProps("GuildHeader")?.GuildHeader ||
          findByProps("Header")?.Header ||
          findByDisplayName("GuildHeader", false);

        if (Header?.prototype?.render) {
          patches.push(
            instead("render", Header.prototype, function (args, orig) {
              const res = orig.apply(this, args);
              if (res?.props) {
                res.props.bannerSource = null;
                res.props.banner = null;
                if (res.props.guild) res.props.guild.banner = null;
              }
              return res;
            })
          );
        }
      }
    };

    applyPatches();

    storage.__reloadPatches = applyPatches;
  },

  onUnload() {
    patches.forEach(p => p());
    patches = [];
  },

  settings: Settings
};