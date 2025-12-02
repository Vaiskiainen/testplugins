import { React, ReactNative } from "@vendetta/metro/common";
import { findByProps, findByName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";

const { Text } = ReactNative;

let unpatch;

const VoiceTimer = () => {
  const VoiceStateStore = findByProps("getVoiceStates", "getVoiceState");
  const UserStore = findByProps("getCurrentUser");

  const [joinTime, setJoinTime] = React.useState(null);
  const [currentTime, setCurrentTime] = React.useState(Date.now());

  React.useEffect(() => {
    const listener = () => {
      const user = UserStore.getCurrentUser();
      if (!user) return;

      const state = VoiceStateStore.getVoiceState(user.id);

      if (state?.channelId && !joinTime) setJoinTime(Date.now());
      else if (!state?.channelId && joinTime) setJoinTime(null);
    };

    VoiceStateStore.addChangeListener(listener);
    listener();

    return () => VoiceStateStore.removeChangeListener(listener);
  }, [joinTime]);

  React.useEffect(() => {
    if (!joinTime) return;
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [joinTime]);

  if (!joinTime) return null;

  const diff = Math.floor((currentTime - joinTime) / 1000);
  const mins = Math.floor(diff / 60);
  const secs = diff % 60;

  return React.createElement(Text, {
    style: {
      color: "#fff",
      fontSize: 14,
      marginTop: 4,
    }
  }, `${mins}:${secs < 10 ? "0" : ""}${secs}`);
};

export default {
  onLoad() {
    const VoiceUserSummary = findByName("VoiceUserSummary");

    if (!VoiceUserSummary) {
      console.log("[voiceTime] Unable to find VoiceUserSummary");
      return;
    }

    unpatch = after("default", VoiceUserSummary, (args, res) => {
      if (!res?.props) return res;

      const children = Array.isArray(res.props.children)
        ? [...res.props.children]
        : [res.props.children];

      children.push(React.createElement(VoiceTimer));

      res.props.children = children;
      return res;
    });
  },

  onUnload() {
    if (unpatch) unpatch();
  },
};
