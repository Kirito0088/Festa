/**
 * Domain vocabulary shared by the Convex backend, the AI layer and the UI.
 * Keep these lists short and stable: they are persisted in the database and
 * appear in AI JSON schemas.
 */

export const EVENT_TYPES = [
  "wedding",
  "engagement",
  "birthday",
  "anniversary",
  "baby-shower",
  "community",
  "corporate",
  "other",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: "Wedding",
  engagement: "Engagement",
  birthday: "Birthday",
  anniversary: "Anniversary",
  "baby-shower": "Baby shower",
  community: "Community event",
  corporate: "Company celebration",
  other: "Something else",
};

/** One category list is shared by budget lines, tasks and vendors. */
export const CATEGORIES = [
  "venue",
  "catering",
  "decor",
  "photography",
  "entertainment",
  "attire",
  "invitations",
  "guests",
  "logistics",
  "rituals",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  venue: "Venue",
  catering: "Food & drinks",
  decor: "Decor & florals",
  photography: "Photo & video",
  entertainment: "Entertainment",
  attire: "Attire & beauty",
  invitations: "Invitations & stationery",
  guests: "Guests & hospitality",
  logistics: "Transport & logistics",
  rituals: "Rituals & ceremonies",
  other: "Other",
};

export const PRIORITIES = ["low", "medium", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const VENDOR_STATUSES = ["researching", "contacted", "quoted", "booked", "declined"] as const;
export type VendorStatus = (typeof VENDOR_STATUSES)[number];

export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  researching: "Researching",
  contacted: "Contacted",
  quoted: "Quote received",
  booked: "Booked",
  declined: "Not proceeding",
};

export const PAYMENT_STATUSES = ["unpaid", "deposit", "paid"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  deposit: "Deposit paid",
  paid: "Paid in full",
};

export const MOODBOARD_CATEGORIES = ["theme", "colors", "decor", "invitations", "food", "venue"] as const;
export type MoodboardCategory = (typeof MOODBOARD_CATEGORIES)[number];

export const MOODBOARD_CATEGORY_LABELS: Record<MoodboardCategory, string> = {
  theme: "Theme",
  colors: "Colours",
  decor: "Decor",
  invitations: "Invitations",
  food: "Food styling",
  venue: "Venue",
};

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = "INR";

export const STYLE_OPTIONS = [
  "Elegant",
  "Minimal",
  "Traditional",
  "Modern",
  "Boho",
  "Rustic",
  "Festive",
  "Royal",
  "Intimate",
  "Playful",
] as const;

export const FOOD_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Jain",
  "Non-vegetarian",
  "Regional cuisine",
  "Live counters",
  "Dessert bar",
  "Mocktail bar",
  "Gluten-free options",
] as const;

export const ACTIVITY_OPTIONS: Record<EventType, readonly string[]> = {
  wedding: ["Mehendi", "Haldi", "Sangeet", "Baraat", "Pheras", "Reception", "DJ night", "Photo booth"],
  engagement: ["Ring ceremony", "Live music", "Couple's entry", "Speeches", "Photo booth", "DJ night"],
  birthday: ["Cake cutting", "Games", "Live music", "Speeches", "Photo booth", "DJ night"],
  anniversary: ["Toasts", "Slideshow", "Live music", "Dinner", "Dance floor", "Photo booth"],
  "baby-shower": ["Games", "Godh bharai", "Wishes wall", "Photo booth", "Dessert table"],
  community: [
    "Welcome address",
    "Cultural performances",
    "Workshops",
    "Food stalls",
    "Games",
    "Prize distribution",
  ],
  corporate: ["Keynote", "Awards", "Team games", "Live music", "Networking", "Dinner"],
  other: ["Live music", "Games", "Speeches", "Photo booth", "Dinner"],
};

export const VENUE_OPTIONS = [
  "Banquet hall",
  "Garden or lawn",
  "Hotel ballroom",
  "Heritage property",
  "Beach or resort",
  "Restaurant",
  "Home",
  "Community hall",
] as const;

/** Activity entries on the overview; the event chrome preloads the same query. */
export const RECENT_ACTIVITY_LIMIT = 8;

/** Limits applied to user input and AI output alike. */
export const LIMITS = {
  nameMax: 120,
  shortTextMax: 200,
  longTextMax: 2000,
  chatMessageMax: 1500,
  guestsMax: 100_000,
  moneyMax: 10_000_000_000,
  offsetDaysMax: 730,
  listMax: 500,
  /** Moments on one day's run sheet. */
  scheduleMax: 100,
} as const;
