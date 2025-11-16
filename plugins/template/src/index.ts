import { findByName, findByProps } from "@vendetta/metro";
import { FluxDispatcher, ReactNative } from "@vendetta/metro/common";
import { after, before } from "@vendetta/patcher";
import React from "react";

const patches: any[] = [];

const ChannelMessages = findByProps("getChannelMessages", "getMessage");
const RowManager = findByName("RowManager");
const MessageContentMod = findByName("MessageContent");

patches.push(
  before("dispatch", FluxDispatcher, ([event]) => {

    if (event.type === "MESSAGE_UPDATE") {
      const msg = event.message;
      const channel = ChannelMessages.getChannelMessages(msg.channel_id);
      if (!channel) return;
      const old = channel.getMessage(msg.id);
      if (!old) return;

      if (msg.content !== old.content) {
        msg.__vml_edited = true;
        msg.__vml_edits = [
          ...(old.__vml_edits ?? []),
          {
            timestamp: Date.now(),
            oldContent: old.content,
            newContent: msg.content
          }
        ];
      }
      return event;
    }


    if (event.type === "MESSAGE_DELETE") {
      if (event.__vml_cleanup) return event;

      const channel = ChannelMessages.getChannelMessages(event.channelId);
      const message = channel?.getMessage(event.id);
      if (!message) return event;


      return [
        {
          type: "MESSAGE_UPDATE",
          channelId: event.channelId,
          message: {
            ...message,
            __vml_deleted: true
          }
        }
      ];
    }

    return event;
  })
);


patches.push(
  after("generate", RowManager.prototype, ([data], row) => {
    if (!row?.props?.message) return;
    const message = row.props.message;

    if (message.__vml_deleted) {
      row.props.backgroundHighlight = {
        backgroundColor: ReactNative.processColor("#da373c22"),
        gutterColor: ReactNative.processColor("#da373cff")
      };
    }

    if (message.__vml_edited) {
      row.props.backgroundHighlight = {
        backgroundColor: ReactNative.processColor("#eab30822"),
        gutterColor: ReactNative.processColor("#eab308ff")
      };
    }
  })
);


patches.push(
  after("default", MessageContentMod ?? { default: null }, ([props], ret) => {
    const msg = props.message;
    if (!msg || !msg.__vml_edits?.length) return;

    const history = msg.__vml_edits
      .map(
        e =>
          `${new Date(e.timestamp).toLocaleString()}: ${e.oldContent} → ${e.newContent}`
      )
      .join("\n");

    const extra = React.createElement(
      ReactNative.Text,
      {
        style: {
          fontSize: 10,
          color: "#888",
          marginBottom: 4
        }
      },
      history
    );

    if (!React.isValidElement(ret)) return;

    const children = Array.isArray(ret.props.children)
      ? ret.props.children
      : [ret.props.children];

    return React.cloneElement(ret, {
      children: [extra, ...children]
    });
  })
);

export const onUnload = () => patches.forEach(p => p());
