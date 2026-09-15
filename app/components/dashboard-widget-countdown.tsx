import type { CountdownWidgetData } from "~/types/dashboard";

type CountdownWidgetProps = {
  data: CountdownWidgetData;
  onChange: (data: CountdownWidgetData) => void;
};

function getDaysRemaining(targetDate: string): number | null {
  if (!targetDate) {
    return null;
  }

  const target = new Date(`${targetDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.round((target.getTime() - today.getTime()) / millisecondsPerDay);
}

export function CountdownWidget({ data, onChange }: CountdownWidgetProps) {
  const label = data.label ?? "";
  const targetDate = data.targetDate ?? "";
  const daysRemaining = getDaysRemaining(targetDate);

  const daysText =
    daysRemaining === null
      ? "Velg en dato"
      : daysRemaining === 0
        ? "I dag!"
        : daysRemaining > 0
          ? `${daysRemaining} ${daysRemaining === 1 ? "dag" : "dager"} igjen`
          : `${Math.abs(daysRemaining)} ${Math.abs(daysRemaining) === 1 ? "dag" : "dager"} siden`;

  return (
    <div className="widget-countdown">
      <input
        type="text"
        className="widget-countdown__label"
        value={label}
        placeholder="Hva teller du ned til? (f.eks. Ferie)"
        onChange={(event) => onChange({ ...data, label: event.target.value })}
      />
      <div className="widget-countdown__days">{daysText}</div>
      <input
        type="date"
        className="widget-countdown__date"
        value={targetDate}
        onChange={(event) =>
          onChange({ ...data, targetDate: event.target.value })
        }
      />
    </div>
  );
}
