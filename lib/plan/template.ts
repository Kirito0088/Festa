import type { Blueprint } from "../ai/blueprint";
import {
  CATEGORY_LABELS,
  EVENT_TYPE_LABELS,
  type Category,
  type EventType,
  type Priority,
} from "../constants";

/** Everything the planners (AI or template) know about a celebration. */
export type PlanInput = {
  type: EventType;
  name: string;
  date: string;
  city: string;
  venue: string;
  guestCount: number;
  budget: number;
  currency: string;
  styles: string[];
  atmosphere: string;
  foodPreferences: string[];
  activities: string[];
  notes: string;
};

/**
 * Festa's built-in planner. It produces a complete blueprint from rules alone,
 * so planning keeps working when the AI provider is unavailable or rate
 * limited. Output has the same shape as the AI blueprint.
 */

const BUDGET_SHARES: Record<EventType, Partial<Record<Category, number>>> = {
  wedding: {
    venue: 21,
    catering: 29,
    decor: 12,
    photography: 9,
    attire: 9,
    entertainment: 5,
    invitations: 2,
    rituals: 4,
    logistics: 2,
    guests: 2,
    other: 5,
  },
  engagement: {
    venue: 21,
    catering: 33,
    decor: 14,
    photography: 10,
    attire: 7,
    entertainment: 7,
    invitations: 2,
    other: 6,
  },
  birthday: {
    venue: 20,
    catering: 34,
    decor: 14,
    entertainment: 12,
    photography: 6,
    invitations: 2,
    guests: 6,
    other: 6,
  },
  anniversary: { venue: 25, catering: 36, decor: 12, entertainment: 10, photography: 8, guests: 3, other: 6 },
  "baby-shower": {
    venue: 15,
    catering: 38,
    decor: 20,
    entertainment: 8,
    photography: 7,
    invitations: 3,
    guests: 4,
    other: 5,
  },
  community: {
    venue: 24,
    catering: 30,
    decor: 8,
    entertainment: 15,
    logistics: 10,
    invitations: 4,
    guests: 3,
    other: 6,
  },
  corporate: {
    venue: 27,
    catering: 31,
    decor: 8,
    entertainment: 12,
    photography: 6,
    logistics: 8,
    guests: 3,
    other: 5,
  },
  other: { venue: 25, catering: 34, decor: 12, entertainment: 10, photography: 8, guests: 4, other: 7 },
};

const BUDGET_LABELS: Record<Category, string> = {
  venue: "Venue hire",
  catering: "Catering",
  decor: "Decor, florals & lighting",
  photography: "Photography & video",
  entertainment: "Music & entertainment",
  attire: "Outfits, styling & beauty",
  invitations: "Invitations & stationery",
  guests: "Guest hospitality & favours",
  logistics: "Transport & logistics",
  rituals: "Ceremony & rituals",
  other: "Contingency buffer",
};

const BUDGET_NOTES: Partial<Record<Category, string>> = {
  venue: "Ask what the hire includes: furniture, power backup, parking and cleaning.",
  catering: "Usually priced per plate. Confirm the minimum guarantee and taxes.",
  decor: "Lighting changes a room more than florals at the same cost.",
  photography: "Compare deliverables: edited photos, film length and turnaround.",
  other: "Keep this untouched until the final week for surprises.",
};

const VENDOR_LEAD_DAYS: Partial<Record<Category, number>> = {
  venue: 75,
  catering: 60,
  photography: 60,
  attire: 60,
  decor: 45,
  entertainment: 40,
  invitations: 35,
  rituals: 30,
  logistics: 21,
};

const VENDOR_WHY: Partial<Record<Category, string>> = {
  venue: "Every other booking depends on the date and space being locked.",
  catering: "Good caterers book out early in the season; menus need tastings.",
  photography: "Popular photographers are booked months ahead.",
  attire: "Custom outfits and fittings take several weeks.",
  decor: "Decor needs the venue layout before it can be quoted.",
  entertainment: "Performers and DJs plan their calendars around season dates.",
  invitations: "Printing and delivery take two to three weeks.",
  rituals: "Officiants and ritual items need advance confirmation.",
  logistics: "Transport for guests and family needs a final headcount.",
};

