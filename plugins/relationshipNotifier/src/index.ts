import { find, findByProps, findByStoreName } from "@vendetta/metro";
import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { after, before } from "@vendetta/patcher";
import { storage } from "@vendetta/plugin";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";
import Settings from "./Settings";

const Dispatcher = findByProps("dispatch", "subscribe");
const GuildStore = findByStoreName("GuildStore");
const GuildIconUtils = findByProps("getGuildIconURL");

const GuildActions = findByProps("leaveGuild");

let manuallyRemovedGuild: string | undefined;

const patches: Function[] = [];

const TOAST_DURATION_MS = 2147483647;
const OFFLINE_CHECK_INITIAL_DELAY_MS = 1500;
const OFFLINE_CHECK_INTERVAL_MS = 2000;
const SNAPSHOT_WARM_DELAY_MS = 5000;
const SNAPSHOT_HEARTBEAT_MS = 120000;
const MAX_LOGS = 50;
const MAX_NOTIFICATION_QUEUE = 50;

type NotificationStyle = "banner" | "toast";

type LogEntry = {
    content: string;
    icon: string;
    timestamp: number;
};

type SnapshotEntry = {
    id: string;
    name?: string;
};

type Snapshot = {
    guilds: SnapshotEntry[];
    capturedAt: number;
};

type StorageShape = {
    notifyServers?: boolean;
    logs?: LogEntry[];
    notificationStyle?: NotificationStyle;
    snapshot?: Snapshot;
};

const storageState = storage as StorageShape;

let offlineCheckTimeout: ReturnType<typeof setTimeout> | undefined;
let offlineCheckInterval: ReturnType<typeof setInterval> | undefined;
let offlineCheckLoopStarted = false;
let offlineCheckCompleted = false;
let connectionListener: (() => void) | undefined;
let snapshotWarmTimeout: ReturnType<typeof setTimeout> | undefined;
let snapshotHeartbeatInterval: ReturnType<typeof setInterval> | undefined;
let snapshotUpdateTimeout: ReturnType<typeof setTimeout> | undefined;

const ActionSheetRoot =
    findByProps("ActionSheet")?.ActionSheet
    ?? find((mod) => mod?.render?.name === "ActionSheet");
const ActionSheetControls = findByProps("openLazy", "hideActionSheet");
const ActionSheetHeader = findByProps("ActionSheetTitleHeader", "ActionSheetCloseButton");

const openLazy = ActionSheetControls?.openLazy as
    | ((component: Promise<any>, key: string, props?: object) => void)
    | undefined;
const hideActionSheet = ActionSheetControls?.hideActionSheet as
    | (() => void)
    | undefined;
const ActionSheetTitleHeader = ActionSheetHeader?.ActionSheetTitleHeader;
const ActionSheetCloseButton = ActionSheetHeader?.ActionSheetCloseButton;

const notificationQueue: Array<{
    content: string;
    icon: string;
    mediaSource?: any;
    mediaShape?: "circle" | "rounded";
}> = [];
let notificationOpen = false;
let pluginActive = false;

const DEFAULT_NOTIFICATION_STYLE: NotificationStyle = "banner";

function isNotificationStyle(value: unknown): value is NotificationStyle {
    return value === "banner" || value === "toast";
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.length > 0;
}

function isLogEntry(value: unknown): value is LogEntry {
    if (!value || typeof value !== "object") return false;
    const entry = value as Record<string, unknown>;
    return (
        typeof entry.content === "string"
        && typeof entry.icon === "string"
        && typeof entry.timestamp === "number"
        && Number.isFinite(entry.timestamp)
    );
}

function ensureStorageDefaults() {
    if (typeof storageState.notifyServers !== "boolean") {
        storageState.notifyServers = true;
    }

    if (!Array.isArray(storageState.logs)) {
        storageState.logs = [];
    } else {
        storageState.logs = storageState.logs.filter(isLogEntry);
    }

    if (!isNotificationStyle(storageState.notificationStyle)) {
        storageState.notificationStyle = DEFAULT_NOTIFICATION_STYLE;
    }
}

function getIconAssetId(name: string): number | undefined {
    const id = getAssetIDByName(name);
    return id || undefined;
}

function getNotificationStyle(): NotificationStyle {
    return storageState.notificationStyle === "toast" ? "toast" : DEFAULT_NOTIFICATION_STYLE;
}

function normalizeEntries(entries?: Array<SnapshotEntry | string>) {
    if (!Array.isArray(entries)) return [];
    return entries
        .map((entry) => (typeof entry === "string" ? { id: entry } : entry))
        .filter((entry): entry is SnapshotEntry => isNonEmptyString(entry?.id))
        .map((entry) => ({
            id: entry.id,
            name: typeof entry.name === "string" ? entry.name : undefined,
        }));
}

