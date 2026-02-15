import { findByProps } from "@vendetta/metro";
import { React, ReactNative } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { Forms as UiForms } from "@vendetta/ui/components";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import {
  ensureApiDefaults,
  ensureCommandDefaults,
  getAvailableAnimals,
  getSelectedApi,
  isCommandEnabled,
} from "./animalData";
import Header from "./components/Header";
import BetterTableRowGroup from "./components/BetterTableRowGroup";

const { ScrollView, View, Text, Animated, Easing } = ReactNative;

const Forms =
  UiForms ||
  findByProps(
    "FormSection",
    "FormRow",
    "FormText",
    "FormRadioRow",
    "FormCheckRow"
  ) ||
  {};

const { FormRow, FormText, FormRadioRow, FormCheckRow } = Forms as any;
const ThemedText = FormText ?? Text;
const RadioRow = FormRadioRow ?? FormCheckRow ?? null;
const FormRowIcon = (FormRow as any)?.Icon;

const pickIcon = (...names: string[]) => {
  for (const name of names) {
    const id = getAssetIDByName(name);
    if (id) return id;
  }
  return undefined;
};

const imageIconId = pickIcon(
  "ic_image",
  "ic_image_24px",
  "ic_photo_24px",
  "ic_gallery_24px",
  "ic_add_photo_24px",
);
const arrowRightIconId = pickIcon(
  "ic_arrow_right",
  "ic_chevron_right_24px",
  "ic_arrow_forward_24px",
);
const backIconId = pickIcon(
  "back-icon",
  "ic_arrow_back_24px",
  "ic_chevron_left_24px",
);

const renderLeadingIcon = () => {
  if (!imageIconId) return undefined;
  if (FormRowIcon) return <FormRowIcon source={imageIconId} />;
  return (
    <ReactNative.Image
      source={imageIconId}
      style={{ width: 20, height: 20, tintColor: semanticColors.TEXT_MUTED }}
    />
  );
};

const renderTrailingArrow = () => {
  if (!arrowRightIconId) return undefined;
  if (FormRowIcon) return <FormRowIcon source={arrowRightIconId} />;
  return (
    <ReactNative.Image
      source={arrowRightIconId}
      style={{ width: 20, height: 20, tintColor: semanticColors.TEXT_MUTED }}
    />
  );
};

const renderBackIcon = () => {
  if (!backIconId) return undefined;
  if (FormRowIcon) return <FormRowIcon source={backIconId} />;
  return (
    <ReactNative.Image
      source={backIconId}
      style={{ width: 20, height: 20, tintColor: semanticColors.TEXT_MUTED }}
    />
  );
};

