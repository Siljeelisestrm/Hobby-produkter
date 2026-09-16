import { compressImageFile } from "~/lib/image";
import { getSupabaseClient } from "~/lib/supabase";
import type { ProjectItem, ProjectStatus } from "~/types/project";

const PRODUCT_IMAGE_BUCKET = "product-images";

type ProductRow = {
  id: string;
  title: string;
  description: string;
  details: string | null;
  created_year: number | null;
  owner_id: string | null;
  status: string;
  is_favorite: boolean | null;
  is_shared: boolean | null;
  sold_price_nok: number | null;
  image_url: string | null;
  extra_image_urls: string[] | null;
  preview_focus_x: number | null;
  preview_focus_y: number | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  username: string;
  avatar_url: string | null;
};

type ProductLikeRow = {
  product_id: string;
  user_id: string;
};

export type CreateProductInput = {
  title: string;
  description: string;
  details?: string;
  madeYear?: number;
  status: ProjectStatus;
  soldPriceNok?: number;
  imageFiles?: File[];
};

export type UpdateProductInput = {
  title: string;
  description: string;
  details?: string;
  madeYear?: number;
  status: ProjectStatus;
  soldPriceNok?: number;
  keptImageUrls?: string[];
  newImageFiles?: File[];
  coverImageUrl?: string;
  previewFocusX?: number;
  previewFocusY?: number;
};

function normalizeFocus(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 50;
  }

  return Math.min(100, Math.max(0, value));
}

function getValidatedMadeYear(value: number | undefined): number | null {
  if (typeof value !== "number") {
    return null;
  }

  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(value) || value < 1900 || value > currentYear + 1) {
    throw new Error(`Årstall må være et heltall mellom 1900 og ${currentYear + 1}.`);
  }

  return value;
}

