import type { MoodboardCategory } from "./constants";

/**
 * A curated starter library of free-to-use Unsplash photographs (Unsplash
 * License). Images are hot-linked from Unsplash's CDN, so nothing is stored
 * in the repository and no paid image API is needed.
 */

export type CuratedImage = {
  id: string;
  title: string;
  category: MoodboardCategory;
  tags: string[];
};

export function unsplashUrl(photoId: string, width = 900): string {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${width}&q=75`;
}

export const CURATED_IMAGES: CuratedImage[] = [
  {
    id: "1465495976277-4387d4b0b4c6",
    title: "Rings and peach roses",
    category: "theme",
    tags: ["engagement", "romantic", "blush"],
  },
  {
    id: "1597157639073-69284dc0fdaf",
    title: "Mehendi and bangles",
    category: "theme",
    tags: ["wedding", "traditional", "mehendi"],
  },
  {
    id: "1610173827002-62c0f1f05d04",
    title: "Family celebration",
    category: "theme",
    tags: ["wedding", "festive", "traditional"],
  },
  {
    id: "1519741497674-611481863552",
    title: "Golden-hour bouquet",
    category: "theme",
    tags: ["wedding", "moody", "elegant"],
  },
  {
    id: "1621621667797-e06afc217fb0",
    title: "Pampas and soft light",
    category: "theme",
    tags: ["boho", "engagement"],
  },
  {
    id: "1530103862676-de8c9debad1d",
    title: "Balloon canopy",
    category: "theme",
    tags: ["birthday", "playful"],
  },
  {
    id: "1513151233558-d860c5398176",
    title: "Confetti moment",
    category: "theme",
    tags: ["birthday", "party"],
  },

  {
    id: "1525258946800-98cfd641d0de",
    title: "Peach and ivory florals",
    category: "colors",
    tags: ["blush", "soft"],
  },
  {
    id: "1515934751635-c81c6bc9a2d8",
    title: "Blush peonies",
    category: "colors",
    tags: ["blush", "romantic"],
  },
  {
    id: "1490750967868-88aa4486c946",
    title: "Marigold orange",
    category: "colors",
    tags: ["festive", "bright"],
  },
  {
    id: "1508610048659-a06b669e3321",
    title: "Jewel-tone roses",
    category: "colors",
    tags: ["bold", "playful"],
  },

  {
    id: "1587271407850-8d438ca9fdf2",
    title: "Floral mandap",
    category: "decor",
    tags: ["wedding", "traditional", "royal"],
  },
  {
    id: "1469371670807-013ccf25f16a",
    title: "Garden aisle florals",
    category: "decor",
    tags: ["outdoor", "elegant"],
  },
  {
    id: "1511795409834-ef04bbd61622",
    title: "Candlelit centrepieces",
    category: "decor",
    tags: ["table", "warm"],
  },
  {
    id: "1519225421980-715cb0215aed",
    title: "Wildflower long table",
    category: "decor",
    tags: ["rustic", "table"],
  },
  {
    id: "1529636798458-92182e662485",
    title: "Draped floral arch",
    category: "decor",
    tags: ["outdoor", "boho"],
  },
  {
    id: "1522673607200-164d1b6ce486",
    title: "Lawn seating with florals",
    category: "decor",
    tags: ["outdoor", "intimate"],
  },
  {
    id: "1507504031003-b417219a0fde",
    title: "Hand-lettered signage",
    category: "decor",
    tags: ["rustic", "signage"],
  },

  {
    id: "1471107340929-a87cd0f5b5f3",
    title: "Handwritten notes",
    category: "invitations",
    tags: ["stationery", "minimal"],
  },
  {
    id: "1549465220-1a8b9238cd48",
    title: "Gold-ribbon invitation box",
    category: "invitations",
    tags: ["festive", "luxe"],
  },
  {
    id: "1607344645866-009c320b63e0",
    title: "Black and gold wraps",
    category: "invitations",
    tags: ["elegant", "favours"],
  },
  {
    id: "1513201099705-a9746e1e201f",
    title: "Kraft wrap with ribbon",
    category: "invitations",
    tags: ["rustic", "favours"],
  },

  {
    id: "1585937421612-70a008356fbe",
    title: "North Indian curries",
    category: "food",
    tags: ["indian", "dinner"],
  },
  {
    id: "1617692855027-33b14f061079",
    title: "Tandoor platter",
    category: "food",
    tags: ["indian", "live counter"],
  },
  { id: "1555244162-803834f70033", title: "Buffet service", category: "food", tags: ["catering", "buffet"] },
  {
    id: "1478145046317-39f10e56b5e9",
    title: "Grazing platter",
    category: "food",
    tags: ["cocktail", "boho"],
  },
  {
    id: "1414235077428-338989a2e8c0",
    title: "Plated dinner",
    category: "food",
    tags: ["fine dining", "elegant"],
  },
  {
    id: "1578985545062-69928b1d9587",
    title: "Celebration cake",
    category: "food",
    tags: ["dessert", "birthday"],
  },

  {
    id: "1599661046289-e31897846e41",
    title: "Hilltop fort",
    category: "venue",
    tags: ["heritage", "royal", "jaipur"],
  },
  {
    id: "1477587458883-47145ed94245",
    title: "Pink city facades",
    category: "venue",
    tags: ["heritage", "jaipur"],
  },
  {
    id: "1519167758481-83f550bb49b3",
    title: "Chandelier ballroom",
    category: "venue",
    tags: ["banquet", "elegant"],
  },
  {
    id: "1523438885200-e635ba2c371e",
    title: "Garden gazebo",
    category: "venue",
    tags: ["outdoor", "garden"],
  },
  {
    id: "1502635385003-ee1e6a1a742d",
    title: "White tent reception",
    category: "venue",
    tags: ["outdoor", "minimal"],
  },
  {
    id: "1530023367847-a683933f4172",
    title: "Beachside long table",
    category: "venue",
    tags: ["beach", "outdoor"],
  },
];

/** Images used on the marketing page. */
export const HERO_IMAGES = {
  primary: "1587271407850-8d438ca9fdf2",
  rings: "1465495976277-4387d4b0b4c6",
  table: "1511795409834-ef04bbd61622",
  balloons: "1530103862676-de8c9debad1d",
  food: "1585937421612-70a008356fbe",
  mehendi: "1597157639073-69284dc0fdaf",
} as const;

const SAFE_IMAGE_URL = /^https:\/\/[^\s"'<>]+$/i;

/** Only absolute https URLs without whitespace or quotes are accepted. */
export function isSafeImageUrl(url: string): boolean {
  if (!SAFE_IMAGE_URL.test(url) || url.length > 2000) return false;
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}
