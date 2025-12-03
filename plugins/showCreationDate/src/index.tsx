import { findByDisplayName } from "@vendetta/metro";
import { i18n, React } from "@vendetta/metro/common";
import { after } from "@vendetta/patcher";
import { General } from "@vendetta/ui/components";

const { Text } = General;

const DISCORD_EPOCH = 1420070400000n;

const UserProfileSection = findByDisplayName("UserProfileSection");

let unpatch;

function getCreationDate(userId) {
  const id = BigInt(userId);
  const timestamp = Number((id >> 22n) + DISCORD_EPOCH);
  return new Date(timestamp);
}

function formatDate(date) {
  return date.toLocaleDateString(i18n.getLocale(), {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default {
  onLoad() {
    unpatch = after("default", UserProfileSection, (args, res) => {
      if (!res?.props) return res;

      const user = res.props.user;
      if (!user) return res;

      const creationDate = getCreationDate(user.id);
      const formatted = `Account Created: ${formatDate(creationDate)}`;

      const existingChildren = React.Children.toArray(res.props.children);

      res.props.children = [
        ...existingChildren,
        <Text style={{ color: "#B5BAC1", fontSize: 12, marginTop: 8 }}>
          {formatted}
        </Text>,
      ];

      return res;
    });
  },

  onUnload() {
    unpatch?.();
  },
};
