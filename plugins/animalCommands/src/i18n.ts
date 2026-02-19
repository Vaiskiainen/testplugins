import { i18n } from "@vendetta/metro/common";
import en from "../lang/en.json";


const translations: Record<string, any> = {
    en,
};

export const getTranslation = (path: string, placeholders?: Record<string, string>): string => {
    const locale = (typeof i18n?.getLocale === "function" ? i18n.getLocale() : "en-US") || "en-US";
    const lang = locale.replace("_", "-").split("-")[0].toLowerCase();

    const getFromDict = (dict: any) => {
        if (!dict) return undefined;
        const actualDict = dict.default || dict;
        return path.split(".").reduce((obj, key) => obj?.[key], actualDict);
    };

    let value = getFromDict(translations[lang]);

    if (typeof value !== "string" && lang !== "en") {
        value = getFromDict(translations["en"]);
    }

    if (typeof value !== "string") {
        return path;
    }

    return replacePlaceholders(value, placeholders);
};

const replacePlaceholders = (text: string, placeholders?: Record<string, string>): string => {
    if (!placeholders) return text;
    let result = text;
    for (const [key, value] of Object.entries(placeholders)) {
        result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
    }
    return result;
};

export default {
    t: getTranslation,
};
