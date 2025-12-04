import { React } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { Forms } from "@vendetta/ui/components";

const { FormSwitchRow } = Forms;

export default function Settings() {
  const [use25th, setUse25th] = React.useState(storage.christmasDay === 25);

  return (
    <>
      <FormSwitchRow
        label="Count towards December 25"
        subLabel="Disable to count towards December 24 instead."
        value={use25th}
        onValueChange={(v: boolean) => {
          setUse25th(v);
          storage.christmasDay = v ? 25 : 24;
        }}
      />
    </>
  );
}