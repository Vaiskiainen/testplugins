import { findByProps } from "@vendetta/metro";
import { FluxDispatcher, ReactNative } from "@vendetta/metro/common";
import { before, after } from "@vendetta/patcher";
import React from "react";

let patches = [];

const ChannelMessages = findByProps("getChannelMessages", "getMessage");
const MessageContent = findByProps("type", "messageAccessoriesContainer");

function getMsg(channelId, msgId) {
  const store = ChannelMessages.getChannelMessages(channelId);
  if (!store) return null;
  const raw = store.getMessage ? store.getMessage(msgId) : store.get(msgId);
  return raw && raw.toJS ? raw.toJS() : raw;
}

function wrapView(top, bottom) {
  return React.createElement(
    ReactNative.View,
    null,
    top,
    bottom
  );
}

export default {
  onLoad() {
    patches.push(
      before("dispatch", FluxDispatcher, (args) => {
        const ev = args[0];
        if (!ev) return;

        if (ev.type === "MESSAGE_UPDATE") {
          const m = ev.message;
          const old = getMsg(m.channel_id, m.id);
          if (!old) return;
          if (m.content !== old.content) {
            m.__hist = [
              ...(old.__hist || []),
              {
                t: Date.now(),
                o: old.content,
                n: m.content,
              },
            ];
          }
          return;
        }

        if (ev.type === "MESSAGE_DELETE") {
          const old = getMsg(ev.channelId, ev.id);
          if (!old) return;
          return [
            {
              type: "MESSAGE_UPDATE",
              channelId: ev.channelId,
              message: {
                ...old,
                __deleted: true,
              },
            },
          ];
        }
      })
    );

    patches.push(
      after("default", MessageContent, (args, ret) => {
        const props = args[0];
        const m = props.message;

        if (!m) return ret;

        let extra = null;

        if (m.__deleted) {
          extra = React.createElement(
            ReactNative.Text,
            { style: { color: "#ff4444", fontSize: 12, marginBottom: 4 } },
            "Deleted message"
          );
        } else if (m.__hist && m.__hist.length) {
          const lines = m.__hist
            .map((e) => `${new Date(e.t).toLocaleString()}: ${e.o} → ${e.n}`)
            .join("\n");

          extra = React.createElement(
            ReactNative.Text,
            { style: { color: "#888", fontSize: 10, marginBottom: 4 } },
            lines
          );
        }

        if (!extra) return ret;

        return wrapView(extra, ret);
      })
    );
  },

  onUnload() {
    for (const p of patches) try { p(); } catch {}
    patches = [];
  },
};
