import { Forms } from "@vendetta/ui/components";
import { useProxy } from "@vendetta/storage";
import { storage } from "@vendetta/plugin";
import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { React } from "@vendetta/metro/common";

const { FormSection, FormRow, FormInput, FormDivider } = Forms;
const Button = findByProps("Button", "ButtonColors", "ButtonSizes")?.Button;
const ImagePicker = findByProps("launchImageLibrary");

export default () => {
    useProxy(storage);
    const [url, setUrl] = React.useState(storage.splashURL || "");

    const handleSave = () => {
        storage.splashURL = url;
        showToast("Splash URL saved", getAssetIDByName("Check"));
    };

    const handlePickImage = async () => {
        if (!ImagePicker) {
            showToast("ImagePicker not found", getAssetIDByName("Small"));
            return;
        }

        try {
            ImagePicker.launchImageLibrary({
                mediaType: 'photo',
                includeBase64: false,
            }, (response) => {
                if (response.didCancel) return;
                if (response.errorCode) {
                    showToast("Error picking image", getAssetIDByName("Small"));
                    return;
                }
                if (response.assets && response.assets.length > 0) {
                    setUrl(response.assets[0].uri);
                }
            });
        } catch (e) {
            console.error(e);
            showToast("Failed to open picker", getAssetIDByName("Small"));
        }
    };

    return (
        <FormSection title="Configuration">
            <FormInput
                title="Custom Splash Image URL"
                placeholder="https://example.com/image.png"
                value={url}
                onChange={setUrl}
            />
            <FormDivider />
            <FormRow
                label="Select from Gallery"
                leading={<FormRow.Icon source={getAssetIDByName("ic_image")} />}
                onPress={handlePickImage}
            />
            <FormDivider />
            <FormRow
                label="Save"
                leading={<FormRow.Icon source={getAssetIDByName("ic_save")} />}
                onPress={handleSave}
            />
        </FormSection>
    );
}