type TaskSeed = [title: string, category: Category, priority: Priority, daysBefore: number, note?: string];

const COMMON_TASKS: TaskSeed[] = [
  [
    "Agree the budget and three must-haves",
    "other",
    "high",
    120,
    "Decide what matters most before spending anything.",
  ],
  ["Draft the guest list", "guests", "high", 100],
  ["Shortlist and visit venues", "venue", "high", 90],
  ["Book the venue", "venue", "high", 75, "Get the cancellation and refund terms in writing."],
  ["Book the caterer and schedule a tasting", "catering", "high", 60],
  ["Finalise the decor concept with a decorator", "decor", "medium", 45],
  ["Book music and entertainment", "entertainment", "medium", 40],
  ["Send invitations", "invitations", "high", 30],
  ["Collect RSVPs and confirm the headcount", "guests", "high", 14],
  ["Confirm timings with every vendor", "logistics", "high", 7],
  ["Pay balances and prepare vendor tips", "other", "medium", 3],
  ["Share the day-of timeline and pack an emergency kit", "logistics", "medium", 2],
];

const TYPE_TASKS: Record<EventType, TaskSeed[]> = {
  wedding: [
    ["Book the photographer and videographer", "photography", "high", 75],
    ["Shop for wedding outfits and book fittings", "attire", "high", 90],
    ["Book makeup and mehendi artists", "attire", "medium", 60],
    ["Arrange stays for outstation guests", "guests", "medium", 45],
    ["Confirm the officiant and ritual items", "rituals", "high", 30],
  ],
  engagement: [
    ["Book the photographer", "photography", "high", 60],
    ["Choose and size the rings", "attire", "high", 45],
    ["Plan the couple's entry", "entertainment", "low", 14],
  ],
  birthday: [
    ["Order the cake", "catering", "medium", 10],
    ["Plan games and return gifts", "guests", "medium", 14],
  ],
  anniversary: [
    ["Collect photos for a slideshow", "entertainment", "low", 21],
    ["Book the photographer", "photography", "medium", 45],
  ],
  "baby-shower": [
    ["Plan games and keepsakes", "entertainment", "medium", 14],
    ["Arrange comfortable seating for the parents-to-be", "venue", "medium", 10],
  ],
  community: [
    ["Get permissions and permits", "logistics", "high", 45],
    ["Recruit and brief volunteers", "guests", "medium", 30],
  ],
  corporate: [
    ["Confirm the run-of-show and speakers", "entertainment", "high", 21],
    ["Arrange AV equipment and a tech check", "logistics", "medium", 21],
  ],
  other: [["Book the photographer", "photography", "medium", 45]],
};

