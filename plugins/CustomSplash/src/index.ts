import { patcher } from "@vendetta";
import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import Settings from "./Settings";

let unpatch;

export default {
    onLoad: () => {
        const AssetModule = findByProps("getAssetIDByName");
        if (!AssetModule) {
            console.error("CustomSplash: AssetModule not found");
            showToast("CustomSplash: AssetModule not found", getAssetIDByName("Small"));
            return;
        }

        const targetNames = ["logo", "LaunchScreen", "Splash", "SimpleSplash"];

        unpatch = patcher.after("getAssetIDByName", AssetModule, ([name], res) => {
            if (!storage.splashURL) return res;

            if (targetNames.includes(name)) {
                // console.log(`CustomSplash: Intercepted asset ${name}`);
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
