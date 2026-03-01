/**
 * South African cultural context layer
 *
 * Provides SA-specific hashtags, slang recognition, city references,
 * and local holiday awareness for the brand analysis engine.
 */

// ── SA Hashtags ─────────────────────────────────────────────────

/** Popular South African hashtags by category */
export const SA_HASHTAGS: Record<string, string[]> = {
  national: [
    "#Mzansi",
    "#ProudlySA",
    "#SouthAfrica",
    "#MadeinSA",
    "#LocalIsLekker",
    "#SABusiness",
    "#SupportLocal",
    "#BuyLocal",
    "#SAEntrepreneur",
    "#Ubuntu",
  ],
  johannesburg: [
    "#Joburg",
    "#Johannesburg",
    "#JoziLife",
    "#CityOfGold",
    "#Sandton",
    "#Soweto",
    "#Braamfontein",
    "#Maboneng",
    "#JHB",
  ],
  capeTown: [
    "#CapeTown",
    "#CPT",
    "#MotherCity",
    "#CapeTownLife",
    "#TableMountain",
    "#Waterfront",
    "#WineCountry",
    "#Camps Bay",
    "#Stellenbosch",
  ],
  durban: [
    "#Durban",
    "#DurbanLife",
    "#eThekwini",
    "#DurbanVibes",
    "#Umhlanga",
    "#KZN",
    "#KwaZuluNatal",
  ],
  pretoria: [
    "#Pretoria",
    "#Tshwane",
    "#Jacaranda",
    "#JacarandaCity",
    "#CenturionMall",
  ],
  food: [
    "#Braai",
    "#BraaiDay",
    "#BunnyChow",
    "#Biltong",
    "#Bobotie",
    "#SAFood",
    "#ShisaNyama",
    "#PapEnVleis",
    "#Potjiekos",
    "#Vetkoek",
  ],
  culture: [
    "#Ubuntu",
    "#RainbowNation",
    "#Heritage",
    "#SAculture",
    "#AfricanPride",
    "#Amapiano",
    "#Gqom",
    "#AfricanFashion",
  ],
};

/** Flatten all SA hashtags into a Set for quick lookups */
const ALL_SA_HASHTAGS = new Set(
  Object.values(SA_HASHTAGS).flat().map((h) => h.toLowerCase()),
);

// ── SA Slang Dictionary ─────────────────────────────────────────

/**
 * Common South African slang and colloquialisms.
 * Maps the word to its meaning for recognition purposes.
 */
export const SA_SLANG: Record<string, string> = {
  lekker: "nice/great/delicious",
  braai: "barbecue",
  ubuntu: "humanity towards others",
  eish: "exclamation of surprise",
  sharp: "okay/cool/goodbye",
  howzit: "how are you/hello",
  ja: "yes",
  nee: "no",
  bru: "bro/friend",
  boet: "brother/friend",
  china: "friend",
  yebo: "yes (Zulu)",
  sawubona: "hello (Zulu)",
  molo: "hello (Xhosa)",
  heita: "hello/hi",
  shisa: "hot/burning",
  nyama: "meat",
  mzansi: "South Africa",
  tsotsi: "gangster/thug",
  lank: "a lot/very",
  kiff: "cool/awesome",
  dop: "alcoholic drink",
  jol: "party/good time",
  robot: "traffic light",
  bakkie: "pickup truck",
  biltong: "dried cured meat",
  bunny: "bunny chow (curry in bread)",
  madiba: "Nelson Mandela",
  izit: "is it?/really?",
  voetsek: "go away",
  gatvol: "fed up",
  sarmie: "sandwich",
  takkies: "sneakers/trainers",
  just_now: "sometime soon",
  now_now: "very soon",
  ag: "oh/exclamation",
  shame: "expression of empathy",
  potjie: "cast iron pot/stew",
  vetkoek: "fried dough bread",
  bobotie: "SA curried mince dish",
  amandla: "power/strength",
  vuvuzela: "horn instrument",
};

const SA_SLANG_SET = new Set(
  Object.keys(SA_SLANG).map((w) => w.toLowerCase()),
);

// ── SA Cities ───────────────────────────────────────────────────

