import { findByName, findByProps } from "@vendetta/metro";
import { FluxDispatcher, ReactNative } from "@vendetta/metro/common";
import { after, before, instead } from "@vendetta/patcher";

const patches: any[] = [];

const ChannelMessages = findByProps("_channelMessages");
const MessageRecordUtils = findByProps("updateMessageRecord", "createMessageRecord");
const MessageRecord = findByName("MessageRecord", false);
const RowManager = findByName("RowManager");

import { storage } from "@vendetta/plugin";

patches.push(
  before("dispatch", FluxDispatcher, ([event]) => {
    if (event.type === "MESSAGE_DELETE") {
      if (event.__vml_cleanup) return event;
      const channel = ChannelMessages.get(event.channelId);
      const message = channel?.get(event.id);
      if (!message) return event;
      if (message.author?.id == "1") return event;
      if (message.state == "SEND_FAILED") return event;
      storage.nopk &&
        fetch(
          `https://api.pluralkit.me/v2/messages/${encodeURIComponent(message.id)}`
        )
          .then((res) => res.json())
          .then((data) => {
            if (message.id === data.original && !data.member?.keep_proxy) {
              FluxDispatcher.dispatch({
                type: "MESSAGE_DELETE",
                id: message.id,
                channelId: message.channel_id,
                __vml_cleanup: true,
              });
            }
          });
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
  })
);

patches.push(
  before("dispatch", FluxDispatcher, ([event]) => {
    if (event.type !== "MESSAGE_UPDATE") return;
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
      row.backgroundHighlight.backgroundColor =
        ReactNative.processColor("#da373c22");
      row.backgroundHighlight.gutterColor =
        ReactNative.processColor("#da373cff");
    }
    if (message.__vml_edited) {
      row.message.edited = "edited";
      row.backgroundHighlight ??= {};
      row.backgroundHighlight.backgroundColor =
        ReactNative.processColor("#eab30822");
      row.backgroundHighlight.gutterColor =
        ReactNative.processColor("#eab308ff");
    }
    if (message.__vml_edits?.length > 0) {
      const editTexts = message.__vml_edits.map((e) => {
        const time = new Date(e.timestamp).toLocaleString();
        return `[Edited ${time}]: ${e.oldContent} → ${e.newContent}`;
      });
      const originalContent = row.message.content ?? "";
      row.message.content = editTexts.join("\n") + "\n" + originalContent;
    }
  })
);

patches.push(
  instead(
    "updateMessageRecord",
    MessageRecordUtils,
    function ([oldRecord, newRecord], orig) {
      if (newRecord.__vml_deleted || newRecord.__vml_edited) {
        return MessageRecordUtils.createMessageRecord(
          newRecord,
          oldRecord.reactions
        );
      }
      return orig.apply(this, [oldRecord, newRecord]);
    }
  )
);

patches.push(
  after(
    "createMessageRecord",
    MessageRecordUtils,
    function ([message], record) {
      record.__vml_deleted = message.__vml_deleted;
      record.__vml_edited = message.__vml_edited;
      record.__vml_edits = message.__vml_edits ?? [];
    }
  )
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
  for (const channelId in ChannelMessages._channelMessages) {
    for (const message of ChannelMessages._channelMessages[channelId]._array) {
      if (message.__vml_deleted)
        FluxDispatcher.dispatch({
          type: "MESSAGE_DELETE",
          id: message.id,
          channelId: message.channel_id,
          __vml_cleanup: true,
        });
    }
  }
};
