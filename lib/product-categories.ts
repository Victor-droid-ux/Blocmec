export type ProductCategory = {
  key: string;
  label: string;
  icon: string;
  accent: string;
  accentSoft: string;
  resultSlug: string;
};

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    key: "documents",
    label: "Documents",
    icon: "📄",
    accent: "#8b5cf6",
    accentSoft: "rgba(139,92,246,0.15)",
    resultSlug: "documents",
  },
  {
    key: "passport",
    label: "Country Passport",
    icon: "🛂",
    accent: "#0ea5e9",
    accentSoft: "rgba(14,165,233,0.15)",
    resultSlug: "passport",
  },
  {
    key: "medicine",
    label: "Medicine",
    icon: "💊",
    accent: "#10b981",
    accentSoft: "rgba(16,185,129,0.15)",
    resultSlug: "medicine",
  },
  {
    key: "electronics",
    label: "Electronics",
    icon: "📱",
    accent: "#3b82f6",
    accentSoft: "rgba(59,130,246,0.15)",
    resultSlug: "electronics",
  },
  {
    key: "apparel",
    label: "Apparel",
    icon: "👕",
    accent: "#ec4899",
    accentSoft: "rgba(236,72,153,0.15)",
    resultSlug: "apparel",
  },
  {
    key: "luxury",
    label: "Luxury Goods",
    icon: "💎",
    accent: "#f59e0b",
    accentSoft: "rgba(245,158,11,0.15)",
    resultSlug: "luxury-goods",
  },
  {
    key: "food",
    label: "Food & Beverages",
    icon: "🍔",
    accent: "#f97316",
    accentSoft: "rgba(249,115,22,0.15)",
    resultSlug: "food-beverages",
  },
  {
    key: "artwork",
    label: "Artwork & Collectibles",
    icon: "🎨",
    accent: "#d946ef",
    accentSoft: "rgba(217,70,239,0.15)",
    resultSlug: "artwork",
  },
  {
    key: "tickets",
    label: "Tickets & Event Passes",
    icon: "🎫",
    accent: "#6366f1",
    accentSoft: "rgba(99,102,241,0.15)",
    resultSlug: "tickets",
  },
  {
    key: "cosmetics",
    label: "Cosmetics & Skincare",
    icon: "💄",
    accent: "#f43f5e",
    accentSoft: "rgba(244,63,94,0.15)",
    resultSlug: "cosmetics",
  },
  {
    key: "automotive",
    label: "Automotive Parts",
    icon: "🚗",
    accent: "#64748b",
    accentSoft: "rgba(100,116,139,0.15)",
    resultSlug: "automotive",
  },
  {
    key: "toys",
    label: "Toys & Baby Products",
    icon: "🧸",
    accent: "#eab308",
    accentSoft: "rgba(234,179,8,0.15)",
    resultSlug: "toys",
  },
  {
    key: "books",
    label: "Books & Educational Materials",
    icon: "📚",
    accent: "#14b8a6",
    accentSoft: "rgba(20,184,166,0.15)",
    resultSlug: "books",
  },
  {
    key: "idcards",
    label: "ID Cards",
    icon: "🪪",
    accent: "#0891b2",
    accentSoft: "rgba(8,145,178,0.15)",
    resultSlug: "id",
  },
  {
    key: "bankchecks",
    label: "Bank Checks",
    icon: "💳",
    accent: "#22c55e",
    accentSoft: "rgba(34,197,94,0.15)",
    resultSlug: "bank-checks",
  },
  {
    key: "landing",
    label: "Landing / Properties",
    icon: "🏠",
    accent: "#a855f7",
    accentSoft: "rgba(168,85,247,0.15)",
    resultSlug: "landing-properties",
  },
];

const CATEGORY_ALIASES: Record<string, string> = {
  "luxury-goods": "luxury",
  "food-beverages": "food",
  "food-beverage": "food",
  id: "idcards",
  "id-card": "idcards",
  "id-cards": "idcards",
  "bank-checks": "bankchecks",
  "bank-check": "bankchecks",
  bankcheck: "bankchecks",
  "landing-properties": "landing",
  "landing-property": "landing",
  property: "landing",
  properties: "landing",
  "artwork-and-collections": "artwork",
  "artwork-collectibles": "artwork",
  "tickets-event-passes": "tickets",
  "toys-baby-products": "toys",
  "books-educational": "books",
  "books-educational-materials": "books",
  "cosmetics-skincare": "cosmetics",
  "automotive-parts": "automotive",
  general: "documents",
  other: "documents",
};

export function normalizeCategoryKey(value?: string | null) {
  if (!value) return "";
  const slug = String(value).trim().toLowerCase().replace(/\s+/g, "-");
  return CATEGORY_ALIASES[slug] ?? slug;
}

export function getProductCategory(value?: string | null): ProductCategory {
  const key = normalizeCategoryKey(value);
  return (
    PRODUCT_CATEGORIES.find((category) => category.key === key) ??
    PRODUCT_CATEGORIES[0]
  );
}

export function isKnownCategory(value?: string | null) {
  const key = normalizeCategoryKey(value);
  return PRODUCT_CATEGORIES.some((category) => category.key === key);
}

export function filterAllowedCategories(allowed?: string[] | null) {
  const list = Array.isArray(allowed) ? allowed : [];
  if (list.length === 0) {
    return PRODUCT_CATEGORIES;
  }

  const normalized = new Set(list.map(normalizeCategoryKey));
  return PRODUCT_CATEGORIES.filter((category) =>
    normalized.has(category.key),
  );
}
