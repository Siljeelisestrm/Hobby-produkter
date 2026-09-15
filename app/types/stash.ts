export type StashCategory = "garn" | "stoff" | "perler" | "annet";

export const STASH_CATEGORY_LABELS: Record<StashCategory, string> = {
  garn: "Garn",
  stoff: "Stoff",
  perler: "Perler",
  annet: "Annet",
};

export const STASH_CATEGORIES: StashCategory[] = [
  "garn",
  "stoff",
  "perler",
  "annet",
];

export type StashItem = {
  id: string;
  ownerId: string;
  category: StashCategory;
  title: string;
  quantity: number;
  widthCm?: number;
  lengthCm?: number;
  priceNok?: number;
  imageUrl?: string;
  createdAt: string;
};
