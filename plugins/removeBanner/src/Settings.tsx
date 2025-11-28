import { useProxy } from "@vendetta/storage";
import { Forms, General } from "@vendetta/ui/components";
import { getAssetIDByName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";

const { ScrollView } = General;
const { FormRow, FormSwitch, FormDivider, FormSection, FormIcon, FormInput } = Forms;

const reload = () => vendetta.plugin.reloadPlugin?.("RemoveBanner");

const SettingsPanel = () => {
  useProxy(storage);
  return (
    <ScrollView>
      <FormSection title="RemoveBanner">
        <FormRow
          label="Remove server banners"
          subLabel="Hides banners from header, list and popouts"
          leading={<FormIcon style={{ opacity: 0.8 }} source={getAssetIDByName("ic_image")} />}
          trailing={<FormSwitch value={storage.removeBanner} onValueChange={v => { storage.removeBanner = v; reload(); }} />}
        />
        <FormDivider />
        <FormRow
          label="Also remove splash images"
          subLabel="Invite screen & discovery background"
          leading={<FormIcon style={{ opacity: 0.8 }} source={getAssetIDByName("ic_invite")} />}
          trailing={<FormSwitch value={storage.removeSplash} onValueChange={v => { storage.removeSplash = v; reload(); }} />}
        />
        <FormDivider />
        <FormRow
          label="Aggressive mode"
          subLabel="Nukes banners from absolutely everywhere"
          leading={<FormIcon style={{ opacity: 0.8 }} source={getAssetIDByName("ic_warning")} />}
          trailing={<FormSwitch value={storage.aggressiveMode} onValueChange={v => { storage.aggressiveMode = v; reload(); }} />}
        />
        <FormDivider />
        <FormRow
          label="Whitelisted servers"
          subLabel="Comma-separated guild IDs where banners/splashes should show"
        />
        <FormInput
          value={storage.whitelist.join(", ")}
          onChange={v => {
            storage.whitelist = v.split(",").map(s => s.trim()).filter(Boolean);
            reload();
          }}
          placeholder="e.g., 1234567890, 0987654321"
        />
      </FormSection>
    </ScrollView>
  );
};

export default SettingsPanel;