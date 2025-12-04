import { React } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { Forms } from "@vendetta/ui/components";

const { FormRow, FormSwitch } = Forms;

export default () => {
  const [use25th, setUse25th] = React.useState(storage.christmasDay === 25);

  return (
    <>
      <FormRow
        label="Count towards the 25th instead of 24th"
        subLabel="Some countries celebrate Christmas on the 24th, others on the 25th."
      >
        <FormSwitch
          value={use25th}
          onValueChange={(v) => {
            setUse25th(v);
            storage.christmasDay = v ? 25 : 24;
          }}
        />
      </FormRow>
    </>
  );
};