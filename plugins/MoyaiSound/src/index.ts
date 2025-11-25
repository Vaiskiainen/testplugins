import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { FluxDispatcher } from "@vendetta/metro";

let unsubscribe: (() => void) | null = null;

function handleMessage(event: any) {
    const content: string = event?.message?.content ?? "";
    if (!content.includes("🗿")) return;
    if (!storage.enabled) return;
    const url = storage.soundUrl || "https://cdn.jsdelivr.net/gh/discord/emoji/moyai.mp3";
    try {
        const audio = new Audio(url);
        audio.play();
    } catch (e) {
        console.error("MoyaiSound: failed to play sound", e);
        showToast("MoyaiSound: failed to play sound", getAssetIDByName("Small"));
    }
}

export default {
    onLoad: () => {

        storage.enabled ??= true;
        storage.soundUrl ??= "https://cdn.jsdelivr.net/gh/discord/emoji/moyai.mp3";
        unsubscribe = FluxDispatcher.subscribe("MESSAGE_CREATE", handleMessage);
        console.log("MoyaiSound: Loaded and listening for 🗿 emoji");
    },
    onUnload: () => {
        if (unsubscribe) unsubscribe();
        console.log("MoyaiSound: Unloaded");
    },
    settings: require("./Settings").default,
};
