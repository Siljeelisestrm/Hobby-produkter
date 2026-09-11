export type ProjectStatus = "beholdt" | "vurderes-solgt" | "solgt" | "gave";

export type ProjectItem = {
  id: string;
  title: string;
  description: string;
  details?: string;
  status: ProjectStatus;
  isFavorite: boolean;
  imageUrl?: string;
  imageUrls?: string[];
  previewFocusX?: number;
  previewFocusY?: number;
  soldPriceNok?: number;
};
