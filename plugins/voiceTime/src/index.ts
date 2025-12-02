import { React, ReactNative } from "@vendetta/metro/common";
import { findByProps, findByName, findByDisplayName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { showToast } from "@vendetta/ui/toasts";
const { Text, View } = ReactNative;
let unpatches = [];
const VoiceTimer = () => {
  const VoiceStateStore = findByProps("getVoiceStates", "getVoiceStateForUser");
  const UserStore = findByProps("getCurrentUser");
  const [joinTime, setJoinTime] = React.useState(null);
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    showToast("VoiceTimer: Component Mounted!");
    if (!VoiceStateStore || !UserStore) {
      showToast("VoiceTime: Stores not found");
      return;
    }
    const listener = () => {
      const user = UserStore.getCurrentUser();
      if (!user) {
        return;
      }
      const vs = VoiceStateStore.getVoiceStateForUser(user.id);
      if (vs?.channelId && !joinTime) setJoinTime(Date.now());
      if (!vs?.channelId && joinTime) setJoinTime(null);
    };
    VoiceStateStore.addChangeListener(listener);
    listener();
    return () => VoiceStateStore.removeChangeListener(listener);
  }, []);
  React.useEffect(() => {
    if (!joinTime) return;
    const int = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(int);
  }, [joinTime]);
  if (!joinTime) {
    return React.createElement(Text, { style: { color: "red", backgroundColor: "yellow" } }, " VT: Idle ");
  }
  const diff = Math.floor((now - joinTime) / 1000);
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return (
    React.createElement(Text, {
      style: {
        color: "#fff",
        fontSize: 14,
        marginLeft: 8,
        opacity: 0.9,
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: "hidden",
      }
    }, `${m}:${s < 10 ? "0" : ""}${s}`)
  );
};
export default {
  onLoad() {
    try {
      showToast("VoiceTime: Plugin loading v5...");
      unpatches = [];
      const patchCallback = (name) => (args, res) => {
        if (!res) return res;
        if (!res.props) res.props = {};
        const children = Array.isArray(res.props.children)
          ? [...res.props.children]
          : (res.props.children ? [res.props.children] : []);
        children.push(
          React.createElement(View, { style: { flexDirection: "row", alignItems: "center" } },
            React.createElement(Text, { style: { color: 'lime', fontSize: 10, marginRight: 4 } }, `[${name}]`),
            React.createElement(VoiceTimer)
          )
        );
        res.props.children = children;
        return res;
      };
      const tryPatch = (module, name, propName = "default") => {
        if (!module) return false;
        const Component = propName === "default" ? module.default : module[propName];
        if (Component?.prototype?.render) {
          unpatches.push(after("render", Component.prototype, patchCallback(`${name}.proto`)));
          showToast(`Patched ${name} (prototype)`);
          return true;
        }
        if (typeof Component === "function") {
          unpatches.push(after(propName, module, patchCallback(name)));
          showToast(`Patched ${name} (functional)`);
          return true;
        }
        return false;
      };
      const ChannelHeader = findByName("ChannelHeader", false);
      const ChannelHeaderProps = findByProps("ChannelHeader");
      const MobileChannelHeader = findByName("MobileChannelHeader", false);
      const Header = findByName("Header", false);
      let patched = false;
      if (tryPatch(ChannelHeader, "ChannelHeader")) patched = true;
      if (tryPatch(ChannelHeaderProps, "ChannelHeaderProps", "ChannelHeader")) patched = true;
      if (tryPatch(MobileChannelHeader, "MobileChannelHeader")) patched = true;
      if (!patched) {
        tryPatch(Header, "Header");
      }
    } catch (e) {
      console.error("VoiceTime Error:", e);
      showToast(`VoiceTime Error: ${e.message}`);
    }
  },
  onUnload() {
    unpatches.forEach(u => u());
  },
};