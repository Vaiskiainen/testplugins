import { findByProps, findByDisplayName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { instead } from "@vendetta/patcher"; 

let patches: Function[] = [];

export default {
  onLoad() {

    const Header = findByDisplayName("GuildHeader", false) || 
                  findByProps("GuildHeader")?.GuildHeader;

    if (!Header) {
      console.warn("[RemoveBanner] GuildHeader not found");
      return;
    }


    patches.push(
      after("render", Header.prototype, (_, ret) => {
        if (ret?.props?.header) {

          if (ret.props.header.props?.bannerSource) {
            ret.props.header.props.bannerSource = null;
          }
          if (ret.props.header.props?.banner) {
            ret.props.header.props.banner = null;
          }
        }


        if (ret?.props?.banner) ret.props.banner = null;
        if (ret?.props?.bannerSource) ret.props.bannerSource = null;
        if (ret?.props?.guild?.banner) ret.props.guild.banner = null;

        return ret;
      })
    );


    const GuildStore = findByProps("getGuild");
    if (GuildStore) {
      patches.push(
        instead("getGuild", GuildStore, (args, orig) => {
          const guild = orig(...args);
          if (guild) guild.banner = null;
          return guild;
        })
      );
    }

    console.log("[RemoveBanner] Loaded successfully – banners hidden!");
  },

  onUnload() {
    patches.forEach(p => p());
    patches = [];
  },

  settings: null
};