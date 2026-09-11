import { getSupabaseClient } from "~/lib/supabase";
import type { ProjectItem, ProjectStatus } from "~/types/project";

const PRODUCT_IMAGE_BUCKET = "product-images";

type ProductRow = {
  id: string;
  title: string;
  description: string;
  details: string | null;
  status: string;
  sold_price_nok: number | null;
  image_url: string | null;
  extra_image_urls: string[] | null;
  created_at: string;
};

export type CreateProductInput = {
  title: string;
  description: string;
  details?: string;
  status: ProjectStatus;
  soldPriceNok?: number;
  imageFiles?: File[];
};

export type UpdateProductInput = {
  title: string;
  description: string;
  details?: string;
  status: ProjectStatus;
  soldPriceNok?: number;
  newImageFiles?: File[];
};

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
  return value === "beholdt" || value === "vurderes-solgt" || value === "solgt";
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
    description: row.description,
    details: row.details ?? undefined,
    status: row.status,
    soldPriceNok: row.sold_price_nok ?? undefined,
    imageUrl: primaryImage,
    imageUrls,
  };
}

async function uploadProductImage(file: File): Promise<string> {
  const supabase = getSupabaseClient();
  const extension = file.name.includes(".")
    ? file.name.split(".").pop()?.toLowerCase() ?? "jpg"
    : "jpg";
  const filePath = `products/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(filePath, file, {
      upsert: false,
      contentType: file.type || undefined,
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

export async function fetchProducts(): Promise<ProjectItem[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, title, description, details, status, sold_price_nok, image_url, extra_image_urls, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Klarte ikke hente produkter: ${error.message}`);
  }

  return (data as ProductRow[]).map(mapProductRow);
}

export async function createProduct(input: CreateProductInput): Promise<ProjectItem> {
  const supabase = getSupabaseClient();
  const imageUrls =
    input.imageFiles && input.imageFiles.length > 0
      ? await uploadProductImages(input.imageFiles)
      : [];
  const imageUrl = imageUrls.length > 0 ? imageUrls[0] : null;
  const extraImageUrls = imageUrls.length > 1 ? imageUrls.slice(1) : [];
  const soldPriceNok =
    input.status === "solgt" && typeof input.soldPriceNok === "number"
      ? input.soldPriceNok
      : null;

  const { data, error } = await supabase
    .from("products")
    .insert({
      title: input.title,
      description: input.description,
      details: input.details ?? null,
      status: input.status,
      sold_price_nok: soldPriceNok,
      image_url: imageUrl,
      extra_image_urls: extraImageUrls,
    })
    .select(
      "id, title, description, details, status, sold_price_nok, image_url, extra_image_urls, created_at",
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
  const mergedImageUrls = [...existingImageUrls, ...uploadedImageUrls];
  const imageUrl = mergedImageUrls.length > 0 ? mergedImageUrls[0] : null;
  const extraImageUrls = mergedImageUrls.length > 1 ? mergedImageUrls.slice(1) : [];
  const soldPriceNok =
    input.status === "solgt" && typeof input.soldPriceNok === "number"
      ? input.soldPriceNok
      : null;

  const { data, error } = await supabase
    .from("products")
    .update({
      title: input.title,
      description: input.description,
      details: input.details ?? null,
      status: input.status,
      sold_price_nok: soldPriceNok,
      image_url: imageUrl,
      extra_image_urls: extraImageUrls,
    })
    .eq("id", currentProduct.id)
    .select(
      "id, title, description, details, status, sold_price_nok, image_url, extra_image_urls, created_at",
    )
    .single();

  if (error) {
    throw new Error(`Klarte ikke oppdatere produkt: ${error.message}`);
  }

  return mapProductRow(data as ProductRow);
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
