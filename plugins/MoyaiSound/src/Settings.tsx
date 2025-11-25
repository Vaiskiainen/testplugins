import { Forms } from "@vendetta/ui/components";
import { useProxy } from "@vendetta/storage";
import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";

const { FormSection, FormRow, FormSwitch, FormInput, FormDivider } = Forms;

export default () => {
    useProxy(storage);

    const handleToggle = (value: boolean) => {
        storage.enabled = value;
        showToast(`MoyaiSound: ${value ? "Enabled" : "Disabled"}`, getAssetIDByName("Check"));
    };

    const handleUrlChange = (value: string) => {
        storage.soundUrl = value;
        showToast("MoyaiSound: Sound URL updated", getAssetIDByName("Check"));
    };

    return (
        <FormSection title="MoyaiSound Settings">
            <FormRow label="Enable Sound" subLabel="Play sound when 🗿 appears" />
            <FormSwitch
                value={storage.enabled ?? true}
                onValueChange={handleToggle}
            />
            <FormDivider />
            <FormInput
                title="Sound URL"
                placeholder="https://example.com/sound.mp3"
                value={storage.soundUrl ?? ""}
                onChange={handleUrlChange}
            />
        </FormSection>
    );
};
