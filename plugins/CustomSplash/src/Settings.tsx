import { Forms } from "@vendetta/ui/components";
import { useProxy } from "@vendetta/storage";
import { storage } from "@vendetta/plugin";

const { FormSection, FormRow, FormInput } = Forms;

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
