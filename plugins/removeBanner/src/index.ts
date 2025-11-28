import { instead } from "@vendetta/patcher";
import { findByProps, findByStoreName, findByDisplayName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import SettingsPanel from "./Settings";

storage.removeBanner ??= true;
storage.removeSplash ??= false;
storage.aggressiveMode ??= true;
storage.whitelist ??= []; 

let patches: Function[] = [];

export default {
  onLoad() {
    const unload = () => patches.forEach(p => p && p());
    const load = () => {
      unload();
      patches = [];
      [findByProps("getGuild"), findByStoreName("GuildCacheStore"), findByStoreName("GuildStore")]
        .filter(Boolean)
        .forEach(store => {
          store.getGuild && patches.push(
            instead("getGuild", store, (args, orig) => {
              const g = orig(...args);
              if (g && storage.removeBanner && !storage.whitelist.includes(g.id)) {
                g.banner = g.bannerId = null;
              }
              if (g && storage.removeSplash && !storage.whitelist.includes(g.id)) {
                g.splash = null;
              }
              return g;
            })
          );
        });
      [findByProps("getGuildBannerURL"), findByProps("getGuildSplashURL")]
        .filter(Boolean)
        .forEach(mod => {
          if (storage.removeBanner && mod.getGuildBannerURL) {
            patches.push(instead("getGuildBannerURL", mod, (args, orig) => {
              const guild = args[0];
              if (guild && storage.whitelist.includes(guild.id)) return orig(...args);
              return null;
            }));
          }
          if (storage.removeSplash && mod.getGuildSplashURL) {
            patches.push(instead("getGuildSplashURL", mod, (args, orig) => {
              const guild = args[0];
              if (guild && storage.whitelist.includes(guild.id)) return orig(...args);
              return null;
            }));
          }
        });
      if (storage.aggressiveMode) {
        const Header = findByProps("GuildHeader")?.GuildHeader ||
          findByDisplayName("GuildHeader", false);
        Header?.prototype?.render && patches.push(
          instead("render", Header.prototype, (args, orig) => {
            const res = orig(...args);
            if (res?.props && res.props.guild && !storage.whitelist.includes(res.props.guild.id)) {
              res.props.banner = res.props.bannerSource = null;
              res.props.guild.banner = null;
            }
            return res;
          })
        );
      }
    };
    load();
  },
  onUnload() {
    patches.forEach(p => p && p());
  },
  settings: SettingsPanel
};