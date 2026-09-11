export type ProjectStatus = "beholdt" | "vurderes-solgt" | "solgt";

export type ProjectItem = {
  id: string;
  title: string;
  description: string;
  details?: string;
  status: ProjectStatus;
  imageUrl?: string;
  imageUrls?: string[];
  soldPriceNok?: number;
};
