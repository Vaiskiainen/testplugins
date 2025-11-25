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
        const candidates = ["LaunchScreen", "Splash", "SimpleSplash", "Loading", "Launch"];
        let target = null;
        let patchType = "default";
        let foundName = "";

        // Try to find by displayName
        for (const name of candidates) {
            const found = findByDisplayName(name);
            if (found) {
                if (found.prototype && found.prototype.render) {
                    target = found.prototype;
                    patchType = "render";
                    foundName = name;
                    break;
                } else if (typeof found === "function") {
                    // Functional component, usually we need the module to patch it
                    // But findByDisplayName returns the component itself
                    // We can't easily patch a standalone function unless we find its module
                    // But let's see if we can find the module by props?
                    // For now, let's skip functional components found this way unless we can find their module
                    console.log(`Found functional component ${name}, but cannot patch directly without module.`);
                }
            }
        }

        // Try to find by props (module)
        if (!target) {
            const moduleCandidates = ["LaunchScreen", "Splash"];
            for (const name of moduleCandidates) {
                const mod = findByProps(name);
                if (mod) {
                    if (mod[name]) {
                        target = mod;
                        patchType = name;
                        foundName = name;
                        break;
                    } else if (mod.default) {
                        target = mod;
                        patchType = "default";
                        foundName = name;
                        break;
                    }
                }
            }
        }

        if (!target) {
            console.error("CustomSplash: No suitable splash component found");
            showToast("CustomSplash: Could not find splash component", getAssetIDByName("Small"));
            return;
        }

        showToast(`Patching ${foundName} (${patchType})`, getAssetIDByName("Check"));

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
