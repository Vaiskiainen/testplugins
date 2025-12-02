import { React, ReactNative } from "@vendetta/metro/common";
import { findByProps, findByName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";

const { Text } = ReactNative;

let unpatch: (() => void) | undefined;


const VoiceTimer = () => {
  const VoiceStateStore = findByProps("getVoiceStates", "getVoiceState");
  const UserStore = findByProps("getCurrentUser");

  const [joinTime, setJoinTime] = React.useState<number | null>(null);
  const [currentTime, setCurrentTime] = React.useState(Date.now());

  React.useEffect(() => {
    const listener = () => {
      const user = UserStore.getCurrentUser();
      if (!user) return; 

      const state = VoiceStateStore.getVoiceState(user.id);

      if (state?.channelId && !joinTime) {
        setJoinTime(Date.now());
      } 

      else if (!state?.channelId && joinTime) {
        setJoinTime(null);
      }
    };

    VoiceStateStore.addChangeListener(listener);
    

    listener();


    return () => VoiceStateStore.removeChangeListener(listener);
  }, [joinTime]); 


  React.useEffect(() => {

    if (!joinTime) return;


    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [joinTime]); 

  if (!joinTime) {
    return null;
  }

  const seconds = Math.floor((currentTime - joinTime) / 1000);
  const mins = Math.floor(seconds / 60);
  

  const secs = seconds % 60; 
  
  const formattedTime = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

  return React.createElement(Text, {
    style: {
      color: "#FFFFFF",
      fontSize: 14,
      marginLeft: 10,
    },
  }, formattedTime);
};


export default {
  onLoad() {

    const VoiceStateStore = findByProps("getVoiceStates", "getVoiceState");
    const UserStore = findByProps("getCurrentUser");
    const VoiceControls =
      findByName("VoiceActivitySection") ??
      findByProps("renderUserVolume") ??
      findByProps("renderNoiseCancellationSection");

    if (!VoiceStateStore || !VoiceControls || !UserStore) {
      console.log("[voiceTime] Failed to find required modules");
      return;
    }


    unpatch = after("default", VoiceControls, (args, res) => {
      if (!res || !res.props) return res;

      const children = Array.isArray(res.props.children)
        ? res.props.children
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