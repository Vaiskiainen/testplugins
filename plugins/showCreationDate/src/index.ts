import { findByDisplayName } from "@vendetta/metro";
import { i18n, React } from "@vendetta/metro/common";
import { after } from "@vendetta/patcher";
import { General } from "@vendetta/ui/components";

const { Text } = General;

const DISCORD_EPOCH = 1420070400000n;

const UserProfileSection = findByDisplayName("UserProfileSection");

let unpatch: () => void;

function getCreationDate(userId: string) {
  const id = BigInt(userId);
  const timestamp = Number((id >> 22n) + DISCORD_EPOCH);
  return new Date(timestamp);
}

function formatDate(date: Date) {
  return date.toLocaleDateString(i18n.getLocale(), {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default {
  onLoad() {
    unpatch = after("default", UserProfileSection, (_args: any, res: any) => {
      if (!res?.props) return res;

      const user = res.props.user;
      if (!user) return res;

      const creationDate = getCreationDate(user.id);
      const formatted = `Account Created: ${formatDate(creationDate)}`;

      const existingChildren = React.Children.toArray(res.props.children);

      const element = React.createElement(
        Text,
        {
          style: {
            color: "#B5BAC1",
            fontSize: 12,
            marginTop: 8,
          },
        },
        formatted
      );

      res.props.children = [...existingChildren, element];

      return res;
    });
  },

  onUnload() {
    unpatch?.();
  },
};
