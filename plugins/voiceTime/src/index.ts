import { React, ReactNative } from "@vendetta/metro/common";
import { findByProps, findByName, findByDisplayName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { showToast } from "@vendetta/ui/toasts";

const { Text, View } = ReactNative;

let unpatches = [];

const VoiceTimer = () => {
  const VoiceStateStore = findByProps("getVoiceStates", "getVoiceState");
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

      const vs = VoiceStateStore.getVoiceState(user.id);

      if (vs?.channelId && !joinTime) setJoinTime(Date.now());
      if (!vs?.channelId && joinTime) setJoinTime(null);
    };

    VoiceStateStore.addChangeListener(listener);
    listener();

    return () => VoiceStateStore.removeChangeListener(listener);
  }, [joinTime]);

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
      showToast("VoiceTime: Plugin loading v4...");
      unpatches = [];

      const patchCallback = (name) => (args, res) => {

        if (!res) {
          console.log(`VoiceTime: ${name} res is null`);
          return res;
        }

        if (!res.props) res.props = {};

        const children = Array.isArray(res.props.children)
          ? [...res.props.children]
          : (res.props.children ? [res.props.children] : []);

        children.push(
          React.createElement(View, { style: { flexDirection: "row", alignItems: "center", zIndex: 999, backgroundColor: 'blue', padding: 5 } },
            React.createElement(Text, { style: { color: 'white' } }, `[${name}]`),
            React.createElement(VoiceTimer)
          )
        );

        res.props.children = children;
        return res;
      };


      const ChannelHeaderModule = findByName("ChannelHeader", false);
      const ChannelHeaderProps = findByProps("ChannelHeader");
      const ChannelHeaderDisplayName = findByDisplayName("ChannelHeader", false);

      if (ChannelHeaderModule?.default) {
        unpatches.push(after("default", ChannelHeaderModule, patchCallback("ChannelHeader(default)")));
        showToast("Patched ChannelHeader(default)");
      } else if (ChannelHeaderProps?.ChannelHeader) {
        unpatches.push(after("ChannelHeader", ChannelHeaderProps, patchCallback("ChannelHeader(named)")));
        showToast("Patched ChannelHeader(named)");
      } else if (ChannelHeaderDisplayName) {
        unpatches.push(after("default", ChannelHeaderDisplayName, patchCallback("ChannelHeader(display)")));
        showToast("Patched ChannelHeader(display)");
      }


      const Topic = findByName("Topic", false);
      if (Topic?.default) {
        unpatches.push(after("default", Topic, patchCallback("Topic")));
        showToast("Patched Topic");
      }


      const Header = findByName("Header", false);
      if (Header?.default) {
        unpatches.push(after("default", Header, patchCallback("Header")));
        showToast("Patched Header");
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
