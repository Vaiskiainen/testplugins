import { patcher } from "@vendetta";
import { findByProps, findByDisplayName } from "@vendetta/metro";
import { React, ReactNative } from "@vendetta/metro/common";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";

const { View } = ReactNative;
const UserProfileActivity = findByDisplayName("UserProfileActivity");
const UserActivity = findByDisplayName("UserActivity");

let unpatch;

export default {
    onLoad: () => {
        if (!UserProfileActivity || !UserActivity) {
            console.error("ShowAllActivities: Components not found");
            showToast("ShowAllActivities: Components not found", getAssetIDByName("Small"));
            return;
        }

        unpatch = patcher.after("default", UserProfileActivity, ([props], res) => {
            if (!props?.presence?.activities) return res;

            const activities = props.presence.activities;

            if (activities && Array.isArray(activities) && activities.length > 0) {
                return (
                    <View style= {{ flexDirection: 'column', gap: 4 }
            }>
            {
                activities.map((activity, index) => (
                    <UserActivity 
                                key= { activity.id || index }
                                activity = { activity }
                                user = { props.user }
                                source = { props.source }
                                { ...props } 
                                activity = { activity }
                    />
                        ))
    }
                    </View>
                );
            }

return res;
        });
    },
onUnload: () => {
    unpatch?.();
}, 
}
