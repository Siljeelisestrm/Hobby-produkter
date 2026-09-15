import { useRef } from "react";
import type { CountdownWidgetData } from "~/types/dashboard";

type CountdownWidgetProps = {
  data: CountdownWidgetData;
  isEditing: boolean;
  isUploadingImage?: boolean;
  onChange: (data: CountdownWidgetData) => void;
  onImageFileSelected: (file: File) => void;
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

export function CountdownWidget({
  data,
  isEditing,
  isUploadingImage,
  onChange,
  onImageFileSelected,
}: CountdownWidgetProps) {
  const label = data.label ?? "";
  const targetDate = data.targetDate ?? "";
  const daysRemaining = getDaysRemaining(targetDate);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const daysText =
    daysRemaining === null
      ? "Velg en dato"
      : daysRemaining === 0
        ? "I dag!"
        : daysRemaining > 0
          ? `${daysRemaining} ${daysRemaining === 1 ? "dag" : "dager"} igjen`
          : `${Math.abs(daysRemaining)} ${Math.abs(daysRemaining) === 1 ? "dag" : "dager"} siden`;

  return (
    <div
      className={
        data.imageUrl
          ? "widget-countdown widget-countdown--has-image"
          : "widget-countdown"
      }
      style={
        data.imageUrl
          ? { backgroundImage: `url(${data.imageUrl})` }
          : undefined
      }
    >
      <div className="widget-countdown__overlay" />
      <div className="widget-countdown__content">
        <input
          type="text"
          className="widget-countdown__label"
          value={label}
          placeholder="Hva teller du ned til? (f.eks. Ferie)"
          onChange={(event) => onChange({ ...data, label: event.target.value })}
        />
        <div className="widget-countdown__days">{daysText}</div>
      </div>

      {isEditing ? (
        <div className="widget-countdown__edit-controls">
          <input
            type="date"
            className="widget-countdown__date"
            value={targetDate}
            onChange={(event) =>
              onChange({ ...data, targetDate: event.target.value })
            }
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onImageFileSelected(file);
              }
              event.target.value = "";
            }}
          />
          <div className="widget-countdown__image-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={isUploadingImage}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploadingImage
                ? "Laster opp..."
                : data.imageUrl
                  ? "Bytt bakgrunnsbilde"
                  : "Legg til bakgrunnsbilde"}
            </button>
            {data.imageUrl ? (
              <button
                type="button"
                className="secondary-button"
                onClick={() => onChange({ ...data, imageUrl: undefined })}
              >
                Fjern bilde
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
