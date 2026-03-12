import { findByProps } from "@vendetta/metro";
import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms as UiForms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";
import BetterTableRowGroup from "./components/BetterTableRowGroup";

type NotificationStyle = "banner" | "toast";

type LogEntry = {
  content: string;
  icon: string;
  timestamp: number;
};

type FormRowComponent = React.ComponentType<any> & { Icon?: React.ComponentType<any> };
type FormsModule = Partial<{
  FormRow: FormRowComponent;
  FormSwitchRow: React.ComponentType<any>;
  FormDivider: React.ComponentType<any>;
  FormRadioRow: React.ComponentType<any>;
  FormCheckRow: React.ComponentType<any>;
  FormText: React.ComponentType<any>;
}>;

const { ScrollView, View, Text, Image } = RN;
const Forms = (
  UiForms ||
  findByProps(
    "FormRow",
    "FormSwitchRow",
    "FormDivider",
    "FormRadioRow",
    "FormCheckRow",
    "FormText",
  ) ||
  {}
) as FormsModule;
const {
  FormRow,
  FormSwitchRow,
  FormDivider,
  FormRadioRow,
  FormCheckRow,
  FormText,
} = Forms;
const ThemedText = FormText ?? Text;
const RadioRow = FormRadioRow ?? FormCheckRow ?? null;
const FormRowIcon = (FormRow as FormRowComponent | undefined)?.Icon;
const Divider = FormDivider ?? null;

const isNotificationStyle = (value: unknown): value is NotificationStyle =>
  value === "banner" || value === "toast";

const isLogEntry = (value: unknown): value is LogEntry => {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.content === "string"
    && typeof entry.icon === "string"
    && typeof entry.timestamp === "number"
    && Number.isFinite(entry.timestamp)
  );
};

const sanitizeLogs = (value: unknown): LogEntry[] =>
  Array.isArray(value) ? value.filter(isLogEntry) : [];

const getAssetId = (name: string) => {
  const id = getAssetIDByName(name);
  return id || undefined;
};

const getFirstAssetId = (names: string[], fallback?: number) => {
  for (const name of names) {
    const id = getAssetId(name);
    if (id) return id;
  }
  return fallback;
};

const renderIcon = (iconId?: number, tintColor?: string) => {
  if (!iconId) return undefined;
  if (FormRowIcon) {
    return <FormRowIcon source={iconId} style={tintColor ? { tintColor } : undefined} />;
  }
  return (
    <Image
      source={iconId}
      style={{
        width: 20,
        height: 20,
        tintColor: tintColor ?? semanticColors.TEXT_MUTED,
      }}
    />
  );
};

const notificationsIconId = getAssetId("ic_notif");
const infoIconId = getAssetId("ic_premium_info_24px");
const logIconId = getAssetId("empty_server_settings_audit_log_dark");
const friendsIconId = getAssetId("ic_friend_wave_24px");
const serversIconId = getFirstAssetId(
  ["ic_guild_24px", "ic_server_24px", "ic_server", "ic_guild"],
  notificationsIconId,
);
const groupsIconId = getAssetId("ic_group_dm");
const actionsIconId = getAssetId("ic_settings_24px");
const arrowRightIconId = getAssetId("ic_arrow_right");
const backIconId = getAssetId("back-icon");
const personRemoveIconId = getAssetId("ic_close_circle_24px");
const leaveGuildIconId = getAssetId("ic_close_circle_24px");
const trashIconId = getAssetId("ic_trash_24px");

