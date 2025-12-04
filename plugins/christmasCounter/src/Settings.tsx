import React from "@vendetta/metro/common/react";
import { storage } from "@vendetta/plugin";
import { Forms } from "@vendetta/ui/components";

const { FormRow, FormSwitch } = Forms;

export default () => {
  const [use25th, setUse25th] = React.useState(storage.christmasDay === 25);

  return (
    <>
      <FormRow
        label="Count towards the 25th"
        subLabel="Enable to count Christmas as December 25 instead of 24."
        trailing={
          <FormSwitch
            value={use25th}
            onValueChange={(v) => {
              setUse25th(v);
              storage.christmasDay = v ? 25 : 24;
            }}
          />
        }
        onPress={() => {
          const newValue = !use25th;
          setUse25th(newValue);
          storage.christmasDay = newValue ? 25 : 24;
        }}
      />
    </>
  );
};
