import { patcher } from "@vendetta";
import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";

const LaunchScreen = findByProps("LaunchScreen");

let unpatch;

function replaceImage(node: any) {
    if (!node) return;

    // Check if the node is an Image component
    // This is a heuristic: check for 'source' prop and 'Image' in displayName if possible, 
    // or just assume any Image in LaunchScreen is the logo.
    // A safer bet is checking if the source is a local asset (number) which the logo usually is.
    if (node.props && typeof node.props.source === "number") {
        node.props.source = { uri: storage.splashURL };
        // We might also need to adjust style if the custom image has different aspect ratio, 
        // but let's stick to source replacement for now.
    }

    if (node.props && node.props.children) {
        if (Array.isArray(node.props.children)) {
            node.props.children.forEach(replaceImage);
        } else {
            replaceImage(node.props.children);
        }
    }
}

import Settings from "./Settings";

export default {
    onLoad: () => {
        if (!LaunchScreen) {
            console.error("CustomSplash: LaunchScreen not found");
            return;
        }

        // Patch the render method if it's a class, or the function if it's a functional component
        // LaunchScreen module usually exports the component as default
        unpatch = patcher.after("default", LaunchScreen, (_, res) => {
            if (!storage.splashURL) return res;

            try {
                replaceImage(res);
            } catch (e) {
                console.error("CustomSplash: Failed to replace image", e);
            }
            return res;
        });
    },
    onUnload: () => {
        unpatch?.();
    },
    settings: Settings,
}
