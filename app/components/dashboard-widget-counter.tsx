import type { CounterWidgetData } from "~/types/dashboard";
import { FaArrowRotateLeft } from "react-icons/fa6";

type CounterWidgetProps = {
  data: CounterWidgetData;
  onChange: (data: CounterWidgetData) => void;
};

export function CounterWidget({ data, onChange }: CounterWidgetProps) {
  const label = data.label ?? "";
  const count = data.count ?? 0;

  return (
    <div className="widget-counter">
      <input
        type="text"
        className="widget-counter__label"
        value={label}
        placeholder="Navn på telleren (f.eks. Genser ermer)"
        onChange={(event) => onChange({ ...data, label: event.target.value })}
      />
      <div className="widget-counter__value">{count}</div>
      <div className="widget-counter__controls">
        <button
          type="button"
          className="widget-counter__button"
          aria-label="Reduser"
          onClick={() => onChange({ ...data, count: Math.max(0, count - 1) })}
        >
          −
        </button>
        <button
          type="button"
          className="widget-counter__button widget-counter__button--reset"
          onClick={() => onChange({ ...data, count: 0 })}
        >
          <FaArrowRotateLeft />
        </button>
        <button
          type="button"
          className="widget-counter__button"
          aria-label="Øk"
          onClick={() => onChange({ ...data, count: count + 1 })}
        >
          +
        </button>
      </div>
    </div>
  );
}
