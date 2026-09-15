import { useState } from "react";
import type { WidgetSize, WidgetType } from "~/types/dashboard";
import {
  WIDGET_SIZE_LABELS,
  WIDGET_TYPE_LABELS,
} from "~/types/dashboard";

type AddWidgetModalProps = {
  isSubmitting: boolean;
  onAdd: (type: WidgetType, size: WidgetSize) => void;
  onClose: () => void;
};

const WIDGET_TYPES: WidgetType[] = ["counter", "countdown", "note", "stash-value"];
const WIDGET_SIZES: WidgetSize[] = ["small", "medium", "large"];

const WIDGET_TYPE_ICONS: Record<WidgetType, string> = {
  counter: "🧶",
  countdown: "📆",
  note: "📝",
  "stash-value": "💰",
};

export function AddWidgetModal({
  isSubmitting,
  onAdd,
  onClose,
}: AddWidgetModalProps) {
  const [selectedType, setSelectedType] = useState<WidgetType>("counter");
  const [selectedSize, setSelectedSize] = useState<WidgetSize>("medium");

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-panel add-widget-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Legg til widget"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Lukk"
        >
          <span className="icon-mark icon-mark--close" aria-hidden="true" />
        </button>

        <h2>Legg til widget</h2>

        <div className="add-widget-modal__section">
          <p className="add-widget-modal__section-title">Type</p>
          <div className="add-widget-modal__options">
            {WIDGET_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={
                  selectedType === type
                    ? "add-widget-modal__option is-selected"
                    : "add-widget-modal__option"
                }
                onClick={() => setSelectedType(type)}
              >
                <span aria-hidden="true">{WIDGET_TYPE_ICONS[type]}</span>
                {WIDGET_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        <div className="add-widget-modal__section">
          <p className="add-widget-modal__section-title">Størrelse</p>
          <div className="add-widget-modal__options">
            {WIDGET_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                className={
                  selectedSize === size
                    ? "add-widget-modal__option is-selected"
                    : "add-widget-modal__option"
                }
                onClick={() => setSelectedSize(size)}
              >
                {WIDGET_SIZE_LABELS[size]}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="primary-button"
            disabled={isSubmitting}
            onClick={() => onAdd(selectedType, selectedSize)}
          >
            {isSubmitting ? "Legger til..." : "Legg til"}
          </button>
        </div>
      </div>
    </div>
  );
}