export default () => {
  useProxy(storage);

  const [selectedPageId, setSelectedPageId] = React.useState<string | null>(null);
  const scrollRef = React.useRef<React.ElementRef<typeof ScrollView> | null>(null);

  if (!FormRow || !FormSwitchRow) {
    return null;
  }

  const logs = React.useMemo(() => sanitizeLogs(storage.logs), [storage.logs]);
  const reversedLogs = React.useMemo(() => logs.slice().reverse(), [logs]);
  const hasLogs = reversedLogs.length > 0;
  const notificationStyle: NotificationStyle = isNotificationStyle(storage.notificationStyle)
    ? storage.notificationStyle
    : "banner";

  const renderTrailingArrow = () => {
    if (!arrowRightIconId) return undefined;
    if (FormRowIcon) return <FormRowIcon source={arrowRightIconId} />;
    return (
      <Image
        source={arrowRightIconId}
        style={{ width: 20, height: 20, tintColor: semanticColors.TEXT_MUTED }}
      />
    );
  };

  const renderBackIcon = () => {
    if (!backIconId) return undefined;
    if (FormRowIcon) return <FormRowIcon source={backIconId} />;
    return (
      <Image
        source={backIconId}
        style={{ width: 20, height: 20, tintColor: semanticColors.TEXT_MUTED }}
      />
    );
  };

  React.useEffect(() => {
    try {
      scrollRef.current?.scrollTo?.({ y: 0, animated: false });
    } catch {
      
    }
  }, [selectedPageId]);

  const renderMainList = () => (
    <>
      <BetterTableRowGroup title="Categories" icon={actionsIconId}>
        <FormRow
          label="Notifications"
          subLabel="Friend, server, and group alerts"
          leading={renderIcon(notificationsIconId)}
          trailing={renderTrailingArrow()}
          onPress={() => setSelectedPageId("notifications")}
        />
        <FormRow
          label="Logs"
          subLabel="Recent events and log actions"
          leading={renderIcon(logIconId)}
          trailing={renderTrailingArrow()}
          onPress={() => setSelectedPageId("logs")}
        />
        <FormRow
          label="Other Settings"
          subLabel="Miscellaneous options"
          leading={renderIcon(actionsIconId)}
          trailing={renderTrailingArrow()}
          onPress={() => setSelectedPageId("other")}
        />
        <FormRow
          label="Information"
          subLabel="About this plugin"
          leading={renderIcon(actionsIconId)}
          trailing={renderTrailingArrow()}
          onPress={() => setSelectedPageId("info")}
        />
      </BetterTableRowGroup>
    </>
  );

  const renderNotificationsPage = () => (
    <>
      <BetterTableRowGroup title="Servers" icon={serversIconId}>
        <FormSwitchRow
          label="Server Removals"
          subLabel="Notify when you are kicked or banned from a server."
          leading={renderIcon(leaveGuildIconId)}
          value={storage.notifyServers ?? true}
          onValueChange={(v: boolean) => (storage.notifyServers = v)}
        />
      </BetterTableRowGroup>

      <BetterTableRowGroup title="Friends" icon={friendsIconId}>
        <View style={{ opacity: 0.5 }}>
          <FormSwitchRow
            label="Friend Removals"
            subLabel="Notify when someone unfriends you."
            leading={renderIcon(personRemoveIconId)}
            value={false}
            onValueChange={() => showToast("Coming soon", infoIconId)}
          />
        </View>
        <View style={{ opacity: 0.5 }}>
          <FormSwitchRow
            label="Friend Request Cancellations"
            subLabel="Notify when a friend request is canceled."
            leading={renderIcon(personRemoveIconId)}
            value={false}
            onValueChange={() => showToast("Coming soon", infoIconId)}
          />
        </View>
      </BetterTableRowGroup>

      <BetterTableRowGroup title="Group Chats" icon={groupsIconId}>
        <View style={{ opacity: 0.5 }}>
          <FormSwitchRow
            label="Group Chat Removals"
            subLabel="Notify when you are removed from a group DM."
            leading={renderIcon(leaveGuildIconId)}
            value={false}
            onValueChange={() => showToast("Coming soon", infoIconId)}
          />
        </View>
      </BetterTableRowGroup>

      <BetterTableRowGroup title="Navigation" icon={actionsIconId}>
        <FormRow
          label="Back to categories"
          leading={renderBackIcon()}
          onPress={() => setSelectedPageId(null)}
        />
      </BetterTableRowGroup>
    </>
  );

  const renderLogsPage = () => (
    <>
      <BetterTableRowGroup title="Notification Log" icon={logIconId}>
        {!hasLogs ? (
          <View style={{ padding: 16, alignItems: "center" }}>
            <Text style={{ color: semanticColors.TEXT_MUTED }}>No recent events.</Text>
          </View>
        ) : (
          <>
            {reversedLogs.map((log: LogEntry, i: number) => (
              <View key={`${log?.timestamp ?? "log"}-${i}`}>
                <FormRow
                  label={log.content}
                  subLabel={new Date(log.timestamp).toLocaleString()}
                  leading={renderIcon(getAssetId(log.icon))}
                />
                {i < reversedLogs.length - 1 && (Divider ? <Divider /> : null)}
              </View>
            ))}
            {Divider ? <Divider /> : null}
          </>
        )}
      </BetterTableRowGroup>

      {hasLogs && (
        <BetterTableRowGroup title="Log Actions" icon={actionsIconId}>
          <FormRow
            label="Clear Logs"
            labelStyle={{ color: "#ed4245" }}
            leading={renderIcon(trashIconId, "#ed4245")}
            onPress={() => (storage.logs = [])}
          />
        </BetterTableRowGroup>
      )}

      <BetterTableRowGroup title="Navigation" icon={actionsIconId}>
        <FormRow
          label="Back to categories"
          leading={renderBackIcon()}
          onPress={() => setSelectedPageId(null)}
        />
      </BetterTableRowGroup>
    </>
  );

  const renderOtherSettingsPage = () => (
    <>
      <BetterTableRowGroup title="Notification Style" icon={notificationsIconId}>
        {RadioRow ? (
          <>
            <RadioRow
              label="Banner"
              subLabel="Show a banner with details"
              selected={notificationStyle !== "toast"}
              leading={renderIcon(notificationsIconId)}
              onPress={() => (storage.notificationStyle = "banner")}
            />
            <RadioRow
              label="Toast"
              subLabel="Show a simple toast notification"
              selected={notificationStyle === "toast"}
              leading={renderIcon(notificationsIconId)}
              onPress={() => (storage.notificationStyle = "toast")}
            />
          </>
        ) : (
          <>
            <FormRow
              label="Banner"
              subLabel={
                notificationStyle !== "toast"
                  ? "Selected"
                  : "Show a banner with details"
              }
              leading={renderIcon(notificationsIconId)}
              onPress={() => (storage.notificationStyle = "banner")}
            />
            <FormRow
              label="Toast"
              subLabel={
                notificationStyle === "toast"
                  ? "Selected"
                  : "Show a simple toast notification"
              }
              leading={renderIcon(notificationsIconId)}
              onPress={() => (storage.notificationStyle = "toast")}
            />
          </>
        )}
      </BetterTableRowGroup>

      <BetterTableRowGroup title="Navigation" icon={actionsIconId}>
        <FormRow
          label="Back to categories"
          leading={renderBackIcon()}
          onPress={() => setSelectedPageId(null)}
        />
      </BetterTableRowGroup>
    </>
  );

  const renderInformationPage = () => (
    <>
      <BetterTableRowGroup title="Information" icon={actionsIconId} padding>
        <ThemedText style={{ color: semanticColors.TEXT_MUTED }}>
          Notifies you when you are unfriended, or removed from a group DM or server.
          It may not always work if you were offline; improvements are in progress.
        </ThemedText>
      </BetterTableRowGroup>

      <BetterTableRowGroup title="Navigation" icon={actionsIconId}>
        <FormRow
          label="Back to categories"
          leading={renderBackIcon()}
          onPress={() => setSelectedPageId(null)}
        />
      </BetterTableRowGroup>
    </>
  );

  const renderDetailPage = () => {
    const detailId = selectedPageId;
    if (detailId === "logs") return renderLogsPage();
    if (detailId === "notifications") return renderNotificationsPage();
    if (detailId === "other") return renderOtherSettingsPage();
    if (detailId === "info") return renderInformationPage();
    return null;
  };

  return (
    <ScrollView ref={scrollRef} style={{ flex: 1 }}>
      {selectedPageId ? renderDetailPage() : renderMainList()}
    </ScrollView>
  );
}