/** Major South African cities and areas for geographic context */
export const SA_CITIES = [
  "Johannesburg",
  "Cape Town",
  "Durban",
  "Pretoria",
  "Port Elizabeth",
  "Gqeberha",
  "Bloemfontein",
  "East London",
  "Polokwane",
  "Nelspruit",
  "Mbombela",
  "Kimberley",
  "Pietermaritzburg",
  "Rustenburg",
  "Centurion",
  "Sandton",
  "Soweto",
  "Stellenbosch",
  "Umhlanga",
  "Braamfontein",
] as const;

const SA_CITIES_LOWER = new Set(
  SA_CITIES.map((c) => c.toLowerCase()),
);

// ── SA Public Holidays ──────────────────────────────────────────

/** South African public holidays (month-day format) */
export interface SAHoliday {
  date: string; // "MM-DD"
  name: string;
  hashtags: string[];
}

export const SA_HOLIDAYS: SAHoliday[] = [
  {
    date: "01-01",
    name: "New Year's Day",
    hashtags: ["#NewYear", "#HappyNewYear", "#NewYearSA"],
  },
  {
    date: "03-21",
    name: "Human Rights Day",
    hashtags: ["#HumanRightsDay", "#HumanRightsSA", "#Sharpeville"],
  },
  {
    date: "04-27",
    name: "Freedom Day",
    hashtags: ["#FreedomDay", "#27April", "#FreedomDaySA"],
  },
  {
    date: "05-01",
    name: "Workers' Day",
    hashtags: ["#WorkersDay", "#MayDay", "#WorkersDaySA"],
  },
  {
    date: "06-16",
    name: "Youth Day",
    hashtags: ["#YouthDay", "#June16", "#YouthDaySA", "#Soweto1976"],
  },
  {
    date: "08-09",
    name: "National Women's Day",
    hashtags: ["#WomensDay", "#WomensDaySA", "#WomenOfSA"],
  },
  {
    date: "09-24",
    name: "Heritage Day",
    hashtags: [
      "#HeritageDay",
      "#BraaiDay",
      "#HeritageDaySA",
      "#CelebrateHeritage",
    ],
  },
  {
    date: "12-16",
    name: "Day of Reconciliation",
    hashtags: [
      "#ReconciliationDay",
      "#DayOfReconciliation",
      "#ReconciliationSA",
    ],
  },
  {
    date: "12-25",
    name: "Christmas Day",
    hashtags: ["#Christmas", "#MerryChristmas", "#ChristmasSA"],
  },
  {
    date: "12-26",
    name: "Day of Goodwill",
    hashtags: ["#DayOfGoodwill", "#BoxingDay"],
  },
];

// ── SA Language Codes ───────────────────────────────────────────

/** South Africa's 11 official languages */
export const SA_LANGUAGES: Record<string, string> = {
  en: "English",
  af: "Afrikaans",
  zu: "isiZulu",
  xh: "isiXhosa",
  nso: "Sepedi",
  tn: "Setswana",
  st: "Sesotho",
  ts: "Xitsonga",
  ss: "siSwati",
  ve: "Tshivenda",
  nr: "isiNdebele",
};

// ── Analysis Functions ──────────────────────────────────────────

/**
 * Check if a hashtag is a recognized SA hashtag.
 */
export function isSAHashtag(hashtag: string): boolean {
  const normalized = hashtag.startsWith("#")
    ? hashtag.toLowerCase()
    : `#${hashtag.toLowerCase()}`;
  return ALL_SA_HASHTAGS.has(normalized);
}

/**
 * Get the category of an SA hashtag, or null if not recognized.
 */
export function getSAHashtagCategory(hashtag: string): string | null {
  const normalized = hashtag.startsWith("#")
    ? hashtag.toLowerCase()
    : `#${hashtag.toLowerCase()}`;

  for (const [category, tags] of Object.entries(SA_HASHTAGS)) {
    if (tags.some((t) => t.toLowerCase() === normalized)) {
      return category;
    }
  }
  return null;
}

/**
 * Count how many SA slang words appear in a text.
 */
export function countSASlang(text: string): number {
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s_]/g, "")
    .split(/\s+/);

  return words.filter((w) => SA_SLANG_SET.has(w)).length;
}

/**
 * Find SA slang words present in a text.
 */
export function findSASlang(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s_]/g, "")
    .split(/\s+/);

  return [...new Set(words.filter((w) => SA_SLANG_SET.has(w)))];
}

