import { useEffect, useRef, useState } from "react";
import { AddWidgetModal } from "~/components/add-widget-modal";
import { CounterWidget } from "~/components/dashboard-widget-counter";
import { CountdownWidget } from "~/components/dashboard-widget-countdown";
import { NoteWidget } from "~/components/dashboard-widget-note";
import { StashValueWidget } from "~/components/dashboard-widget-stash-value";
import {
  createDashboardWidget,
  deleteDashboardWidget,
  fetchDashboardWidgets,
  reorderDashboardWidgets,
  updateDashboardWidgetData,
  updateDashboardWidgetSize,
} from "~/lib/dashboard";
import type {
  CounterWidgetData,
  CountdownWidgetData,
  DashboardWidget,
  NoteWidgetData,
  StashValueWidgetData,
  WidgetSize,
  WidgetType,
} from "~/types/dashboard";
import { WIDGET_TYPE_LABELS } from "~/types/dashboard";

type DashboardPanelProps = {
  ownerId: string;
};

const SIZE_ORDER: WidgetSize[] = ["small", "medium", "large"];
const SAVE_DELAY_MS = 700;

export function DashboardPanel({ ownerId }: DashboardPanelProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    const load = async () => {
      try {
        const data = await fetchDashboardWidgets(ownerId);
        if (!isCancelled) {
          setWidgets(data);
          setErrorMessage(null);
        }
      } catch (error) {
        if (!isCancelled) {
          const message =
            error instanceof Error ? error.message : "Ukjent feil.";
          setErrorMessage(message);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isCancelled = true;
    };
  }, [ownerId]);

  useEffect(() => {
    const timers = saveTimers.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const scheduleSave = (widgetId: string, data: DashboardWidget["data"]) => {
    const timers = saveTimers.current;
    const existingTimer = timers.get(widgetId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      void updateDashboardWidgetData(widgetId, data).catch((error) => {
        const message =
          error instanceof Error ? error.message : "Ukjent feil.";
        setErrorMessage(message);
      });
      timers.delete(widgetId);
    }, SAVE_DELAY_MS);

    timers.set(widgetId, timer);
  };

  const handleWidgetDataChange = (
    widgetId: string,
    data: DashboardWidget["data"],
  ) => {
    setWidgets((current) =>
      current.map((widget) =>
        widget.id === widgetId ? { ...widget, data } : widget,
      ),
    );
    scheduleSave(widgetId, data);
  };

  const handleAddWidget = async (type: WidgetType, size: WidgetSize) => {
    setIsAdding(true);
    setErrorMessage(null);
    try {
      const nextPosition = widgets.length;
      const created = await createDashboardWidget(
        ownerId,
        type,
        size,
        nextPosition,
      );
      setWidgets((current) => [...current, created]);
      setIsAddModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ukjent feil.";
      setErrorMessage(message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveWidget = async (widgetId: string) => {
    const previous = widgets;
    setWidgets((current) => current.filter((widget) => widget.id !== widgetId));
    try {
      await deleteDashboardWidget(widgetId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ukjent feil.";
      setErrorMessage(message);
      setWidgets(previous);
    }
  };

  const handleCycleSize = async (widget: DashboardWidget) => {
    const currentIndex = SIZE_ORDER.indexOf(widget.size);
    const nextSize = SIZE_ORDER[(currentIndex + 1) % SIZE_ORDER.length];

    setWidgets((current) =>
      current.map((item) =>
        item.id === widget.id ? { ...item, size: nextSize } : item,
      ),
    );

    try {
      await updateDashboardWidgetSize(widget.id, nextSize);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ukjent feil.";
      setErrorMessage(message);
    }
  };

  const handleDrop = (overId: string) => {
    if (!draggedId || draggedId === overId) {
      setDraggedId(null);
      return;
    }

    const draggedIndex = widgets.findIndex((item) => item.id === draggedId);
    const overIndex = widgets.findIndex((item) => item.id === overId);
    if (draggedIndex === -1 || overIndex === -1) {
      setDraggedId(null);
      return;
    }

    const next = [...widgets];
    const [moved] = next.splice(draggedIndex, 1);
    next.splice(overIndex, 0, moved);
    setWidgets(next);
    setDraggedId(null);

    void reorderDashboardWidgets(
      next.map((widget, index) => ({ id: widget.id, position: index })),
    ).catch((error) => {
      const message = error instanceof Error ? error.message : "Ukjent feil.";
      setErrorMessage(message);
    });
  };

  return (
    <section className="dashboard-panel" aria-label="Dashboard">
      <div className="dashboard-panel__toolbar">
        <button
          type="button"
          className={isEditing ? "primary-button" : "secondary-button"}
          onClick={() => setIsEditing((current) => !current)}
        >
          {isEditing ? "Ferdig" : "Rediger"}
        </button>
        {isEditing ? (
          <button
            type="button"
            className="secondary-button"
            onClick={() => setIsAddModalOpen(true)}
          >
            + Legg til widget
          </button>
        ) : null}
      </div>

      {isLoading ? <p className="state-message">Laster dashboard...</p> : null}
      {errorMessage ? (
        <p className="state-message error">{errorMessage}</p>
      ) : null}

      {!isLoading && !errorMessage && widgets.length === 0 ? (
        <p className="state-message">
          Ingen widgets enda. Trykk «Rediger» og legg til din første widget.
        </p>
      ) : null}

      {widgets.length > 0 ? (
        <div className="dashboard-grid">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className={`dashboard-widget dashboard-widget--${widget.size}${
                isEditing ? " is-editing" : ""
              }${draggedId === widget.id ? " is-dragging" : ""}`}
              draggable={isEditing}
              onDragStart={() => setDraggedId(widget.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(widget.id)}
            >
              {isEditing ? (
                <div className="dashboard-widget__toolbar">
                  <span
                    className="dashboard-widget__drag-handle"
                    aria-hidden="true"
                    title="Dra for å flytte"
                  >
                    ⠿
                  </span>
                  <span className="dashboard-widget__type">
                    {WIDGET_TYPE_LABELS[widget.type]}
                  </span>
                  <button
                    type="button"
                    className="dashboard-widget__size-button"
                    onClick={() => handleCycleSize(widget)}
                    title="Bytt størrelse"
                  >
                    {widget.size === "small"
                      ? "S"
                      : widget.size === "medium"
                        ? "M"
                        : "L"}
                  </button>
                  <button
                    type="button"
                    className="dashboard-widget__remove"
                    aria-label="Fjern widget"
                    onClick={() => void handleRemoveWidget(widget.id)}
                  >
                    <span
                      className="icon-mark icon-mark--close icon-mark--small"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              ) : null}

              <div className="dashboard-widget__body">
                {widget.type === "counter" ? (
                  <CounterWidget
                    data={widget.data as CounterWidgetData}
                    onChange={(data) => handleWidgetDataChange(widget.id, data)}
                  />
                ) : null}
                {widget.type === "countdown" ? (
                  <CountdownWidget
                    data={widget.data as CountdownWidgetData}
                    onChange={(data) => handleWidgetDataChange(widget.id, data)}
                  />
                ) : null}
                {widget.type === "note" ? (
                  <NoteWidget
                    data={widget.data as NoteWidgetData}
                    onChange={(data) => handleWidgetDataChange(widget.id, data)}
                  />
                ) : null}
                {widget.type === "stash-value" ? (
                  <StashValueWidget
                    ownerId={ownerId}
                    data={widget.data as StashValueWidgetData}
                    onChange={(data) => handleWidgetDataChange(widget.id, data)}
                  />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {isAddModalOpen ? (
        <AddWidgetModal
          isSubmitting={isAdding}
          onAdd={(type, size) => void handleAddWidget(type, size)}
          onClose={() => setIsAddModalOpen(false)}
        />
      ) : null}
    </section>
  );
}
