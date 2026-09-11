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
  created_at: string;
};

export type CreateProductInput = {
  title: string;
  description: string;
  details?: string;
  status: ProjectStatus;
  soldPriceNok?: number;
  imageFile?: File;
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

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    details: row.details ?? undefined,
    status: row.status,
    soldPriceNok: row.sold_price_nok ?? undefined,
    imageUrl: row.image_url ?? undefined,
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

export async function fetchProducts(): Promise<ProjectItem[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, title, description, details, status, sold_price_nok, image_url, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Klarte ikke hente produkter: ${error.message}`);
  }

  return (data as ProductRow[]).map(mapProductRow);
}

export async function createProduct(input: CreateProductInput): Promise<ProjectItem> {
  const supabase = getSupabaseClient();
  const imageUrl = input.imageFile ? await uploadProductImage(input.imageFile) : null;
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
    })
    .select(
      "id, title, description, details, status, sold_price_nok, image_url, created_at",
    )
    .single();

  if (error) {
    throw new Error(`Klarte ikke lagre produkt: ${error.message}`);
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

  if (!product.imageUrl) {
    return;
  }

  const imagePath = getStoragePathFromPublicUrl(product.imageUrl);
  if (!imagePath) {
    return;
  }

  const { error: deleteImageError } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .remove([imagePath]);

  if (deleteImageError) {
    throw new Error(`Produktet ble slettet, men ikke bildet: ${deleteImageError.message}`);
  }
}
