import { patcher } from "@vendetta";
import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import Settings from "./Settings";

let unpatch;

export default {
    onLoad: () => {
        // Try multiple ways to find the asset module
        const AssetModule = findByProps("getAssetIDByName") ||
            findByProps("registerAsset") ||
            findByProps("getAssetById");

        if (!AssetModule) {
            console.error("CustomSplash: AssetModule not found");
            showToast("CustomSplash: AssetModule not found", getAssetIDByName("Small"));
            return;
        }

        // Determine the function name
        let funcName = "getAssetIDByName";
        if (!AssetModule[funcName]) {
            if (AssetModule.getAssetIdByName) {
                funcName = "getAssetIdByName";
            } else {
                showToast(`CustomSplash: ${funcName} not found on module`, getAssetIDByName("Small"));
                return;
            }
        }

        const targetNames = ["logo", "LaunchScreen", "Splash", "SimpleSplash"];

        unpatch = patcher.after(funcName, AssetModule, ([name], res) => {
            if (!storage.splashURL) return res;

            if (targetNames.includes(name)) {
                return { uri: storage.splashURL };
            }

            return res;
        });

        showToast("CustomSplash: Patched asset system", getAssetIDByName("Check"));
    },
    onUnload: () => {
        unpatch?.();
    },
    settings: Settings,
}
