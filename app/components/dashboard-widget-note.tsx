import type { NoteWidgetData } from "~/types/dashboard";

type NoteWidgetProps = {
  data: NoteWidgetData;
  onChange: (data: NoteWidgetData) => void;
};

export function NoteWidget({ data, onChange }: NoteWidgetProps) {
  return (
    <textarea
      className="widget-note"
      value={data.text ?? ""}
      placeholder="Skriv et notat..."
      onChange={(event) => onChange({ text: event.target.value })}
    />
  );
}
