import { forms } from "@vendetta/ui/components";
import { useProxy } from "@vendetta/storage";
import { storage } from "@vendetta/plugin";
import { General } from "@vendetta/ui/assets";

const { FormSection, FormRow, FormInput } = forms;

export default () => {
    useProxy(storage);

    return (
        <FormSection title="Configuration">
            <FormInput
                title="Custom Splash Image URL"
                placeholder="https://example.com/image.png"
                value={storage.splashURL}
                onChange={(v: string) => (storage.splashURL = v)}
            />
        </FormSection>
    );
}