function toArray(value: any) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (value instanceof Map) return Array.from(value.values());
    if (typeof value === "object") return Object.values(value);
    return [];
}

function getGuildName(id: string) {
    const guild = GuildStore?.getGuild?.(id);
    if (guild?.name) return guild.name;
    const snapshot = storageState.snapshot as Snapshot | undefined;
    const fromSnapshot = normalizeEntries(snapshot?.guilds).find((entry) => entry.id === id);
    return fromSnapshot?.name;
}

function getGuildIconSource(id: string) {
    const guild = GuildStore?.getGuild?.(id);
    if (!guild?.icon) return undefined;
    if (GuildIconUtils?.getGuildIconURL) {
        return { uri: GuildIconUtils.getGuildIconURL(guild, 128, true) };
    }
    return { uri: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128` };
}

function getGuildEntries(): SnapshotEntry[] {
    const guildMap = GuildStore?.getGuilds?.() || GuildStore?.guilds || {};
    const guilds = toArray(guildMap);
    return guilds
        .filter((guild) => guild?.id)
        .map((guild) => ({
            id: String(guild.id),
            name: typeof guild?.name === "string" ? guild.name : undefined,
        }));
}

function getCurrentSnapshot(): Snapshot {
    const guilds = getGuildEntries();

    return {
        guilds,
        capturedAt: Date.now(),
    };
}

function getSnapshotTotal(snapshot: Snapshot) {
    return snapshot.guilds.length;
}

function scheduleOfflineCheck(delay = OFFLINE_CHECK_INITIAL_DELAY_MS) {
    if (offlineCheckTimeout) clearTimeout(offlineCheckTimeout);
    offlineCheckTimeout = setTimeout(() => {
        checkForOfflineChanges();
    }, delay);
}

function persistSnapshotIfReady(force = false) {
    const current = getCurrentSnapshot();
    if (getSnapshotTotal(current) === 0) return;
    const hasPrevious = !!storageState.snapshot;
    if (!force && hasPrevious && !offlineCheckCompleted) return;
    storageState.snapshot = current;
}

function stopOfflineCheckLoop() {
    if (offlineCheckTimeout) clearTimeout(offlineCheckTimeout);
    if (offlineCheckInterval) clearInterval(offlineCheckInterval);
    offlineCheckTimeout = undefined;
    offlineCheckInterval = undefined;
    offlineCheckLoopStarted = false;
}

function startOfflineCheckLoop() {
    if (offlineCheckCompleted) return;
    if (offlineCheckLoopStarted) return;
    offlineCheckLoopStarted = true;
    scheduleOfflineCheck(OFFLINE_CHECK_INITIAL_DELAY_MS);
    offlineCheckInterval = setInterval(() => {
        const completed = checkForOfflineChanges();
        if (completed) {
            offlineCheckCompleted = true;
            stopOfflineCheckLoop();
            return;
        }
    }, OFFLINE_CHECK_INTERVAL_MS);
}

function updateSnapshotSoon(delay = 250) {
    if (snapshotUpdateTimeout) clearTimeout(snapshotUpdateTimeout);
    snapshotUpdateTimeout = setTimeout(() => {
        if (!pluginActive) return;
        storageState.snapshot = getCurrentSnapshot();
    }, delay);
}

function addLog(content: string, icon: string) {
    if (!isNonEmptyString(content)) return;
    const logs = Array.isArray(storageState.logs) ? storageState.logs.filter(isLogEntry) : [];
    logs.push({
        content,
        icon,
        timestamp: Date.now()
    });

    if (logs.length > MAX_LOGS) {
        logs.splice(0, logs.length - MAX_LOGS);
    }
    storageState.logs = logs;
}

function ActionSheetWrapper({
    title,
    onClose,
    children,
}: {
    title: string;
    onClose?: () => void;
    children?: any;
}) {
    if (!ActionSheetRoot) return null;
    const header = ActionSheetTitleHeader && ActionSheetCloseButton
        ? React.createElement(ActionSheetTitleHeader, {
            title,
            trailing: React.createElement(ActionSheetCloseButton, {
                onPress: onClose ?? (() => hideActionSheet?.()),
            }),
        })
        : null;

    return React.createElement(
        ActionSheetRoot,
        null,
        header,
        React.createElement(RN.View, null, children),
    );
}

function NotificationSheet({
    message,
    icon,
    mediaSource,
    mediaShape,
    onDismiss,
}: {
    message: string;
    icon: string;
    mediaSource?: any;
    mediaShape?: "circle" | "rounded";
    onDismiss: () => void;
}) {
    const styles = stylesheet.createThemedStyleSheet({
        container: {
            paddingHorizontal: 16,
            paddingBottom: 16,
        },
        row: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginTop: 8,
        },
        media: {
            width: 44,
            height: 44,
            borderRadius: mediaShape === "circle" ? 22 : 10,
            backgroundColor: semanticColors?.BACKGROUND_SECONDARY ?? "#2b2d31",
        },
        icon: {
            width: 20,
            height: 20,
            tintColor: semanticColors?.TEXT_DEFAULT ?? "#ffffff",
        },
        message: {
            flex: 1,
            fontSize: 15,
            color: semanticColors?.TEXT_DEFAULT ?? "#ffffff",
        },
        button: {
            marginTop: 12,
            alignSelf: "center",
            backgroundColor: semanticColors?.BRAND_500 ?? "#5865f2",
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 8,
            minWidth: 120,
            alignItems: "center",
        },
        buttonText: {
            color: "#ffffff",
            fontSize: 14,
            fontWeight: "600",
        },
    });
    const iconAssetId = getIconAssetId(icon);

    return React.createElement(
        ActionSheetWrapper,
        { title: "Relationship Notifier", onClose: onDismiss },
        React.createElement(
            RN.View,
            { style: styles.container },
            React.createElement(
            RN.View,
            { style: styles.row },
            mediaSource
                ? React.createElement(RN.Image, {
                    source: mediaSource,
                    style: styles.media,
                    resizeMode: "cover",
                })
                : null,
            iconAssetId
                ? React.createElement(RN.Image, {
                    source: iconAssetId,
                    style: styles.icon,
                    resizeMode: "cover",
                })
                : null,
                React.createElement(RN.Text, { style: styles.message }, message),
            ),
            React.createElement(
                RN.Pressable,
                { style: styles.button, onPress: onDismiss },
                React.createElement(RN.Text, { style: styles.buttonText }, "Dismiss"),
            ),
        ),
    );
}

function openNotificationSheet(
    content: string,
    icon: string,
    mediaSource?: any,
    mediaShape?: "circle" | "rounded",
) {
    if (!openLazy || !ActionSheetRoot) return false;
    try {
        openLazy(
            Promise.resolve({ default: NotificationSheet }),
            "RelationshipNotifier",
            {
                message: content,
                icon,
                mediaSource,
                mediaShape,
                onDismiss: () => hideActionSheet?.(),
            },
        );
        return true;
    } catch {
        return false;
    }
}

function showNextNotification() {
    if (!pluginActive) {
        notificationQueue.length = 0;
        return;
    }
    const style = getNotificationStyle();
    if (style === "toast") {
        const next = notificationQueue.shift();
        if (!next) return;
        showToast(next.content, getIconAssetId(next.icon), TOAST_DURATION_MS);
        if (notificationQueue.length > 0) setTimeout(showNextNotification, 0);
        return;
    }

    if (notificationOpen) return;
    const next = notificationQueue.shift();
    if (!next) return;

    if (openNotificationSheet(next.content, next.icon, next.mediaSource, next.mediaShape)) {
        notificationOpen = true;
        return;
    }

    showToast(next.content, getIconAssetId(next.icon), TOAST_DURATION_MS);
}

function enqueueNotification(
    content: string,
    icon: string,
    mediaSource?: any,
    mediaShape?: "circle" | "rounded",
) {
    if (notificationQueue.length >= MAX_NOTIFICATION_QUEUE) {
        notificationQueue.shift();
    }
    notificationQueue.push({ content, icon, mediaSource, mediaShape });
    showNextNotification();
}

function notify(
    content: string,
    icon: string,
    mediaSource?: any,
    mediaShape?: "circle" | "rounded",
) {
    if (!pluginActive) return;
    if (getNotificationStyle() === "toast") {
        showToast(content, getIconAssetId(icon), TOAST_DURATION_MS);
    } else {
        enqueueNotification(content, icon, mediaSource, mediaShape);
    }
    addLog(content, icon);
}

function notifyServerRemoved(id: string, name: string) {
    notify(
        `You were removed from ${name}.`,
        "ic_leave_guild_24px",
        getGuildIconSource(id),
        "rounded",
    );
}

function checkForOfflineChanges(): boolean {
    if (!pluginActive) return false;
    const current = getCurrentSnapshot();
    const previousRaw = storageState.snapshot as Snapshot | undefined;

    if (!previousRaw) {
        const currentTotal = getSnapshotTotal(current);
        if (currentTotal === 0) return false;
        storageState.snapshot = current;
        return true;
    }

    const previous: Snapshot = {
        guilds: normalizeEntries(previousRaw.guilds),
        capturedAt: previousRaw.capturedAt || 0,
    };

    const currentGuildSet = new Set(current.guilds.map((entry) => entry.id));

    const previousTotal = getSnapshotTotal(previous);
    const currentTotal = getSnapshotTotal(current);

    if (currentTotal === 0 && previousTotal > 0) {
        return false;
    }

    if (storageState.notifyServers) {
        for (const entry of previous.guilds) {
            if (currentGuildSet.has(entry.id)) continue;
            const name = entry.name || getGuildName(entry.id) || "a server";
            notifyServerRemoved(entry.id, name);
        }
    }

    storageState.snapshot = current;
    return true;
}

function onGuildDelete(event: any) {
    if (!pluginActive) return;
    if (!event || !event.guild) return;
    const { guild } = event;
    const { id, unavailable } = guild as { id?: string; unavailable?: boolean; name?: string };
    if (!id) return;
    const eventName = typeof guild?.name === "string" ? guild.name : undefined;

    // Ignore if it's just a temporary outage
    if (unavailable) return;

    if (manuallyRemovedGuild === id) {
        manuallyRemovedGuild = undefined;
        updateSnapshotSoon();
        return;
    }

    if (storageState.notifyServers) {
        const guildName = eventName || getGuildName(id) || "a server";
        notifyServerRemoved(id, guildName);
    }
    updateSnapshotSoon();
}

function safeSubscribe(event: string, handler: (payload: any) => void) {
    try {
        Dispatcher?.subscribe?.(event, handler);
        return true;
    } catch {
        return false;
    }
}

function safeUnsubscribe(event: string, handler: (payload: any) => void) {
    try {
        Dispatcher?.unsubscribe?.(event, handler);
    } catch {}
}

export default {
    onLoad: () => {
        pluginActive = true;

        // Initialize storage
        ensureStorageDefaults();

        // Patch actions to detect manual removals
        if (GuildActions) {
            try {
                patches.push(before("leaveGuild", GuildActions, ([id]) => {
                    if (typeof id === "string") {
                        manuallyRemovedGuild = id;
                    }
                }));
            } catch {}
        }

        if (ActionSheetControls?.hideActionSheet) {
            try {
                patches.push(after("hideActionSheet", ActionSheetControls, () => {
                    if (!notificationOpen) return;
                    notificationOpen = false;
                    setTimeout(showNextNotification, 0);
                }));
            } catch {}
        }

        // Subscribe to dispatcher events
        safeSubscribe("GUILD_DELETE", onGuildDelete);

        offlineCheckLoopStarted = false;
        offlineCheckCompleted = false;
        connectionListener = () => {
            startOfflineCheckLoop();
            if (connectionListener) {
                safeUnsubscribe("CONNECTION_OPEN", connectionListener);
                safeUnsubscribe("CONNECTION_OPEN_SUPPLEMENTAL", connectionListener);
            }
            if (snapshotWarmTimeout) clearTimeout(snapshotWarmTimeout);
            snapshotWarmTimeout = setTimeout(() => {
                persistSnapshotIfReady();
            }, SNAPSHOT_WARM_DELAY_MS);
        };
        safeSubscribe("CONNECTION_OPEN", connectionListener);
        safeSubscribe("CONNECTION_OPEN_SUPPLEMENTAL", connectionListener);
        startOfflineCheckLoop();

        if (snapshotHeartbeatInterval) clearInterval(snapshotHeartbeatInterval);
        snapshotHeartbeatInterval = setInterval(() => {
            persistSnapshotIfReady();
        }, SNAPSHOT_HEARTBEAT_MS);
    },

    onUnload: () => {
        pluginActive = false;

        // Unsubscribe from dispatcher
        safeUnsubscribe("GUILD_DELETE", onGuildDelete);
        if (connectionListener) {
            safeUnsubscribe("CONNECTION_OPEN", connectionListener);
            safeUnsubscribe("CONNECTION_OPEN_SUPPLEMENTAL", connectionListener);
            connectionListener = undefined;
        }

        // Remove patches
        for (const unpatch of patches) unpatch();
        patches.length = 0;

        try {
            persistSnapshotIfReady(true);
        } catch {}

        if (offlineCheckTimeout) clearTimeout(offlineCheckTimeout);
        if (offlineCheckInterval) clearInterval(offlineCheckInterval);
        if (snapshotUpdateTimeout) clearTimeout(snapshotUpdateTimeout);
        if (snapshotWarmTimeout) clearTimeout(snapshotWarmTimeout);
        if (snapshotHeartbeatInterval) clearInterval(snapshotHeartbeatInterval);
        offlineCheckLoopStarted = false;
        offlineCheckCompleted = false;
        manuallyRemovedGuild = undefined;

        notificationQueue.length = 0;
        notificationOpen = false;
        try { hideActionSheet?.(); } catch {}
    },

    settings: Settings,
}
