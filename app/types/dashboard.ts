export type WidgetSize = "small" | "medium" | "large";

export type WidgetType = "counter" | "countdown" | "note" | "stash-value";

export type CounterWidgetData = {
  label: string;
  count: number;
};

export type CountdownWidgetData = {
  label: string;
  targetDate: string;
  imageUrl?: string;
};

export type NoteWidgetData = {
  text: string;
};

export type StashValueWidgetData = {
  label: string;
};

export type WidgetDataFor<T extends WidgetType> = T extends "counter"
  ? CounterWidgetData
  : T extends "countdown"
    ? CountdownWidgetData
    : T extends "note"
      ? NoteWidgetData
      : StashValueWidgetData;

export type DashboardWidget = {
  id: string;
  ownerId: string;
  type: WidgetType;
  size: WidgetSize;
  position: number;
  data:
    | CounterWidgetData
    | CountdownWidgetData
    | NoteWidgetData
    | StashValueWidgetData;
  createdAt: string;
};

export const WIDGET_TYPE_LABELS: Record<WidgetType, string> = {
  counter: "Rundeteller",
  countdown: "Nedtelling",
  note: "Notat",
  "stash-value": "Stash-verdi",
};

export const WIDGET_SIZE_LABELS: Record<WidgetSize, string> = {
  small: "Liten",
  medium: "Medium",
  large: "Stor",
};