const STYLE_THEMES: Record<string, { theme: string; palette: Array<[string, string]>; decor: string[] }> = {
  elegant: {
    theme: "Ivory and gold soirée",
    palette: [
      ["Ivory", "#F8F6F1"],
      ["Champagne", "#E8D9B5"],
      ["Antique gold", "#B8975A"],
      ["Sage", "#A7B5A0"],
      ["Charcoal", "#20211F"],
    ],
    decor: [
      "Tall taper candles on mirrored runners",
      "White florals with soft greenery",
      "Gold-rimmed tableware and linen napkins",
    ],
  },
  minimal: {
    theme: "Quiet modern",
    palette: [
      ["Warm white", "#FAF8F4"],
      ["Stone", "#D8D2C6"],
      ["Sage", "#A7B5A0"],
      ["Graphite", "#3A3B38"],
      ["Charcoal", "#20211F"],
    ],
    decor: [
      "Single-stem arrangements in clear glass",
      "Linen tablecloths with clean place cards",
      "Warm, low lighting with no clutter",
    ],
  },
  traditional: {
    theme: "Heritage festive",
    palette: [
      ["Marigold", "#E9A23B"],
      ["Vermilion", "#C2452D"],
      ["Leaf green", "#5E7458"],
      ["Brass", "#B08D57"],
      ["Ivory", "#F8F6F1"],
    ],
    decor: ["Marigold and mango-leaf torans", "Brass urlis with floating flowers", "Rangoli at the entrance"],
  },
  modern: {
    theme: "Contemporary chic",
    palette: [
      ["Blush", "#E9C7C3"],
      ["Sand", "#D9C8AD"],
      ["Terracotta", "#B5654A"],
      ["Ink", "#2B2D2A"],
      ["Ivory", "#F8F6F1"],
    ],
    decor: [
      "Geometric arches with draped fabric",
      "Monochrome florals in sculptural vases",
      "Neon or light-box signage with your names",
    ],
  },
  boho: {
    theme: "Garden boho",
    palette: [
      ["Dusty rose", "#D9A9A0"],
      ["Pampas", "#E6D8C3"],
      ["Olive", "#7C8461"],
      ["Rust", "#A65E3B"],
      ["Cream", "#F6F0E6"],
    ],
    decor: [
      "Pampas grass and dried florals",
      "Low floor seating with rugs and cushions",
      "Macramé backdrops and fairy lights",
    ],
  },
  rustic: {
    theme: "Rustic warmth",
    palette: [
      ["Oak", "#A07850"],
      ["Linen", "#EDE4D3"],
      ["Moss", "#6F7D5C"],
      ["Clay", "#B9714F"],
      ["Cream", "#F7F1E6"],
    ],
    decor: ["Wooden crates and lanterns", "Jute runners with wildflowers", "String lights overhead"],
  },
  festive: {
    theme: "Marigold festive",
    palette: [
      ["Saffron", "#F0A030"],
      ["Rani pink", "#C8336E"],
      ["Emerald", "#2F7A5A"],
      ["Gold", "#C9A24D"],
      ["Ivory", "#F8F6F1"],
    ],
    decor: [
      "Colourful drapes and tassels",
      "Marigold strings across the ceiling",
      "Lanterns and diyas along the walkways",
    ],
  },
  royal: {
    theme: "Royal heritage",
    palette: [
      ["Maroon", "#7A2430"],
      ["Royal gold", "#C29B4A"],
      ["Ivory", "#F5EFE3"],
      ["Emerald", "#245E4A"],
      ["Midnight", "#1F2433"],
    ],
    decor: [
      "Velvet seating and brocade drapes",
      "Chandeliers or crystal lighting",
      "Floral mandaps or stage with arches",
    ],
  },
  intimate: {
    theme: "Candlelit intimate",
    palette: [
      ["Candle", "#F4E7CF"],
      ["Blush", "#E9C7C3"],
      ["Sage", "#A7B5A0"],
      ["Walnut", "#6B4E3D"],
      ["Charcoal", "#20211F"],
    ],
    decor: ["One long shared table", "Clusters of candles at varied heights", "Handwritten place cards"],
  },
  playful: {
    theme: "Colour pop",
    palette: [
      ["Sunshine", "#F2C14E"],
      ["Coral", "#EE7B6A"],
      ["Mint", "#9CCFB6"],
      ["Sky", "#7FB2D9"],
      ["Cream", "#FBF6EC"],
    ],
    decor: [
      "Balloon garlands in your palette",
      "A photo wall with props",
      "Bright, mismatched table florals",
    ],
  },
};

const ATMOSPHERE_TAGLINES: Array<[RegExp, string]> = [
  [/(calm|relax|intimate|cozy|cosy|warm)/i, "Unhurried, warm and close."],
  [/(grand|lavish|royal|luxur)/i, "Big moments, beautifully held."],
  [/(fun|party|lively|energ|dance)/i, "Full of music, colour and good energy."],
  [/(tradition|cultur|heritage)/i, "Rooted in tradition, made personal."],
];

const OUTDOOR = /(garden|lawn|beach|outdoor|terrace|farm|open)/i;

function articleFor(word: string): string {
  return /^[aeiou]/i.test(word) ? "An" : "A";
}

function pickStyle(styles: string[]) {
  for (const style of styles) {
    const theme = STYLE_THEMES[style.toLowerCase()];
    if (theme) return { name: style, ...theme };
  }
  return { name: "Elegant", ...STYLE_THEMES.elegant };
}

