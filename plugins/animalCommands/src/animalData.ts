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
    displayName: "Dog",
    description: "Random dog photo",
    defaultApiId: "dog-ceo",
    apis: [
      {
        id: "dog-ceo",
        name: "Dog CEO",
        description: "dog.ceo API",
        endpoint: "https://dog.ceo/api/breeds/image/random",
        parse: (data) => ({ url: typeof data?.message === "string" ? data.message : null }),
      },
      {
        id: "random-dog",
        name: "Random Dog",
        description: "random.dog (filters non-images)",
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
    displayName: "Cat",
    description: "Random cat photo",
    defaultApiId: "thecatapi",
    apis: [
      {
        id: "thecatapi",
        name: "The Cat API",
        description: "thecatapi.com",
        endpoint: "https://api.thecatapi.com/v1/images/search",
        parse: (data) => ({ url: Array.isArray(data) && data[0]?.url ? data[0].url : null }),
      },
      {
        id: "cataas",
        name: "Cataas",
        description: "cataas.com",
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
    displayName: "Fox",
    description: "Random fox photo",
    defaultApiId: "randomfox",
    apis: [
      {
        id: "randomfox",
        name: "RandomFox",
        description: "randomfox.ca",
        endpoint: "https://randomfox.ca/floof/",
        parse: (data) => ({ url: typeof data?.image === "string" ? data.image : null }),
      },
      {
        id: "some-random-api",
        name: "Some Random API",
        description: "some-random-api.com (includes fact)",
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
    displayName: "Duck",
    description: "Random duck photo",
    defaultApiId: "random-duck-v2",
    apis: [
      {
        id: "random-duck-v2",
        name: "Random-d.uk v2",
        description: "random-d.uk v2 API",
        endpoint: "https://random-d.uk/api/v2/random",
        parse: (data) => ({ url: typeof data?.url === "string" ? data.url : null }),
      },
      {
        id: "random-duck-v1",
        name: "Random-d.uk v1",
        description: "random-d.uk v1 API",
        endpoint: "https://random-d.uk/api/random",
        parse: (data) => ({ url: typeof data?.url === "string" ? data.url : null }),
      },
    ],
  },
  {
    id: "animal-shiba",
    name: "shiba",
    displayName: "Shiba",
    description: "Random shiba photo",
    defaultApiId: "shibe-online",
    apis: [
      {
        id: "shibe-online",
        name: "Shibe.online",
        description: "shibe.online API",
        endpoint: "https://shibe.online/api/shibes?count=1&urls=true&httpsUrls=true",
        parse: (data) => ({ url: Array.isArray(data) && typeof data[0] === "string" ? data[0] : null }),
      },
      {
        id: "dog-ceo-shiba",
        name: "Dog CEO (Shiba)",
        description: "dog.ceo shiba endpoint",
        endpoint: "https://dog.ceo/api/breed/shiba/images/random",
        parse: (data) => ({ url: typeof data?.message === "string" ? data.message : null }),
      },
    ],
  },
  {
    id: "animal-horse",
    name: "horse",
    displayName: "Horse",
    description: "Random horse photo",
    defaultApiId: "animals-maxz-horse",
    apis: [
      {
        id: "animals-maxz-horse",
        name: "Animals Maxz",
        description: "animals.maxz.dev",
        endpoint: "https://animals.maxz.dev/api/horse/random",
        parse: parseAnimalsMaxz,
      },
    ],
  },
  {
    id: "animal-deer",
    name: "deer",
    displayName: "Deer",
    description: "Random deer photo",
    defaultApiId: "animals-maxz-deer",
    apis: [
      {
        id: "animals-maxz-deer",
        name: "Animals Maxz",
        description: "animals.maxz.dev",
        endpoint: "https://animals.maxz.dev/api/deer/random",
        parse: parseAnimalsMaxz,
      },
    ],
  },
  {
    id: "animal-otter",
    name: "otter",
    displayName: "Otter",
    description: "Random otter photo",
    defaultApiId: "tinyfox-otter",
    apis: [
      {
        id: "tinyfox-otter",
        name: "Tinyfox",
        description: "api.tinyfox.dev (ott)",
        endpoint: "https://api.tinyfox.dev/img.json?animal=ott",
        parse: parseTinyfox,
      },
    ],
  },
  {
    id: "animal-bird",
    name: "bird",
    displayName: "Bird",
    description: "Random bird photo",
    defaultApiId: "animals-maxz-bird",
    apis: [
      {
        id: "animals-maxz-bird",
        name: "Animals Maxz",
        description: "animals.maxz.dev",
        endpoint: "https://animals.maxz.dev/api/bird/random",
        parse: parseAnimalsMaxz,
      },
    ],
  },
  {
    id: "animal-turtle",
    name: "turtle",
    displayName: "Turtle",
    description: "Random turtle photo",
    defaultApiId: "animals-maxz-turtle",
    apis: [
      {
        id: "animals-maxz-turtle",
        name: "Animals Maxz",
        description: "animals.maxz.dev",
        endpoint: "https://animals.maxz.dev/api/turtle/random",
        parse: parseAnimalsMaxz,
      },
    ],
  },
  {
    id: "animal-sheep",
    name: "sheep",
    displayName: "Sheep",
    description: "Random sheep photo",
    defaultApiId: "animals-maxz-sheep",
    apis: [
      {
        id: "animals-maxz-sheep",
        name: "Animals Maxz",
        description: "animals.maxz.dev",
        endpoint: "https://animals.maxz.dev/api/sheep/random",
        parse: parseAnimalsMaxz,
      },
    ],
  },
  {
    id: "animal-capybara",
    name: "capybara",
    displayName: "Capybara",
    description: "Random capybara photo",
    defaultApiId: "capy-lol",
    apis: [
      {
        id: "capy-lol",
        name: "Capy.lol",
        description: "api.capy.lol",
        endpoint: "https://api.capy.lol/v1/capybara?json=true",
        parse: parseCapyLol,
      },
      {
        id: "animals-maxz-capybara",
        name: "Animals Maxz",
        description: "animals.maxz.dev",
        endpoint: "https://animals.maxz.dev/api/capybara/random",
        parse: parseAnimalsMaxz,
      },
    ],
  },
  {
    id: "animal-dinosaur",
    name: "dinosaur",
    displayName: "Dinosaur",
    description: "Secret dino — unlocked via hidden settings",
    defaultApiId: "commons-triceratops",
    isSecret: true,
    apis: [
      {
        id: "commons-triceratops",
        name: "Wikimedia Commons (CC0)",
        description: "A cool dino :3",
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
