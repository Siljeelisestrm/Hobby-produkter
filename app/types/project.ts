export type ProjectStatus = "beholdt" | "vurderes-solgt" | "solgt" | "gave";

export type ProjectItem = {
  id: string;
  title: string;
  description: string;
  details?: string;
  madeYear?: number;
  createdAt: string;
  ownerId: string;
  ownerUsername?: string;
  ownerAvatarUrl?: string;
  status: ProjectStatus;
  isFavorite: boolean;
  isShared: boolean;
  likeCount: number;
  likedByMe: boolean;
  imageUrl?: string;
  imageUrls?: string[];
  previewFocusX?: number;
  previewFocusY?: number;
  soldPriceNok?: number;
};
