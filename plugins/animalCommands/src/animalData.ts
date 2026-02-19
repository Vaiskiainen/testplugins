/*
  Configuration and data for animal commands.

  Some of this code is vibe coded. (😱)
*/

export type AnimalResult = {
  url: string | null;
  caption?: string | null;
};

export type ApiOption = {
  id: string;
  name: string;
  description: string;
  endpoint?: string;
  parse?: (data: any) => AnimalResult;
  directUrl?: string;
  cacheBust?: boolean;
  resolveFinalUrl?: boolean;
};

export type AnimalConfig = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  apis: ApiOption[];
  defaultApiId: string;
  isSecret?: boolean;
};

const isImageUrl = (value: string | undefined | null) => {
  if (!value) return false;
  return /\.(png|jpe?g|gif|webp|bmp|tiff|avif)$/i.test(value);
};

const parseAnimalsMaxz = (data: any): AnimalResult => {
  const url =
    typeof data?.image === "string"
      ? data.image
      : typeof data?.url === "string"
        ? data.url
        : null;
  return { url };
};

const parseTinyfox = (data: any): AnimalResult => {
  const url =
    typeof data?.url === "string"
      ? data.url
      : typeof data?.image === "string"
        ? data.image
        : typeof data?.link === "string"
          ? data.link
          : null;
  return { url };
};

const parseCapyLol = (data: any): AnimalResult => {
  const url =
    typeof data?.url === "string"
      ? data.url
      : typeof data?.image === "string"
        ? data.image
        : typeof data?.link === "string"
          ? data.link
          : null;
  return { url };
};

