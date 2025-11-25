import { patcher } from "@vendetta";
import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import Settings from "./Settings";

const LaunchScreen = findByProps("LaunchScreen");

let unpatch;

function replaceImage(node: any): boolean {
    if (!node || !node.props) return false;

    let replaced = false;

    // Check if the node has a source prop (Image or FastImage)
    if (node.props.source) {
        // We assume any image in the LaunchScreen is the logo we want to replace
        // This might replace background too if it's an image, but usually it's a View with color
        node.props.source = { uri: storage.splashURL };
        node.props.resizeMode = 'contain';
        replaced = true;
    }

    if (node.props.children) {
        if (Array.isArray(node.props.children)) {
            for (const child of node.props.children) {
                if (replaceImage(child)) replaced = true;
            }
        } else {
            if (replaceImage(node.props.children)) replaced = true;
        }
    }

    return replaced;
}

export default {
    onLoad: () => {
        if (!LaunchScreen) {
            console.error("CustomSplash: LaunchScreen not found");
            showToast("CustomSplash: LaunchScreen not found", getAssetIDByName("Small"));
            return;
        }

        unpatch = patcher.after("default", LaunchScreen, (_, res) => {
            if (!storage.splashURL) return res;

            try {
                const success = replaceImage(res);
                if (success) {
                    // console.log("CustomSplash: Successfully replaced splash image");
                }
            } catch (e) {
                console.error("CustomSplash: Failed to replace image", e);
                showToast("CustomSplash: Failed to replace image", getAssetIDByName("Small"));
            }
            return res;
        });
    },
    onUnload: () => {
        unpatch?.();
    },
    settings: Settings,
}
