import { compressImageFile } from "~/lib/image";
import { getSupabaseClient } from "~/lib/supabase";
import type { StashCategory, StashItem } from "~/types/stash";

const STASH_IMAGE_BUCKET = "stash-images";

type StashItemRow = {
  id: string;
  owner_id: string;
  category: string;
  title: string;
  quantity: number;
  width_cm: number | null;
  length_cm: number | null;
  price_nok: number | null;
  image_url: string | null;
  created_at: string;
};

const STASH_COLUMNS =
  "id, owner_id, category, title, quantity, width_cm, length_cm, price_nok, image_url, created_at";

export type CreateStashItemInput = {
  category: StashCategory;
  title: string;
  quantity: number;
  widthCm?: number;
  lengthCm?: number;
  priceNok?: number;
  imageFile?: File;
};

export type UpdateStashItemInput = {
  category: StashCategory;
  title: string;
  quantity: number;
  widthCm?: number;
  lengthCm?: number;
  priceNok?: number;
  imageFile?: File;
  keepExistingImage?: boolean;
};

function isStashCategory(value: string): value is StashCategory {
  return (
    value === "garn" ||
    value === "stoff" ||
    value === "perler" ||
    value === "annet"
  );
}

function mapStashItemRow(row: StashItemRow): StashItem {
  if (!isStashCategory(row.category)) {
    throw new Error(`Ukjent kategori i databasen: ${row.category}`);
  }

  return {
    id: row.id,
    ownerId: row.owner_id,
    category: row.category,
    title: row.title,
    quantity: row.quantity,
    widthCm: row.width_cm ?? undefined,
    lengthCm: row.length_cm ?? undefined,
    priceNok: row.price_nok ?? undefined,
    imageUrl: row.image_url ?? undefined,
    createdAt: row.created_at,
  };
}

async function uploadStashImage(file: File): Promise<string> {
  const supabase = getSupabaseClient();
  const compressedFile = await compressImageFile(file);
  const extension = compressedFile.name.includes(".")
    ? (compressedFile.name.split(".").pop()?.toLowerCase() ?? "jpg")
    : "jpg";
  const filePath = `stash/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(STASH_IMAGE_BUCKET)
    .upload(filePath, compressedFile, {
      upsert: false,
      contentType: compressedFile.type || undefined,
    });

  if (uploadError) {
    throw new Error(`Klarte ikke laste opp bilde: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(STASH_IMAGE_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function fetchStashItems(ownerId: string): Promise<StashItem[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("stash_items")
    .select(STASH_COLUMNS)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Klarte ikke hente biblioteket: ${error.message}`);
  }

  return (data as StashItemRow[]).map(mapStashItemRow);
}

export async function fetchStashTotalValue(ownerId: string): Promise<number> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("stash_items")
    .select("price_nok")
    .eq("owner_id", ownerId);

  if (error) {
    throw new Error(`Klarte ikke hente totalverdi: ${error.message}`);
  }

  return (data as Array<{ price_nok: number | null }>).reduce(
    (sum, row) => sum + (row.price_nok ?? 0),
    0,
  );
}

export async function createStashItem(
  ownerId: string,
  input: CreateStashItemInput,
): Promise<StashItem> {
  const imageUrl = input.imageFile
    ? await uploadStashImage(input.imageFile)
    : null;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("stash_items")
    .insert({
      owner_id: ownerId,
      category: input.category,
      title: input.title,
      quantity: input.quantity,
      width_cm: input.widthCm ?? null,
      length_cm: input.lengthCm ?? null,
      price_nok: input.priceNok ?? null,
      image_url: imageUrl,
    })
    .select(STASH_COLUMNS)
    .single();

  if (error) {
    throw new Error(`Klarte ikke legge til: ${error.message}`);
  }

  return mapStashItemRow(data as StashItemRow);
}

export async function updateStashItem(
  item: StashItem,
  input: UpdateStashItemInput,
): Promise<StashItem> {
  const imageUrl = input.imageFile
    ? await uploadStashImage(input.imageFile)
    : input.keepExistingImage === false
      ? null
      : (item.imageUrl ?? null);

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("stash_items")
    .update({
      category: input.category,
      title: input.title,
      quantity: input.quantity,
      width_cm: input.widthCm ?? null,
      length_cm: input.lengthCm ?? null,
      price_nok: input.priceNok ?? null,
      image_url: imageUrl,
    })
    .eq("id", item.id)
    .select(STASH_COLUMNS)
    .single();

  if (error) {
    throw new Error(`Klarte ikke oppdatere: ${error.message}`);
  }

  return mapStashItemRow(data as StashItemRow);
}

export async function deleteStashItem(itemId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("stash_items").delete().eq("id", itemId);

  if (error) {
    throw new Error(`Klarte ikke slette: ${error.message}`);
  }
}
