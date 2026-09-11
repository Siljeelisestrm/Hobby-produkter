import { useEffect } from "react";

import type { ProjectItem } from "~/types/project";
import {
  formatCurrencyNok,
  statusClassName,
  statusLabel,
} from "~/utils/project-display";

type ProductDetailsModalProps = {
  project: ProjectItem;
  isDeleting: boolean;
  deleteErrorMessage: string | null;
  onDelete: (project: ProjectItem) => Promise<void>;
  onClose: () => void;
};

export function ProductDetailsModal({
  project,
  isDeleting,
  deleteErrorMessage,
  onDelete,
  onClose,
}: ProductDetailsModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Detaljer for ${project.title}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Lukk detaljvisning"
        >
          ×
        </button>

        <div className="modal-layout">
          <div className="modal-image-wrapper">
            {project.imageUrl ? (
              <img
                src={project.imageUrl}
                alt={project.title}
                className="modal-image"
              />
            ) : (
              <div className="project-image-placeholder" aria-hidden="true">
                Legg til bilde
              </div>
            )}
          </div>

          <div className="modal-details">
            <div className="modal-heading">
              <h2>{project.title}</h2>
              <span className={statusClassName[project.status]}>
                {statusLabel[project.status]}
              </span>
            </div>
            <p>{project.description}</p>
            {project.details ? <p>{project.details}</p> : null}
            {project.status === "solgt" ? (
              typeof project.soldPriceNok === "number" ? (
                <p className="sold-price">
                  Solgt for{" "}
                  <strong>{formatCurrencyNok(project.soldPriceNok)}</strong>
                </p>
              ) : (
                <p className="sold-price">Pris er ikke lagt inn enda.</p>
              )
            ) : null}

            {deleteErrorMessage ? (
            <p className="state-message error modal-error-message">{deleteErrorMessage}</p>
            ) : null}

            <div className="modal-actions">
            <button
              type="button"
              className="danger-button"
              disabled={isDeleting}
              onClick={() => onDelete(project)}
            >
              {isDeleting ? "Sletter..." : "Slett produkt"}
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
