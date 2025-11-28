import { metro } from "@vendetta/metro";
import { patcher } from "@vendetta/patcher";

let unpatch: () => void = () => {};


const GuildHeaderModule = metro.find(m => m.default?.displayName === "GuildHeader");

export default {
  onLoad() {

    if (!GuildHeaderModule) {
      console.error("[RemoveBanner] Didn't find GuildHeaderModel!");
      return; 
    }

    unpatch = patcher.before("default", GuildHeaderModule, (args) => {
      const [props] = args;
      
      if (props) {
        props.banner = null;
        props.bannerImage = null;
        props.bannerSource = null;
      }
    });
  },

  onUnload() {
    unpatch();
  },

  settings: null
};