export const ANIMALS: AnimalConfig[] = [
  {
    id: "animal-dog",
    name: "dog",
    displayName: "commands.dog.name",
    description: "commands.dog.description",
    defaultApiId: "dog-ceo",
    apis: [
      {
        id: "dog-ceo",
        name: "apis.dog-ceo.name",
        description: "apis.dog-ceo.description",
        endpoint: "https://dog.ceo/api/breeds/image/random",
        parse: (data) => ({ url: typeof data?.message === "string" ? data.message : null }),
      },
      {
        id: "random-dog",
        name: "apis.random-dog.name",
        description: "apis.random-dog.description",
        endpoint: "https://random.dog/woof.json",
        parse: (data) => {
          const url = typeof data?.url === "string" ? data.url : null;
          return { url: isImageUrl(url) ? url : null };
        },
      },
    ],
  },
  {
    id: "animal-cat",
    name: "cat",
    displayName: "commands.cat.name",
    description: "commands.cat.description",
    defaultApiId: "thecatapi",
    apis: [
      {
        id: "thecatapi",
        name: "apis.thecatapi.name",
        description: "apis.thecatapi.description",
        endpoint: "https://api.thecatapi.com/v1/images/search",
        parse: (data) => ({ url: Array.isArray(data) && data[0]?.url ? data[0].url : null }),
      },
      {
        id: "cataas",
        name: "apis.cataas.name",
        description: "apis.cataas.description",
        endpoint: "https://cataas.com/cat?json=true",
        parse: (data) => {
          const raw = typeof data?.url === "string" ? data.url : null;
          if (!raw) return { url: null };
          const url = raw.startsWith("http") ? raw : `https://cataas.com${raw}`;
          return { url };
        },
      },
    ],
  },
  {
    id: "animal-fox",
    name: "fox",
    displayName: "commands.fox.name",
    description: "commands.fox.description",
    defaultApiId: "randomfox",
    apis: [
      {
        id: "randomfox",
        name: "apis.randomfox.name",
        description: "apis.randomfox.description",
        endpoint: "https://randomfox.ca/floof/",
        parse: (data) => ({ url: typeof data?.image === "string" ? data.image : null }),
      },
      {
        id: "some-random-api",
        name: "apis.some-random-api.name",
        description: "apis.some-random-api.description",
        endpoint: "https://some-random-api.com/animal/fox",
        parse: (data) => ({
          url: typeof data?.image === "string" ? data.image : null,
          caption: typeof data?.fact === "string" ? data.fact : null,
        }),
      },
    ],
  },
  {
    id: "animal-duck",
    name: "duck",
    displayName: "commands.duck.name",
    description: "commands.duck.description",
    defaultApiId: "random-duck-v2",
    apis: [
      {
        id: "random-duck-v2",
        name: "apis.random-duck-v2.name",
        description: "apis.random-duck-v2.description",
        endpoint: "https://random-d.uk/api/v2/random",
        parse: (data) => ({ url: typeof data?.url === "string" ? data.url : null }),
      },
      {
        id: "random-duck-v1",
        name: "apis.random-duck-v1.name",
        description: "apis.random-duck-v1.description",
        endpoint: "https://random-d.uk/api/random",
        parse: (data) => ({ url: typeof data?.url === "string" ? data.url : null }),
      },
    ],
  },
  {
    id: "animal-shiba",
    name: "shiba",
    displayName: "commands.shiba.name",
    description: "commands.shiba.description",
    defaultApiId: "shibe-online",
    apis: [
      {
        id: "shibe-online",
        name: "apis.shibe-online.name",
        description: "apis.shibe-online.description",
        endpoint: "https://shibe.online/api/shibes?count=1&urls=true&httpsUrls=true",
        parse: (data) => ({ url: Array.isArray(data) && typeof data[0] === "string" ? data[0] : null }),
      },
      {
        id: "dog-ceo-shiba",
        name: "apis.dog-ceo-shiba.name",
        description: "apis.dog-ceo-shiba.description",
        endpoint: "https://dog.ceo/api/breed/shiba/images/random",
        parse: (data) => ({ url: typeof data?.message === "string" ? data.message : null }),
      },
    ],
  },
  {
    id: "animal-horse",
    name: "horse",
    displayName: "commands.horse.name",
    description: "commands.horse.description",
    defaultApiId: "animals-maxz-horse",
    apis: [
      {
        id: "animals-maxz-horse",
        name: "apis.animals-maxz.name",
        description: "apis.animals-maxz.description",
        endpoint: "https://animals.maxz.dev/api/horse/random",
        parse: parseAnimalsMaxz,
      },
    ],
  },
  {
    id: "animal-deer",
    name: "deer",
    displayName: "commands.deer.name",
    description: "commands.deer.description",
    defaultApiId: "animals-maxz-deer",
    apis: [
      {
        id: "animals-maxz-deer",
        name: "apis.animals-maxz.name",
        description: "apis.animals-maxz.description",
        endpoint: "https://animals.maxz.dev/api/deer/random",
        parse: parseAnimalsMaxz,
      },
    ],
  },
  {
    id: "animal-otter",
    name: "otter",
    displayName: "commands.otter.name",
    description: "commands.otter.description",
    defaultApiId: "tinyfox-otter",
    apis: [
      {
        id: "tinyfox-otter",
        name: "apis.tinyfox.name",
        description: "apis.tinyfox.description",
        endpoint: "https://api.tinyfox.dev/img.json?animal=ott",
        parse: parseTinyfox,
      },
    ],
  },
  {
    id: "animal-bird",
    name: "bird",
    displayName: "commands.bird.name",
    description: "commands.bird.description",
    defaultApiId: "animals-maxz-bird",
    apis: [
      {
        id: "animals-maxz-bird",
        name: "apis.animals-maxz.name",
        description: "apis.animals-maxz.description",
        endpoint: "https://animals.maxz.dev/api/bird/random",
        parse: parseAnimalsMaxz,
      },
    ],
  },
  {
    id: "animal-turtle",
    name: "turtle",
    displayName: "commands.turtle.name",
    description: "commands.turtle.description",
    defaultApiId: "animals-maxz-turtle",
    apis: [
      {
        id: "animals-maxz-turtle",
        name: "apis.animals-maxz.name",
        description: "apis.animals-maxz.description",
        endpoint: "https://animals.maxz.dev/api/turtle/random",
        parse: parseAnimalsMaxz,
      },
    ],
  },
  {
    id: "animal-sheep",
    name: "sheep",
    displayName: "commands.sheep.name",
    description: "commands.sheep.description",
    defaultApiId: "animals-maxz-sheep",
    apis: [
      {
        id: "animals-maxz-sheep",
        name: "apis.animals-maxz.name",
        description: "apis.animals-maxz.description",
        endpoint: "https://animals.maxz.dev/api/sheep/random",
        parse: parseAnimalsMaxz,
      },
    ],
  },
  {
    id: "animal-capybara",
    name: "capybara",
    displayName: "commands.capybara.name",
    description: "commands.capybara.description",
    defaultApiId: "capy-lol",
    apis: [
      {
        id: "capy-lol",
        name: "apis.capy-lol.name",
        description: "apis.capy-lol.description",
        endpoint: "https://api.capy.lol/v1/capybara?json=true",
        parse: parseCapyLol,
      },
      {
        id: "animals-maxz-capybara",
        name: "apis.animals-maxz.name",
        description: "apis.animals-maxz.description",
        endpoint: "https://animals.maxz.dev/api/capybara/random",
        parse: parseAnimalsMaxz,
      },
    ],
  },
  {
    id: "animal-dinosaur",
    name: "dinosaur",
    displayName: "commands.dinosaur.name",
    description: "commands.dinosaur.description",
    defaultApiId: "commons-triceratops",
    isSecret: true,
    apis: [
      {
        id: "commons-triceratops",
        name: "apis.commons-triceratops.name",
        description: "apis.commons-triceratops.description",
        directUrl:
          "https://static01.nyt.com/images/2025/06/09/multimedia/09HS-tb-dinosaur-01-fvzp/09HS-tb-dinosaur-01-fvzp-videoSixteenByNine3000.jpg",
      },
    ],
  },
];

export const isSecretUnlocked = (store: any): boolean => {
  const hidden = store?.hiddenSettings;
  return Boolean(hidden?.enabled) && hidden?.visible !== false;
};

export const getAvailableAnimals = (store: any): AnimalConfig[] =>
  ANIMALS.filter((animal) => !animal.isSecret || isSecretUnlocked(store));

export const ensureApiDefaults = (store: any) => {
  store.apiChoice ??= {};
  for (const animal of getAvailableAnimals(store)) {
    const current = store.apiChoice[animal.id];
    const valid = animal.apis.some((api) => api.id === current);
    if (!valid) {
      store.apiChoice[animal.id] = animal.defaultApiId || animal.apis[0]?.id;
    }
  }
};

export const ensureCommandDefaults = (store: any) => {
  store.commandEnabled ??= {};
  for (const animal of getAvailableAnimals(store)) {
    if (typeof store.commandEnabled[animal.id] !== "boolean") {
      store.commandEnabled[animal.id] = true;
    }
  }
};

export const isCommandEnabled = (store: any, animal: AnimalConfig): boolean => {
  const value = store?.commandEnabled?.[animal.id];
  return value !== false;
};

export const getSelectedApi = (store: any, animal: AnimalConfig): ApiOption => {
  const choice = store?.apiChoice?.[animal.id];
  return animal.apis.find((api) => api.id === choice) || animal.apis[0];
};