export function templateBlueprint(input: PlanInput): Blueprint {
  const typeLabel = EVENT_TYPE_LABELS[input.type];
  const style = pickStyle(input.styles);
  const city = input.city.trim();
  const venue = input.venue.trim();
  const isOutdoor = OUTDOOR.test(venue) || OUTDOOR.test(input.notes);
  const tagline =
    ATMOSPHERE_TAGLINES.find(([pattern]) => pattern.test(input.atmosphere))?.[1] ??
    "Thoughtfully planned, easy to enjoy.";

  const shares = BUDGET_SHARES[input.type];
  const budget = (Object.entries(shares) as Array<[Category, number]>).map(([category, percent]) => ({
    category,
    label: category === "catering" ? `Catering for ${input.guestCount} guests` : BUDGET_LABELS[category],
    percent,
    note: BUDGET_NOTES[category] ?? "",
  }));

  const seeds: TaskSeed[] = [...COMMON_TASKS, ...TYPE_TASKS[input.type]];
  if (input.foodPreferences.length > 0) {
    seeds.push([
      `Brief the caterer on dietary needs: ${input.foodPreferences.slice(0, 4).join(", ")}`,
      "catering",
      "high",
      21,
    ]);
  }
  for (const activity of input.activities.slice(0, 6)) {
    seeds.push([`Plan the ${activity.toLowerCase()}`, "entertainment", "medium", 21]);
  }

  const tasks = seeds.map(([title, category, priority, daysBeforeEvent, note]) => ({
    title,
    category,
    priority,
    daysBeforeEvent,
    note: note ?? "",
  }));

  const vendors = budget
    .filter((line) => VENDOR_LEAD_DAYS[line.category] !== undefined)
    .map((line) => ({
      category: line.category,
      title: CATEGORY_LABELS[line.category],
      why: VENDOR_WHY[line.category] ?? "",
      bookByDaysBefore: VENDOR_LEAD_DAYS[line.category] ?? 30,
    }));

  const food = [
    ...input.foodPreferences.map((pref) => `${pref} options clearly labelled at the buffet`),
    "A welcome drink on arrival so guests settle in quickly",
    "One signature dish that reflects your family or city",
  ];

  const entertainment = input.activities.length
    ? input.activities.map((activity) => `${activity}, with a clear start time in the run-of-show`)
    : ["A short welcome from the hosts", "A playlist that moves from dinner to dancing"];

  const risks = [
    {
      risk: "A key vendor cancels or arrives late",
      mitigation: "Keep a backup contact per category and confirm every booking a week before.",
    },
    {
      risk: "Costs creep past the budget",
      mitigation: "Track actual quotes in Budget Studio and protect the contingency line.",
    },
  ];
  if (isOutdoor) {
    risks.push({
      risk: "Rain or heat at an outdoor venue",
      mitigation: "Book a tent or indoor backup and plan shade, fans and water stations.",
    });
  }
  if (input.guestCount >= 200) {
    risks.push({
      risk: "Crowding at entry, food counters or parking",
      mitigation: "Add counters, stagger serving and assign volunteers to guide guests.",
    });
  }

  const where = city ? ` in ${city}` : "";
  return {
    concept: {
      title: `${articleFor(style.name)} ${style.name.toLowerCase()} ${typeLabel.toLowerCase()}${where}`,
      tagline,
      summary: `${input.name} brings ${input.guestCount} guests together${where}${
        venue ? ` at ${articleFor(venue).toLowerCase()} ${venue.toLowerCase()}` : ""
      }. The plan leans into ${articleFor(style.theme).toLowerCase()} ${style.theme.toLowerCase()} look, puts most of the budget where guests feel it — food, venue and atmosphere — and keeps a contingency for the final weeks.`,
      theme: style.theme,
    },
    palette: style.palette.map(([name, hex]) => ({ name, hex })),
    budget,
    tasks,
    vendors,
    decor: style.decor,
    food,
    entertainment,
    risks,
    recommendations: [
      "Lock the date and venue first; every other booking depends on them.",
      "Ask every vendor for a written quote that lists what is included.",
      "Pay deposits only against a signed agreement or invoice.",
      "Share one day-of timeline with all vendors and two family points of contact.",
    ],
  };
}
