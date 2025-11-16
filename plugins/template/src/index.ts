import { findByName, findByProps } from "@vendetta/metro";
import { FluxDispatcher, ReactNative } from "@vendetta/metro/common";
import { after, before } from "@vendetta/patcher";
import React from "react";

const patches = [];

const ChannelMessages = findByProps("getChannelMessages", "getMessage");
const RowManager = findByName("RowManager");
const MessageContentMod = findByName("MessageContent");

patches.push(
  before("dispatch", FluxDispatcher, (args) => {
    const event = args && args[0];
    if (!event || typeof event.type !== "string") return args;
    if (event.type === "MESSAGE_UPDATE") {
      const msg = event.message;
      if (!msg) return args;
      const channelStore = ChannelMessages && ChannelMessages.getChannelMessages && ChannelMessages.getChannelMessages(msg.channel_id);
      const oldRaw = (channelStore && (channelStore.getMessage ? channelStore.getMessage(msg.id) : channelStore.get ? channelStore.get(msg.id) : null)) || null;
      const old = oldRaw && typeof oldRaw.toJS === "function" ? oldRaw.toJS() : oldRaw;
      if (!old) return args;
      if (msg.content !== old.content) {
        msg.__vml_edited = true;
        msg.__vml_edits = [
          ...(old.__vml_edits || []),
          {
            timestamp: Date.now(),
            oldContent: old.content,
            newContent: msg.content,
          },
        ];
      }
      return args;
    }
    if (event.type === "MESSAGE_DELETE") {
      if (event.__vml_cleanup) return args;
      const channelStore = ChannelMessages && ChannelMessages.getChannelMessages && ChannelMessages.getChannelMessages(event.channelId);
      const messageRaw = (channelStore && (channelStore.getMessage ? channelStore.getMessage(event.id) : channelStore.get ? channelStore.get(event.id) : null)) || null;
      const message = messageRaw && typeof messageRaw.toJS === "function" ? messageRaw.toJS() : messageRaw;
      if (!message) return args;
      const newEvent = {
        type: "MESSAGE_UPDATE",
        channelId: event.channelId,
        message: {
          ...message,
          __vml_deleted: true,
        },
      };
      return [newEvent];
    }
    return args;
  })
);

patches.push(
  after("generate", RowManager && RowManager.prototype ? RowManager.prototype : {}, (args, row) => {
    if (!row || !row.props) return;
    const msg = (row.props && row.props.message) || (args && args[0] && args[0].message);
    if (!msg) return;
    if (msg.__vml_deleted) {
      row.props.backgroundHighlight = row.props.backgroundHighlight || {};
      row.props.backgroundHighlight.backgroundColor = ReactNative.processColor("#da373c22");
      row.props.backgroundHighlight.gutterColor = ReactNative.processColor("#da373cff");
    }
    if (msg.__vml_edited) {
      row.props.backgroundHighlight = row.props.backgroundHighlight || {};
      row.props.backgroundHighlight.backgroundColor = ReactNative.processColor("#eab30822");
      row.props.backgroundHighlight.gutterColor = ReactNative.processColor("#eab308ff");
    }
  })
);

patches.push(
  after("default", MessageContentMod || { default: null }, (args, ret) => {
    const props = args && args[0];
    const msg = props && props.message;
    if (!msg || !msg.__vml_edits || !msg.__vml_edits.length) return ret;
    const history = msg.__vml_edits.map((e) => `${new Date(e.timestamp).toLocaleString()}: ${e.oldContent} → ${e.newContent}`).join("\n");
    const HistoryNode = React.createElement(ReactNative.Text, { style: { fontSize: 10, color: "#888", marginBottom: 4 } }, history);
    if (!React.isValidElement(ret)) return ret;
    return React.createElement(ReactNative.View, null, HistoryNode, ret);
  })
);

export default {
  onLoad() {},
  onUnload() {
    for (let i = 0; i < patches.length; i++) {
      try {
        const unpatch = patches[i];
        if (typeof unpatch === "function") unpatch();
      } catch (e) {}
    }
  },
};
