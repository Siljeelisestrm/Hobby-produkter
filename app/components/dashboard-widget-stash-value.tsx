import { useEffect, useState } from "react";
import { fetchStashTotalValue } from "~/lib/stash";
import type { StashValueWidgetData } from "~/types/dashboard";

type StashValueWidgetProps = {
  ownerId: string;
  data: StashValueWidgetData;
  onChange: (data: StashValueWidgetData) => void;
};

export function StashValueWidget({
  ownerId,
  data,
  onChange,
}: StashValueWidgetProps) {
  const [totalValue, setTotalValue] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    fetchStashTotalValue(ownerId)
      .then((value) => {
        if (!isCancelled) {
          setTotalValue(value);
          setErrorMessage(null);
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          const message =
            error instanceof Error ? error.message : "Ukjent feil.";
          setErrorMessage(message);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [ownerId]);

  return (
    <div className="widget-stash-value">
      <input
        type="text"
        className="widget-stash-value__label"
        value={data.label ?? ""}
        placeholder="Navn på widgeten"
        onChange={(event) => onChange({ label: event.target.value })}
      />
      {isLoading ? (
        <p className="widget-stash-value__state">Henter verdi...</p>
      ) : errorMessage ? (
        <p className="widget-stash-value__state">{errorMessage}</p>
      ) : (
        <div className="widget-stash-value__amount">{totalValue} kr</div>
      )}
      <p className="widget-stash-value__hint">
        Summen av alle priser i hobbybiblioteket ditt.
      </p>
    </div>
  );
}