/**
 * Check if a text mentions any SA city.
 */
export function mentionsSACity(text: string): boolean {
  const lower = text.toLowerCase();
  return SA_CITIES.some((city) => lower.includes(city.toLowerCase()));
}

/**
 * Find SA cities mentioned in a text.
 */
export function findSACities(text: string): string[] {
  const lower = text.toLowerCase();
  return SA_CITIES.filter((city) =>
    lower.includes(city.toLowerCase()),
  );
}

/**
 * Get upcoming SA holiday if within the next N days.
 */
export function getUpcomingSAHoliday(
  withinDays = 14,
  referenceDate?: Date,
): SAHoliday | null {
  const now = referenceDate ?? new Date();
  const year = now.getFullYear();

  for (const holiday of SA_HOLIDAYS) {
    const [month, day] = holiday.date.split("-").map(Number);
    const holidayDate = new Date(year, month - 1, day);

    const diffMs = holidayDate.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays >= 0 && diffDays <= withinDays) {
      return holiday;
    }
  }
  return null;
}

/**
 * Calculate SA cultural awareness score for a set of posts.
 *
 * Scores 0–1 based on presence of SA hashtags, slang, city references.
 */
export function calculateSACulturalScore(posts: Array<{
  content: string;
  hashtags: string[];
}>): number {
  if (posts.length === 0) return 0;

  let totalSignals = 0;
  const maxSignalsPerPost = 5; // Normalize so score doesn't inflate

  for (const post of posts) {
    let signals = 0;

    // SA hashtags (max 2 points)
    const saHashtagCount = post.hashtags.filter((h) => isSAHashtag(h)).length;
    signals += Math.min(saHashtagCount, 2);

    // SA slang (max 1 point)
    if (countSASlang(post.content) > 0) {
      signals += 1;
    }

    // SA city mention (max 1 point)
    if (mentionsSACity(post.content)) {
      signals += 1;
    }

    // SA language indicators (max 1 point)
    const saWords = findSASlang(post.content);
    if (saWords.length >= 2) {
      signals += 1;
    }

    totalSignals += Math.min(signals, maxSignalsPerPost);
  }

  // Average signals per post, normalized to 0–1
  const avgSignals = totalSignals / posts.length;
  return Math.min(avgSignals / maxSignalsPerPost, 1);
}

/**
 * Suggest SA hashtags based on post content and existing hashtags.
 */
export function suggestSAHashtags(
  content: string,
  existingHashtags: string[],
  maxSuggestions = 5,
): string[] {
  const suggestions: string[] = [];
  const existingLower = new Set(existingHashtags.map((h) => h.toLowerCase()));

  // Always suggest #Mzansi if not present
  if (!existingLower.has("#mzansi")) {
    suggestions.push("#Mzansi");
  }

  // Suggest city-specific hashtags based on content
  const cities = findSACities(content);
  for (const city of cities) {
    const cityKey = city.toLowerCase().replace(/\s+/g, "");
    const cityHashtags =
      SA_HASHTAGS[cityKey] ??
      SA_HASHTAGS[
        Object.keys(SA_HASHTAGS).find((k) =>
          k.toLowerCase().includes(cityKey),
        ) ?? ""
      ];

    if (cityHashtags) {
      for (const tag of cityHashtags) {
        if (!existingLower.has(tag.toLowerCase()) && suggestions.length < maxSuggestions) {
          suggestions.push(tag);
        }
      }
    }
  }

  // Suggest food hashtags if food-related slang is found
  const slang = findSASlang(content);
  const foodSlang = ["braai", "biltong", "bunny", "bobotie", "potjie", "vetkoek"];
  if (slang.some((s) => foodSlang.includes(s))) {
    for (const tag of SA_HASHTAGS.food) {
      if (!existingLower.has(tag.toLowerCase()) && suggestions.length < maxSuggestions) {
        suggestions.push(tag);
        break;
      }
    }
  }

  // Fill remaining slots with national hashtags
  for (const tag of SA_HASHTAGS.national) {
    if (!existingLower.has(tag.toLowerCase()) && suggestions.length < maxSuggestions) {
      suggestions.push(tag);
    }
  }

  return suggestions.slice(0, maxSuggestions);
}