export default function Settings() {
  React.useEffect(() => {
    ensureApiDefaults(storage);
    ensureCommandDefaults(storage);
  }, []);

  const [selectedAnimalId, setSelectedAnimalId] = React.useState<string | null>(null);
  const [activeDetailId, setActiveDetailId] = React.useState<string | null>(null);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const scrollRef = React.useRef<any>(null);
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  const animals = getAvailableAnimals(storage);

  React.useEffect(() => {
    (globalThis as any).__animalCommandsRefreshSettings = () => {
      ensureApiDefaults(storage);
      ensureCommandDefaults(storage);
      forceUpdate();
      const reload = (globalThis as any).__animalCommandsReload;
      if (typeof reload === "function") reload();
    };

    return () => {
      try {
        delete (globalThis as any).__animalCommandsRefreshSettings;
      } catch {}
    };
  }, []);

  const setApiChoice = (animalId: string, apiId: string) => {
    storage.apiChoice = { ...(storage.apiChoice ?? {}), [animalId]: apiId };
    forceUpdate();
  };

  const setCommandEnabled = (animalId: string, value: boolean) => {
    storage.commandEnabled = { ...(storage.commandEnabled ?? {}), [animalId]: value };
    forceUpdate();
    const reload = (globalThis as any).__animalCommandsReload;
    if (typeof reload === "function") reload();
  };

  React.useEffect(() => {
    if (selectedAnimalId) {
      setActiveDetailId(selectedAnimalId);
    }

    Animated.timing(slideAnim, {
      toValue: selectedAnimalId ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !selectedAnimalId) {
        setActiveDetailId(null);
      }
    });
  }, [selectedAnimalId, slideAnim]);

  React.useEffect(() => {
    if (selectedAnimalId && !animals.some((animal) => animal.id === selectedAnimalId)) {
      setSelectedAnimalId(null);
    }
  }, [selectedAnimalId, animals]);

  React.useEffect(() => {
    try {
      scrollRef.current?.scrollTo?.({ y: 0, animated: false });
    } catch {

    }
  }, [selectedAnimalId]);

  if (!FormRow) {
    return (
      <View style={{ flex: 1, padding: 16, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 18, fontWeight: "600", textAlign: "center" }}>
          Failed to load native settings UI
        </Text>
        <Text style={{ marginTop: 6, fontSize: 15, textAlign: "center" }}>
          Update your Revenge/Vendetta build and try again.
        </Text>
      </View>
    );
  }

  const renderAnimalList = () => (
    <>
      <Header />

      <BetterTableRowGroup
        title="Animals"
        icon={pickIcon("SendMessageIcon", "ic_pets_24px", "ic_account_circle_24px")}
      >
        {animals.map((animal) => {
          const selectedApi = getSelectedApi(storage, animal);
          const enabled = isCommandEnabled(storage, animal);
          return (
            <FormRow
              key={animal.id}
              label={animal.displayName}
              subLabel={`API: ${selectedApi.name}`}
              leading={renderLeadingIcon()}
              trailing={
                <ReactNative.View style={{ flexDirection: "row", alignItems: "center" }}>
                  <ReactNative.Switch
                    value={enabled}
                    onValueChange={(value) => setCommandEnabled(animal.id, value)}
                  />
                  <ReactNative.View style={{ marginLeft: 6 }}>
                    {renderTrailingArrow()}
                  </ReactNative.View>
                </ReactNative.View>
              }
              onPress={() => setSelectedAnimalId(animal.id)}
            />
          );
        })}
      </BetterTableRowGroup>

      <BetterTableRowGroup
        title="Note"
        icon={pickIcon("ic_info_24px", "SettingsIcon")}
        padding
      >
        <ThemedText>
          Found a bug or want an animal added? DM "@vaiskiainen."
        </ThemedText>
      </BetterTableRowGroup>
    </>
  );

  const renderAnimalDetail = () => {
    const detailId = activeDetailId ?? selectedAnimalId;
    const animal = animals.find((a) => a.id === detailId);
    if (!animal) return null;

    const selectedApiId = storage.apiChoice?.[animal.id] ?? animal.defaultApiId;

    return (
      <>
        <BetterTableRowGroup
          title={animal.displayName}
          icon={pickIcon("ic_pets_24px", "ic_account_circle_24px")}
          padding
        >
          {animal.description ? <ThemedText>{animal.description}</ThemedText> : null}
        </BetterTableRowGroup>

        <BetterTableRowGroup
          title="Choose API"
          icon={pickIcon("SettingsIcon", "ic_settings_24px")}
        >
          {animal.apis.map((api) => {
            const isSelected = api.id === selectedApiId;

            if (RadioRow) {
              return (
                <RadioRow
                  key={api.id}
                  label={api.name}
                  subLabel={api.description}
                  selected={isSelected}
                  leading={renderLeadingIcon()}
                  onPress={() => setApiChoice(animal.id, api.id)}
                />
              );
            }

            const subLabel = isSelected
              ? `Selected · ${api.description}`
              : api.description;

            return (
              <FormRow
                key={api.id}
                label={api.name}
                subLabel={subLabel}
                leading={renderLeadingIcon()}
                onPress={() => setApiChoice(animal.id, api.id)}
              />
            );
          })}
        </BetterTableRowGroup>

        <BetterTableRowGroup
          title="Navigation"
          icon={pickIcon("ic_keyboard_arrow_left_24px", "XIcon")}
        >
          <FormRow
            label="Back to animals"
            leading={renderBackIcon()}
            onPress={() => setSelectedAnimalId(null)}
          />
        </BetterTableRowGroup>
      </>
    );
  };

  const translateX =
    containerWidth > 0
      ? slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -containerWidth],
        })
      : 0;

  return (
    <View
      style={{ flex: 1 }}
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
    >
      <ScrollView ref={scrollRef} style={{ flex: 1 }} scrollEnabled>
        <Animated.View
          style={{
            flexDirection: "row",
            width: containerWidth > 0 ? containerWidth * 2 : "200%",
            transform: [{ translateX }],
          }}
        >
          <View
            style={{ width: containerWidth || "100%" }}
            pointerEvents={selectedAnimalId ? "none" : "auto"}
          >
            {renderAnimalList()}
          </View>
          <View
            style={{ width: containerWidth || "100%" }}
            pointerEvents={selectedAnimalId ? "auto" : "none"}
          >
            {renderAnimalDetail()}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
