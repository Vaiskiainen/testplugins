import { after } from "@vendetta/patcher";
import { findByProps, findByStoreName, findByDisplayName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import SettingsPanel from "./Settings";

storage.removeBanner ??= true;
storage.removeSplash ??= false;
storage.aggressiveMode ??= true;
storage.whitelist ??= [];

let patches = [];

const shallowClonePreserveProto = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  const clone = Object.create(Object.getPrototypeOf(obj));
  Object.assign(clone, obj);
  return clone;
};

const refreshGuilds = () => {
  try {
    const GuildActions = findByProps("fetchGuild", "fetchGuilds", "fetchGuildPreview");
    const GuildStore = findByStoreName("GuildStore") || findByStoreName("GuildCacheStore");
    const guilds = (GuildStore && (GuildStore.getGuilds ? GuildStore.getGuilds() : (GuildStore.guilds || {}))) || {};
    const ids = Object.keys(guilds);
    if (!ids.length) return;

    ids.forEach(id => {
      try {
        if (GuildActions?.fetchGuild) GuildActions.fetchGuild(id);
        else if (GuildActions?.fetchGuilds) GuildActions.fetchGuilds([id]);
        else if (GuildActions?.fetchGuildPreview) GuildActions.fetchGuildPreview(id);
      } catch {}
    });

  } catch {}
};

export default {
  onLoad() {
    const unloadPatches = () => patches.forEach(p => p?.());
    const load = () => {
      unloadPatches();
      patches = [];

      [findByProps("getGuild"), findByStoreName("GuildCacheStore"), findByStoreName("GuildStore")]
        .filter(Boolean)
        .forEach(store => {
          if (!store.getGuild) return;

          patches.push(after("getGuild", store, (args, res) => {
            if (!res) return res;
            const id = res.id;

            const shouldRemoveBanner = storage.removeBanner && !storage.whitelist.includes(id);
            const shouldRemoveSplash = storage.removeSplash && !storage.whitelist.includes(id);

            if (!shouldRemoveBanner && !shouldRemoveSplash) return res;

            const out = shallowClonePreserveProto(res);
            if (shouldRemoveBanner) {
              out.banner = null;
              out.bannerId = null;
            }
            if (shouldRemoveSplash) {
              out.splash = null;
            }

            return out;
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

            const newRes = { ...res };
            newRes.props = { ...res.props };
            newRes.props.guild = shallowClonePreserveProto(res.props.guild);

            newRes.props.banner = null;
            newRes.props.bannerSource = null;
            newRes.props.guild.banner = null;

            return newRes;
          }));
        }
      }
    };

    load();
    try { refreshGuilds(); } catch {}
  },

  onUnload() {
    patches.forEach(p => p?.());
    try { refreshGuilds(); } catch {}
  },

  settings: SettingsPanel,
};