import { after } from "@vendetta/patcher";
import { findByProps, findByStoreName, findByDisplayName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import SettingsPanel from "./Settings";

storage.removeBanner ??= true;
storage.removeSplash ??= false;
storage.aggressiveMode ??= true;
storage.whitelist ??= [];

let patches = [];

export default {
  onLoad() {
    const unload = () => patches.forEach(p => p?.());
    const load = () => {
      unload();
      patches = [];
      [findByProps("getGuild"), findByStoreName("GuildCacheStore"), findByStoreName("GuildStore")]
        .filter(Boolean)
        .forEach(store => {
          if (!store.getGuild) return;

          patches.push(after("getGuild", store, (args, res) => {
            if (!res) return res;

            const id = res.id;

            if (storage.removeBanner && !storage.whitelist.includes(id)) {
              res.banner = null;
              res.bannerId = null;
            }

            if (storage.removeSplash && !storage.whitelist.includes(id)) {
              res.splash = null;
            }

            return res;
          }));
        });

      [findByProps("getGuildBannerURL"), findByProps("getGuildSplashURL")]
        .filter(Boolean)
        .forEach(mod => {
          if (mod.getGuildBannerURL) {
            patches.push(after("getGuildBannerURL", mod, (args, url) => {
              const guild = args[0];
              if (!storage.removeBanner) return url;
              if (guild && storage.whitelist.includes(guild.id)) return url;
              return null;
            }));
          }

          if (mod.getGuildSplashURL) {
            patches.push(after("getGuildSplashURL", mod, (args, url) => {
              const guild = args[0];
              if (!storage.removeSplash) return url;
              if (guild && storage.whitelist.includes(guild.id)) return url;
              return null;
            }));
          }
        });


      if (storage.aggressiveMode) {
        const Header =
          findByProps("GuildHeader")?.GuildHeader ||
          findByDisplayName("GuildHeader", false);

        if (Header?.prototype?.render) {
          patches.push(after("render", Header.prototype, (args, res) => {
            const guild = res?.props?.guild;
            if (!guild || storage.whitelist.includes(guild.id)) return res;

            res.props.banner = null;
            res.props.bannerSource = null;
            guild.banner = null;

            return res;
          }));
        }
      }
    };

    load();
  },

  onUnload() {
    patches.forEach(p => p?.());
  },

  settings: SettingsPanel,
};