function getStoragePathFromPublicUrl(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`;
  const markerIndex = publicUrl.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const rawPath = publicUrl.slice(markerIndex + marker.length);
  if (!rawPath) {
    return null;
  }

  const [pathWithoutQuery] = rawPath.split("?");
  return decodeURIComponent(pathWithoutQuery);
}

function isProjectStatus(value: string): value is ProjectStatus {
  return (
    value === "beholdt" ||
    value === "vurderes-solgt" ||
    value === "solgt" ||
    value === "gave"
  );
}

function mapProductRow(row: ProductRow): ProjectItem {
  if (!isProjectStatus(row.status)) {
    throw new Error(`Ugyldig status i databasen: ${row.status}`);
  }

  const primaryImage = row.image_url ?? undefined;
  const extraImages = row.extra_image_urls ?? [];
  const imageUrls = primaryImage ? [primaryImage, ...extraImages] : extraImages;

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    details: row.details ?? undefined,
    madeYear: row.created_year ?? undefined,
    createdAt: row.created_at,
    ownerId: row.owner_id ?? "",
    status: row.status,
    isFavorite: row.is_favorite ?? false,
    isShared: row.is_shared ?? false,
    likeCount: 0,
    likedByMe: false,
    soldPriceNok: row.sold_price_nok ?? undefined,
    imageUrl: primaryImage,
    imageUrls,
    previewFocusX: row.preview_focus_x ?? 50,
    previewFocusY: row.preview_focus_y ?? 50,
  };
}

async function uploadProductImage(file: File): Promise<string> {
  const supabase = getSupabaseClient();
  const compressedFile = await compressImageFile(file);
  const extension = compressedFile.name.includes(".")
    ? compressedFile.name.split(".").pop()?.toLowerCase() ?? "jpg"
    : "jpg";
  const filePath = `products/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(filePath, compressedFile, {
      upsert: false,
      contentType: compressedFile.type || undefined,
    });

  if (uploadError) {
    throw new Error(
      `Klarte ikke laste opp bilde: ${uploadError.message}. Sjekk at bucket '${PRODUCT_IMAGE_BUCKET}' finnes og at policy tillater opplasting.`,
    );
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

async function uploadProductImages(files: File[]): Promise<string[]> {
  const uploadedUrls: string[] = [];

  for (const file of files) {
    uploadedUrls.push(await uploadProductImage(file));
  }

  return uploadedUrls;
}

async function attachLikeMetadata(
  projects: ProjectItem[],
  currentUserId?: string,
): Promise<ProjectItem[]> {
  if (projects.length === 0) {
    return projects;
  }

  const supabase = getSupabaseClient();
  const { data: likeRows, error: likesError } = await supabase
    .from("product_likes")
    .select("product_id, user_id")
    .in(
      "product_id",
      projects.map((project) => project.id),
    );

  if (likesError) {
    throw new Error(`Klarte ikke hente likes: ${likesError.message}`);
  }

  const likeCountByProductId = new Map<string, number>();
  const likedProductIds = new Set<string>();

  for (const likeRow of likeRows as ProductLikeRow[]) {
    likeCountByProductId.set(
      likeRow.product_id,
      (likeCountByProductId.get(likeRow.product_id) ?? 0) + 1,
    );

    if (currentUserId && likeRow.user_id === currentUserId) {
      likedProductIds.add(likeRow.product_id);
    }
  }

  return projects.map((project) => ({
    ...project,
    likeCount: likeCountByProductId.get(project.id) ?? 0,
    likedByMe: likedProductIds.has(project.id),
  }));
}

export async function fetchProducts(): Promise<ProjectItem[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, title, description, details, created_year, owner_id, status, is_favorite, is_shared, sold_price_nok, image_url, extra_image_urls, preview_focus_x, preview_focus_y, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Klarte ikke hente produkter: ${error.message}`);
  }

  return (data as ProductRow[]).map(mapProductRow);
}

export async function fetchUserProducts(userId: string): Promise<ProjectItem[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, title, description, details, created_year, owner_id, status, is_favorite, is_shared, sold_price_nok, image_url, extra_image_urls, preview_focus_x, preview_focus_y, created_at",
    )
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Klarte ikke hente produkter: ${error.message}`);
  }

  const projects = (data as ProductRow[]).map(mapProductRow);
  return attachLikeMetadata(projects, userId);
}

export async function fetchSharedProducts(
  currentUserId?: string,
): Promise<ProjectItem[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, title, description, details, created_year, owner_id, status, is_favorite, is_shared, sold_price_nok, image_url, extra_image_urls, preview_focus_x, preview_focus_y, created_at",
    )
    .eq("is_shared", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Klarte ikke hente delte produkter: ${error.message}`);
  }

  const projects = (data as ProductRow[]).map(mapProductRow);
  if (projects.length === 0) {
    return projects;
  }

  const ownerIds = Array.from(
    new Set(projects.map((project) => project.ownerId).filter(Boolean)),
  );
  const [{ data: profileRows, error: profilesError }, projectsWithLikes] = await Promise.all([
      supabase.from("profiles").select("id, username, avatar_url").in("id", ownerIds),
      attachLikeMetadata(projects, currentUserId),
    ]);

  if (profilesError) {
    throw new Error(`Klarte ikke hente profiler: ${profilesError.message}`);
  }

  const profileById = new Map<string, ProfileRow>(
    (profileRows as ProfileRow[]).map((profile) => [profile.id, profile]),
  );

  return projectsWithLikes.map((project) => {
    const profile = profileById.get(project.ownerId);

    return {
      ...project,
      ownerUsername: profile?.username ?? "Ukjent bruker",
      ownerAvatarUrl: profile?.avatar_url ?? undefined,
    };
  });
}

export async function fetchSharedProductsByOwner(
  ownerId: string,
  currentUserId?: string,
): Promise<ProjectItem[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, title, description, details, created_year, owner_id, status, is_favorite, is_shared, sold_price_nok, image_url, extra_image_urls, preview_focus_x, preview_focus_y, created_at",
    )
    .eq("owner_id", ownerId)
    .eq("is_shared", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Klarte ikke hente delte produkter: ${error.message}`);
  }

  const projects = (data as ProductRow[]).map(mapProductRow);
  if (projects.length === 0) {
    return projects;
  }

  const [{ data: profileRow, error: profileError }, projectsWithLikes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("id", ownerId)
        .maybeSingle(),
      attachLikeMetadata(projects, currentUserId),
    ]);

  if (profileError) {
    throw new Error(`Klarte ikke hente profil: ${profileError.message}`);
  }

  const ownerProfile = profileRow as ProfileRow | null;
  return projectsWithLikes.map((project) => ({
    ...project,
    ownerUsername: ownerProfile?.username ?? "Ukjent bruker",
    ownerAvatarUrl: ownerProfile?.avatar_url ?? undefined,
  }));
}

