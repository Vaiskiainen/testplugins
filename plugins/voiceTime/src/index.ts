import { React, ReactNative } from "@vendetta/metro/common";
import { findByProps, findByName, findByDisplayName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { showToast } from "@vendetta/ui/toasts";

const { Text, View } = ReactNative;

let unpatch;

const VoiceTimer = () => {
  const VoiceStateStore = findByProps("getVoiceStates", "getVoiceState");
  const UserStore = findByProps("getCurrentUser");

  const [joinTime, setJoinTime] = React.useState(null);
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    if (!VoiceStateStore || !UserStore) return;

    const listener = () => {
      const user = UserStore.getCurrentUser();
      if (!user) return;

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

  if (!joinTime) return null;

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
      showToast("VoiceTime: Plugin loading...");
      console.log("VoiceTime: Plugin loading...");

      const ChannelHeaderModule = findByName("ChannelHeader", false);
      const ChannelHeaderProps = findByProps("ChannelHeader");
      const ChannelHeaderDisplayName = findByDisplayName("ChannelHeader", false);

      const patchCallback = (args, res) => {
        if (!res?.props?.children) return res;

        const children = Array.isArray(res.props.children)
          ? [...res.props.children]
          : [res.props.children];

        children.push(
          React.createElement(View, { style: { flexDirection: "row", alignItems: "center" } },
            React.createElement(VoiceTimer)
          )
        );

        res.props.children = children;
        return res;
      };

      if (ChannelHeaderModule?.default) {
        unpatch = after("default", ChannelHeaderModule, patchCallback);
        showToast("VoiceTime: Patched ChannelHeader (default)");
      } else if (ChannelHeaderProps?.ChannelHeader) {
        unpatch = after("ChannelHeader", ChannelHeaderProps, patchCallback);
        showToast("VoiceTime: Patched ChannelHeader (named)");
      } else if (ChannelHeaderDisplayName) {
        unpatch = after("default", ChannelHeaderDisplayName, patchCallback);
        showToast("VoiceTime: Patched ChannelHeader (display name)");
      } else {
        console.log("[voiceTime] Could not find ChannelHeader");
        showToast("VoiceTime: Could not find ChannelHeader");
      }
    } catch (e) {
      console.error("VoiceTime Error:", e);
      showToast(`VoiceTime Error: ${e.message}`);
    }
  },

  onUnload() {
    if (unpatch) unpatch();
  },
};
