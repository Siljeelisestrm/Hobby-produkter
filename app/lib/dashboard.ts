import { compressImageFile } from "~/lib/image";
import { getSupabaseClient } from "~/lib/supabase";
import type {
  DashboardWidget,
  WidgetSize,
  WidgetType,
} from "~/types/dashboard";

const WIDGET_IMAGE_BUCKET = "widget-images";

type WidgetRow = {
  id: string;
  owner_id: string;
  type: string;
  size: string;
  position: number;
  data: unknown;
  created_at: string;
};

const WIDGET_COLUMNS = "id, owner_id, type, size, position, data, created_at";

export async function uploadWidgetImage(file: File): Promise<string> {
  const supabase = getSupabaseClient();
  const compressedFile = await compressImageFile(file);
  const extension = compressedFile.name.includes(".")
    ? (compressedFile.name.split(".").pop()?.toLowerCase() ?? "jpg")
    : "jpg";
  const filePath = `widgets/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(WIDGET_IMAGE_BUCKET)
    .upload(filePath, compressedFile, {
      upsert: false,
      contentType: compressedFile.type || undefined,
    });

  if (uploadError) {
    throw new Error(`Klarte ikke laste opp bilde: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from(WIDGET_IMAGE_BUCKET)
    .getPublicUrl(filePath);
  return data.publicUrl;
}

function isWidgetType(value: string): value is WidgetType {
  return (
    value === "counter" ||
    value === "countdown" ||
    value === "note" ||
    value === "stash-value"
  );
}

function isWidgetSize(value: string): value is WidgetSize {
  return value === "small" || value === "medium" || value === "large";
}

function mapWidgetRow(row: WidgetRow): DashboardWidget {
  if (!isWidgetType(row.type)) {
    throw new Error(`Ukjent widget-type: ${row.type}`);
  }
  if (!isWidgetSize(row.size)) {
    throw new Error(`Ukjent widget-størrelse: ${row.size}`);
  }

  return {
    id: row.id,
    ownerId: row.owner_id,
    type: row.type,
    size: row.size,
    position: row.position,
    data: (row.data ?? {}) as DashboardWidget["data"],
    createdAt: row.created_at,
  };
}

function defaultDataForType(type: WidgetType): DashboardWidget["data"] {
  switch (type) {
    case "counter":
      return { label: "Rundeteller", count: 0 };
    case "countdown":
      return { label: "Nedtelling", targetDate: "" };
    case "note":
      return { text: "" };
    case "stash-value":
      return { label: "Stash-verdi" };
  }
}

export async function fetchDashboardWidgets(
  ownerId: string,
): Promise<DashboardWidget[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("dashboard_widgets")
    .select(WIDGET_COLUMNS)
    .eq("owner_id", ownerId)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(`Klarte ikke hente dashboard: ${error.message}`);
  }

  return (data as WidgetRow[]).map(mapWidgetRow);
}

export async function createDashboardWidget(
  ownerId: string,
  type: WidgetType,
  size: WidgetSize,
  nextPosition: number,
): Promise<DashboardWidget> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("dashboard_widgets")
    .insert({
      owner_id: ownerId,
      type,
      size,
      position: nextPosition,
      data: defaultDataForType(type),
    })
    .select(WIDGET_COLUMNS)
    .single();

  if (error) {
    throw new Error(`Klarte ikke legge til widget: ${error.message}`);
  }

  return mapWidgetRow(data as WidgetRow);
}

export async function updateDashboardWidgetData(
  widgetId: string,
  data: DashboardWidget["data"],
): Promise<DashboardWidget> {
  const supabase = getSupabaseClient();
  const { data: row, error } = await supabase
    .from("dashboard_widgets")
    .update({ data })
    .eq("id", widgetId)
    .select(WIDGET_COLUMNS)
    .single();

  if (error) {
    throw new Error(`Klarte ikke lagre widget: ${error.message}`);
  }

  return mapWidgetRow(row as WidgetRow);
}

export async function updateDashboardWidgetSize(
  widgetId: string,
  size: WidgetSize,
): Promise<DashboardWidget> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("dashboard_widgets")
    .update({ size })
    .eq("id", widgetId)
    .select(WIDGET_COLUMNS)
    .single();

  if (error) {
    throw new Error(`Klarte ikke endre størrelse: ${error.message}`);
  }

  return mapWidgetRow(data as WidgetRow);
}

export async function reorderDashboardWidgets(
  updates: Array<{ id: string; position: number }>,
): Promise<void> {
  const supabase = getSupabaseClient();
  const results = await Promise.all(
    updates.map(({ id, position }) =>
      supabase.from("dashboard_widgets").update({ position }).eq("id", id),
    ),
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) {
    throw new Error(`Klarte ikke lagre rekkefølge: ${failed.error.message}`);
  }
}

export async function deleteDashboardWidget(widgetId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("dashboard_widgets")
    .delete()
    .eq("id", widgetId);

  if (error) {
    throw new Error(`Klarte ikke slette widget: ${error.message}`);
  }
}
