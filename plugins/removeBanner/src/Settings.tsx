import { storage } from "@vendetta/plugin";
import { getAssetIDByName } from "@vendetta/metro";
import { Forms, General } from "@vendetta/ui/components";

const { ScrollView } = General;
const { FormLabel, FormRow, FormSwitch, FormDivider, FormSection, FormIcon } = Forms;

export default function Settings() {
  return (
    <ScrollView>
      <FormSection title="RemoveBanner" titleStyleType="no_border">
        <FormRow
          label="Remove server banners"
          subLabel="Hides banners from server list, header and popouts"
          leading={<FormIcon style={{ opacity: 0.8 }} source={getAssetIDByName("ic_image")} />}
          trailing={
            <FormSwitch
              value={storage.removeBanner}
              onValueChange={v => {
                storage.removeBanner = v;
                vendetta.plugin.reloadPlugin?.("RemoveBanner");
              }}
            />
          }
        />

        <FormDivider />

        <FormRow
          label="Also remove splash images"
          subLabel="Hides invite background and server discovery splash"
          leading={<FormIcon style={{ opacity: 0.8 }} source={getAssetIDByName("ic_invite")} />}
          trailing={
            <FormSwitch
              value={storage.removeSplash}
              onValueChange={v => {
                storage.removeSplash = v;
                vendetta.plugin.reloadPlugin?.("RemoveBanner");
              }}
            />
          }
        />

        <FormDivider />

        <FormRow
          label="Aggressive mode"
          subLabel="Removes banners from EVERY possible place (profiles, hovers, etc.)"
          leading={<FormIcon style={{ opacity: 0.8 }} source={getAssetIDByName("ic_warning")} />}
          trailing={
            <FormSwitch
              value={storage.aggressiveMode}
              onValueChange={v => {
                storage.aggressiveMode = v;
                vendetta.plugin.reloadPlugin?.("RemoveBanner");
              }}
            />
          }
        />
      </FormSection>
    </ScrollView>
  );
}