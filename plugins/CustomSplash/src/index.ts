import { patcher } from "@vendetta";
import { findByProps, findByDisplayName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import Settings from "./Settings";

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
        let Component;
        let patchType = "default";
        let target = null;

        // Method 1: findByProps("LaunchScreen") - Failed previously but keeping it
        const ModuleProps = findByProps("LaunchScreen");
        if (ModuleProps) {
            target = ModuleProps;
            patchType = "LaunchScreen"; // Assuming named export
            if (ModuleProps.default) patchType = "default";
        }

        // Method 2: findByDisplayName("LaunchScreen")
        if (!target) {
            const CompDisplay = findByDisplayName("LaunchScreen");
            if (CompDisplay) {
                // If it's a class component, we can patch prototype.render
                if (CompDisplay.prototype && CompDisplay.prototype.render) {
                    target = CompDisplay.prototype;
                    patchType = "render";
                } else {
                    // Functional component. We need the module to patch it.
                    // But we don't have the module. 
                    // However, sometimes findByDisplayName returns the module if it's a default export? 
                    // Unlikely. 
                    // We can try to patch the function itself if it's mutable? No.
                    console.log("Found LaunchScreen via displayName but it is functional");
                }
            }
        }

        // Method 3: findByDisplayName("Splash")
        if (!target) {
            const CompDisplay = findByDisplayName("Splash");
            if (CompDisplay) {
                if (CompDisplay.prototype && CompDisplay.prototype.render) {
                    target = CompDisplay.prototype;
                    patchType = "render";
                }
            }
        }

        if (!target) {
            console.error("CustomSplash: LaunchScreen not found");
            showToast("CustomSplash: LaunchScreen not found", getAssetIDByName("Small"));
            return;
        }

        showToast(`Patching ${patchType}`, getAssetIDByName("Check"));

        const patchCallback = (_, res) => {
            if (!storage.splashURL) return res;
            try {
                replaceImage(res);
            } catch (e) {
                console.error("CustomSplash: Failed to replace image", e);
            }
            return res;
        };

        unpatch = patcher.after(patchType, target, patchCallback);
    },
    onUnload: () => {
        unpatch?.();
    },
    settings: Settings,
}
