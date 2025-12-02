import { React, ReactNative } from "@vendetta/metro/common";
import { findByProps, findByName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";

const { Text, View } = ReactNative;

let unpatch;

const VoiceTimer = () => {
  const VoiceStateStore = findByProps("getVoiceStates", "getVoiceState");
  const UserStore = findByProps("getCurrentUser");

  const [joinTime, setJoinTime] = React.useState(null);
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
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
      }
    }, `${m}:${s < 10 ? "0" : ""}${s}`)
  );
};

export default {
  onLoad() {
    const ChannelHeader = findByName("ChannelHeader", false);

    if (!ChannelHeader) {
      console.log("[voiceTime] Could not find ChannelHeader");
      return;
    }

    unpatch = after("default", ChannelHeader, (args, res) => {
      if (!res?.props?.children) return res;

      const children = Array.isArray(res.props.children)
        ? [...res.props.children]
        : [res.props.children];

      // Lisätään Timer ChannelHeaderin loppuun
      children.push(
        React.createElement(View, { style: { flexDirection: "row" } }, 
          React.createElement(VoiceTimer)
        )
      );

      res.props.children = children;
      return res;
    });
  },

  onUnload() {
    if (unpatch) unpatch();
  },
};
