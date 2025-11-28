import { metro } from "bunny";
import { plugin } from "vendetta";

let unpatch: () => void = () => {};

const ServerHeader = metro.findByTypeDisplayNameLazy("GuildHeader");

export default {
  onLoad(api: any) {
    if (!ServerHeader?.type) return;

    unpatch = api.patcher.before("render", ServerHeader.type, ([props]: any) => {
      props.banner = null;
      props.bannerImage = null;
      props.bannerSource = null;
    });
  },

  onUnload() {
    unpatch();
  },

  settings: null
};