export async function createProduct(input: CreateProductInput): Promise<ProjectItem> {
  const supabase = getSupabaseClient();
  const imageUrls =
    input.imageFiles && input.imageFiles.length > 0
      ? await uploadProductImages(input.imageFiles)
      : [];
  if (imageUrls.length === 0) {
    throw new Error("Produkt må ha minst ett bilde.");
  }
  const imageUrl = imageUrls.length > 0 ? imageUrls[0] : null;
  const extraImageUrls = imageUrls.length > 1 ? imageUrls.slice(1) : [];
  const soldPriceNok =
    input.status === "solgt" && typeof input.soldPriceNok === "number"
      ? input.soldPriceNok
      : null;
  const createdYear = getValidatedMadeYear(input.madeYear);

  const { data, error } = await supabase
    .from("products")
    .insert({
      title: input.title,
      description: input.description.trim(),
      details: input.details ?? null,
      created_year: createdYear,
      status: input.status,
      is_favorite: false,
      is_shared: false,
      sold_price_nok: soldPriceNok,
      image_url: imageUrl,
      extra_image_urls: extraImageUrls,
      preview_focus_x: 50,
      preview_focus_y: 50,
    })
    .select(
      "id, title, description, details, created_year, owner_id, status, is_favorite, is_shared, sold_price_nok, image_url, extra_image_urls, preview_focus_x, preview_focus_y, created_at",
    )
    .single();

  if (error) {
    throw new Error(`Klarte ikke lagre produkt: ${error.message}`);
  }

  return mapProductRow(data as ProductRow);
}

export async function updateProduct(
  currentProduct: ProjectItem,
  input: UpdateProductInput,
): Promise<ProjectItem> {
  const supabase = getSupabaseClient();
  const uploadedImageUrls =
    input.newImageFiles && input.newImageFiles.length > 0
      ? await uploadProductImages(input.newImageFiles)
      : [];

  const existingImageUrls = currentProduct.imageUrls?.length
    ? currentProduct.imageUrls
    : currentProduct.imageUrl
      ? [currentProduct.imageUrl]
      : [];
  const keptExistingImageUrls = input.keptImageUrls
    ? input.keptImageUrls.filter((url) => existingImageUrls.includes(url))
    : existingImageUrls;
  const mergedImageUrls = Array.from(
    new Set([...keptExistingImageUrls, ...uploadedImageUrls]),
  );
  const selectedCoverImageUrl = input.coverImageUrl;
  const orderedImageUrls =
    selectedCoverImageUrl && mergedImageUrls.includes(selectedCoverImageUrl)
      ? [
          selectedCoverImageUrl,
          ...mergedImageUrls.filter((url) => url !== selectedCoverImageUrl),
        ]
      : mergedImageUrls;
  const imageUrl = orderedImageUrls.length > 0 ? orderedImageUrls[0] : null;
  const extraImageUrls = orderedImageUrls.length > 1 ? orderedImageUrls.slice(1) : [];
  if (!imageUrl) {
    throw new Error("Produkt må ha minst ett bilde.");
  }
  const soldPriceNok =
    input.status === "solgt" && typeof input.soldPriceNok === "number"
      ? input.soldPriceNok
      : null;
  const createdYear = getValidatedMadeYear(input.madeYear);

  const { data, error } = await supabase
    .from("products")
    .update({
      title: input.title,
      description: input.description.trim(),
      details: input.details ?? null,
      created_year: createdYear,
      status: input.status,
      sold_price_nok: soldPriceNok,
      image_url: imageUrl,
      extra_image_urls: extraImageUrls,
      preview_focus_x: normalizeFocus(input.previewFocusX),
      preview_focus_y: normalizeFocus(input.previewFocusY),
    })
    .eq("id", currentProduct.id)
    .select(
      "id, title, description, details, created_year, owner_id, status, is_favorite, is_shared, sold_price_nok, image_url, extra_image_urls, preview_focus_x, preview_focus_y, created_at",
    )
    .single();

  if (error) {
    throw new Error(`Klarte ikke oppdatere produkt: ${error.message}`);
  }

  return mapProductRow(data as ProductRow);
}

