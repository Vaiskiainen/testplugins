import { patcher } from "@vendetta";
import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import Settings from "./Settings";

let unpatch;

export default {
    onLoad: () => {
        const AssetModule = findByProps("getAssetById");
        if (!AssetModule) {
            console.error("CustomSplash: AssetModule (getAssetById) not found");
            showToast("CustomSplash: AssetModule not found", getAssetIDByName("Small"));
            return;
        }

        unpatch = patcher.after("getAssetById", AssetModule, ([id], res) => {
            if (!storage.splashURL) return res;

            // Default to 1547 if not set
            const targetId = parseInt(storage.splashAssetId || "1547");

            if (id === targetId) {
                // console.log(`CustomSplash: Intercepted asset ID ${id}`);
                return {
                    ...res,
                    uri: storage.splashURL,
                    // We might need to override width/height if the custom image is different
                    // but usually just changing URI is enough if the view handles resizing
                };
            }

            return res;
        });

        showToast("CustomSplash: Patched getAssetById", getAssetIDByName("Check"));
    },
    onUnload: () => {
        unpatch?.();
    },
    settings: Settings,
}
