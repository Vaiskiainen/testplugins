const { metro } = bunny;
const { findByTypeDisplayNameLazy } = metro;
const { plugin } = vendetta;

let unpatch = () => {};


const ServerHeader = findByTypeDisplayNameLazy("GuildHeader");

export default {
  onLoad(api) {
    if (!ServerHeader?.type) return;

    unpatch = api.patcher.before("render", ServerHeader.type, ([props]) => {
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