export async function setProductFavorite(
  productId: string,
  isFavorite: boolean,
): Promise<ProjectItem> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("products")
    .update({ is_favorite: isFavorite })
    .eq("id", productId)
    .select(
      "id, title, description, details, created_year, owner_id, status, is_favorite, is_shared, sold_price_nok, image_url, extra_image_urls, preview_focus_x, preview_focus_y, created_at",
    )
    .single();

  if (error) {
    throw new Error(`Klarte ikke oppdatere favoritt: ${error.message}`);
  }

  return mapProductRow(data as ProductRow);
}

export async function setProductShared(
  productId: string,
  isShared: boolean,
): Promise<ProjectItem> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("products")
    .update({ is_shared: isShared })
    .eq("id", productId)
    .select(
      "id, title, description, details, created_year, owner_id, status, is_favorite, is_shared, sold_price_nok, image_url, extra_image_urls, preview_focus_x, preview_focus_y, created_at",
    )
    .single();

  if (error) {
    throw new Error(`Klarte ikke dele produkt: ${error.message}`);
  }

  return mapProductRow(data as ProductRow);
}

export async function toggleProductLike(
  productId: string,
  userId: string,
  shouldLike: boolean,
): Promise<void> {
  const supabase = getSupabaseClient();

  if (shouldLike) {
    const { error } = await supabase
      .from("product_likes")
      .upsert(
        {
          product_id: productId,
          user_id: userId,
        },
        { onConflict: "product_id,user_id", ignoreDuplicates: true },
      );

    if (error) {
      throw new Error(`Klarte ikke like produkt: ${error.message}`);
    }

    return;
  }

  const { error } = await supabase
    .from("product_likes")
    .delete()
    .eq("product_id", productId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Klarte ikke fjerne like: ${error.message}`);
  }
}

export async function deleteProduct(product: ProjectItem): Promise<void> {
  const supabase = getSupabaseClient();

  const { error: deleteProductError } = await supabase
    .from("products")
    .delete()
    .eq("id", product.id);

  if (deleteProductError) {
    throw new Error(`Klarte ikke slette produkt: ${deleteProductError.message}`);
  }

  const allUrls = product.imageUrls?.length
    ? product.imageUrls
    : product.imageUrl
      ? [product.imageUrl]
      : [];
  const imagePaths = allUrls
    .map((url) => getStoragePathFromPublicUrl(url))
    .filter((path): path is string => Boolean(path));

  if (imagePaths.length === 0) {
    return;
  }

  const uniqueImagePaths = Array.from(new Set(imagePaths));
  const { error: deleteImageError } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .remove(uniqueImagePaths);

  if (deleteImageError) {
    throw new Error(`Produktet ble slettet, men ikke bildet: ${deleteImageError.message}`);
  }
}
