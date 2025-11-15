import { findByName, findByProps } from "@vendetta/metro";
import { FluxDispatcher, ReactNative } from "@vendetta/metro/common";
import { after, before, instead } from "@vendetta/patcher";
import React from "react";

const patches: any[] = [];

const ChannelMessages = findByProps("_channelMessages");
const MessageRecordUtils = findByProps("updateMessageRecord", "createMessageRecord");
const MessageRecord = findByName("MessageRecord", false);
const RowManager = findByName("RowManager");

patches.push(
  before("dispatch", FluxDispatcher, ([event]) => {
    if (event.type === "MESSAGE_UPDATE") {
      const msg = event.message;
      const channel = ChannelMessages.get(msg?.channel_id);
      if (!channel) return;
      const old = channel.get(msg.id);
      if (!old) return;
      if (msg.content !== old.content) {
        msg.__vml_edited = true;
        msg.__vml_edits = [
          ...(old.__vml_edits ?? []),
          {
            timestamp: Date.now(),
            oldContent: old.content,
            newContent: msg.content,
          },
        ];
      }
    } else if (event.type === "MESSAGE_DELETE") {
      if (event.__vml_cleanup) return event;
      const channel = ChannelMessages.get(event.channelId);
      const message = channel?.get(event.id);
      if (!message) return event;
      msg.__vml_deleted = true;
      return [
        {
          message: {
            ...message.toJS(),
            __vml_deleted: true,
          },
          type: "MESSAGE_UPDATE",
        },
      ];
    }

    return event;
  })
);

patches.push(
  after("generate", RowManager.prototype, ([data], row) => {
    if (data.rowType !== 1) return;
    const message = data.message;
    if (message.__vml_deleted) {
      row.message.edited = "deleted";
      row.backgroundHighlight ??= {};
      row.backgroundHighlight.backgroundColor = ReactNative.processColor("#da373c22");
      row.backgroundHighlight.gutterColor = ReactNative.processColor("#da373cff");
    }
    if (message.__vml_edited) {
      row.message.edited = "edited";
      row.backgroundHighlight ??= {};
      row.backgroundHighlight.backgroundColor = ReactNative.processColor("#eab30822");
      row.backgroundHighlight.gutterColor = ReactNative.processColor("#eab308ff");
    }
  })
);

const Text = ReactNative.Text;
const View = ReactNative.View;

patches.push(
  after("default", findByName("MessageContent") ?? { default: null }, ([props], ret) => {
    const msg = props.message;
    if (!msg || !msg.__vml_edits?.length) return;

    const history = msg.__vml_edits
      .map(
        (e) =>
          `${new Date(e.timestamp).toLocaleString()}: ${e.oldContent} → ${e.newContent}`
      )
      .join("\n");

    function findTextNode(node: any): boolean {
      return node && node.type === Text;
    }

    function injectHistory(children: any): any {
      if (!children) return children;
      if (Array.isArray(children)) {
        const idx = children.findIndex(findTextNode);
        if (idx !== -1) {
          const newNode = React.createElement(
            Text,
            {
              style: {
                fontSize: 10,
                color: "#888888",
                marginBottom: 4,
              },
            },
            history
          );
          children.splice(idx, 0, newNode);
          return children;
        }
        return children.map(injectHistory);
      } else if (typeof children === "object" && children.props) {
        return React.cloneElement(children, {
          children: injectHistory(children.props.children),
        });
      } else {
        return children;
      }
    }

    if (React.isValidElement(ret)) {
      ret.props.children = injectHistory(ret.props.children);
    }
  })
);

patches.push(
  instead("updateMessageRecord", MessageRecordUtils, ([oldRecord, newRecord], orig) => {
    if (newRecord.__vml_deleted || newRecord.__vml_edited) {
      return MessageRecordUtils.createMessageRecord(newRecord, oldRecord.reactions);
    }
    return orig.apply(this, [oldRecord, newRecord]);
  })
);

patches.push(
  after("createMessageRecord", MessageRecordUtils, ([message], record) => {
    record.__vml_deleted = message.__vml_deleted;
    record.__vml_edited = message.__vml_edited;
    record.__vml_edits = message.__vml_edits ?? [];
  })
);

patches.push(
  after("default", MessageRecord, ([props], record) => {
    record.__vml_deleted = !!props.__vml_deleted;
    record.__vml_edited = !!props.__vml_edited;
    record.__vml_edits = props.__vml_edits ?? [];
  })
);

export const onUnload = () => {
  patches.forEach((unpatch) => unpatch());
};
