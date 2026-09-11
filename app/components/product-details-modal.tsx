import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

import type { ProjectItem } from "~/types/project";
import type { UpdateProductInput } from "~/lib/products";
import {
  formatCurrencyNok,
  statusClassName,
  statusLabel,
} from "~/utils/project-display";

type ProductDetailsModalProps = {
  project: ProjectItem;
  isDeleting: boolean;
  deleteErrorMessage: string | null;
  isUpdating: boolean;
  updateErrorMessage: string | null;
  onUpdate: (
    project: ProjectItem,
    input: UpdateProductInput,
  ) => Promise<boolean>;
  onDelete: (project: ProjectItem) => Promise<void>;
  onClose: () => void;
};

export function ProductDetailsModal({
  project,
  isDeleting,
  deleteErrorMessage,
  isUpdating,
  updateErrorMessage,
  onUpdate,
  onDelete,
  onClose,
}: ProductDetailsModalProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const imageUrls = useMemo(() => {
    if (project.imageUrls && project.imageUrls.length > 0) {
      return project.imageUrls;
    }

    return project.imageUrl ? [project.imageUrl] : [];
  }, [project.imageUrl, project.imageUrls]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [details, setDetails] = useState(project.details ?? "");
  const [status, setStatus] = useState(project.status);
  const [soldPriceInput, setSoldPriceInput] = useState(
    project.soldPriceNok?.toString() ?? "",
  );
  const [previewFocusX, setPreviewFocusX] = useState(project.previewFocusX ?? 50);
  const [previewFocusY, setPreviewFocusY] = useState(project.previewFocusY ?? 50);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(imageUrls[0] ?? null);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [isDraggingPreview, setIsDraggingPreview] = useState(false);
  const [dragPointerId, setDragPointerId] = useState<number | null>(null);
  const previewEditorRef = useRef<HTMLDivElement | null>(null);

  const hasMultipleImages = imageUrls.length > 1;
  const currentImage = imageUrls[currentImageIndex];

  const goToPreviousImage = () => {
    setCurrentImageIndex((current) =>
      current === 0 ? imageUrls.length - 1 : current - 1,
    );
  };

  const goToNextImage = () => {
    setCurrentImageIndex((current) =>
      current === imageUrls.length - 1 ? 0 : current + 1,
    );
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    if (!isDraggingPreview) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (dragPointerId !== null && event.pointerId !== dragPointerId) {
        return;
      }

      updatePreviewFocusFromPointer(event.clientX, event.clientY);
    };

    const stopDragging = (event: PointerEvent) => {
      if (dragPointerId !== null && event.pointerId !== dragPointerId) {
        return;
      }

      setIsDraggingPreview(false);
      setDragPointerId(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [dragPointerId, isDraggingPreview]);

  useEffect(() => {
    setCurrentImageIndex(0);
    setIsEditing(false);
    setEditFormError(null);
    setTitle(project.title);
    setDescription(project.description);
    setDetails(project.details ?? "");
    setStatus(project.status);
    setSoldPriceInput(project.soldPriceNok?.toString() ?? "");
    setPreviewFocusX(project.previewFocusX ?? 50);
    setPreviewFocusY(project.previewFocusY ?? 50);
    setCoverImageUrl(imageUrls[0] ?? null);
  }, [imageUrls, project]);

  const updatePreviewFocusFromPointer = (clientX: number, clientY: number) => {
    const previewElement = previewEditorRef.current;
    if (!previewElement) {
      return;
    }

    const rect = previewElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setPreviewFocusX(Math.min(100, Math.max(0, x)));
    setPreviewFocusY(Math.min(100, Math.max(0, y)));
  };

  const handleUpdateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEditFormError(null);

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedDetails = details.trim();

    if (!trimmedTitle) {
      setEditFormError("Tittel kan ikke være tom.");
      return;
    }

    if (!trimmedDescription) {
      setEditFormError("Beskrivelse kan ikke være tom.");
      return;
    }

    let soldPriceNok: number | undefined;
    if (status === "solgt") {
      if (!soldPriceInput.trim()) {
        setEditFormError("Legg inn salgspris når status er Solgt.");
        return;
      }

      const parsedPrice = Number(soldPriceInput);
      if (!Number.isInteger(parsedPrice) || parsedPrice < 0) {
        setEditFormError("Salgspris må være et heltall på 0 eller mer.");
        return;
      }

      soldPriceNok = parsedPrice;
    }

    const formData = new FormData(event.currentTarget);
    const newImageFiles = formData
      .getAll("newImageFiles")
      .filter(
        (value): value is File => value instanceof File && value.size > 0,
      );

    const wasUpdated = await onUpdate(project, {
      title: trimmedTitle,
      description: trimmedDescription,
      details: trimmedDetails || undefined,
      status,
      soldPriceNok,
      newImageFiles,
      coverImageUrl: coverImageUrl ?? undefined,
      previewFocusX,
      previewFocusY,
    });

    if (wasUpdated) {
      setIsEditing(false);
      setEditFormError(null);
    }
  };

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
            {currentImage ? (
              <>
                <img
                  src={currentImage}
                  alt={project.title}
                  className="modal-image"
                />
                {hasMultipleImages ? (
                  <>
                    <button
                      type="button"
                      className="modal-image-nav modal-image-nav--prev"
                      onClick={goToPreviousImage}
                      aria-label="Forrige bilde"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="modal-image-nav modal-image-nav--next"
                      onClick={goToNextImage}
                      aria-label="Neste bilde"
                    >
                      ›
                    </button>
                    <p className="modal-image-counter">
                      {currentImageIndex + 1} / {imageUrls.length}
                    </p>
                  </>
                ) : null}
              </>
            ) : (
              <div className="project-image-placeholder" aria-hidden="true">
                Legg til bilde
              </div>
            )}
          </div>

          <div className="modal-details">
            <div>
              <h2>{isEditing ? "Rediger produkt" : project.title}</h2>
              <span className={statusClassName[isEditing ? status : project.status]}>
                {statusLabel[isEditing ? status : project.status]}
              </span>
            </div>

            {isEditing ? (
              <form
                className="product-form modal-edit-form"
                onSubmit={handleUpdateSubmit}
              >
                <label className="form-field">
                  Tittel
                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    disabled={isUpdating}
                  />
                </label>

                <label className="form-field">
                  Kort beskrivelse
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    disabled={isUpdating}
                  />
                </label>

                <label className="form-field">
                  Ekstra detaljer
                  <textarea
                    rows={4}
                    value={details}
                    onChange={(event) => setDetails(event.target.value)}
                    disabled={isUpdating}
                  />
                </label>

                <label className="form-field">
                  Status
                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as ProjectItem["status"])
                    }
                    disabled={isUpdating}
                  >
                    <option value="beholdt">Beholdt</option>
                    <option value="vurderes-solgt">Vurderes solgt</option>
                    <option value="solgt">Solgt</option>
                  </select>
                </label>

                {status === "solgt" ? (
                  <label className="form-field">
                    Salgspris (NOK)
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={soldPriceInput}
                      onChange={(event) =>
                        setSoldPriceInput(event.target.value)
                      }
                      disabled={isUpdating}
                    />
                  </label>
                ) : null}

                <label className="form-field">
                  Legg til flere bilder
                  <input
                    name="newImageFiles"
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={isUpdating}
                  />
                </label>

                {coverImageUrl ? (
                  <div className="preview-adjustment">
                    <p className="preview-adjustment__title">
                      Dra bildet for å velge utsnitt på forsiden
                    </p>
                    <div
                      ref={previewEditorRef}
                      className={
                        isDraggingPreview
                          ? "preview-adjustment__canvas is-dragging"
                          : "preview-adjustment__canvas"
                      }
                      onPointerDown={(event) => {
                        event.preventDefault();
                        setIsDraggingPreview(true);
                        setDragPointerId(event.pointerId);
                        updatePreviewFocusFromPointer(event.clientX, event.clientY);
                      }}
                    >
                      <img
                        src={coverImageUrl}
                        alt=""
                        className="preview-adjustment__image"
                        style={{
                          objectPosition: `${previewFocusX}% ${previewFocusY}%`,
                        }}
                      />
                      <span
                        className="preview-adjustment__handle"
                        style={{
                          left: `${previewFocusX}%`,
                          top: `${previewFocusY}%`,
                        }}
                        aria-hidden="true"
                      />
                    </div>

                    <div className="preview-adjustment__sliders">
                      <label>
                        Horisontal
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={previewFocusX}
                          onChange={(event) =>
                            setPreviewFocusX(Number(event.target.value))
                          }
                        />
                      </label>
                      <label>
                        Vertikal
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={previewFocusY}
                          onChange={(event) =>
                            setPreviewFocusY(Number(event.target.value))
                          }
                        />
                      </label>
                    </div>
                  </div>
                ) : null}

                {editFormError ? (
                  <p className="state-message error modal-error-message">
                    {editFormError}
                  </p>
                ) : null}

                {updateErrorMessage ? (
                  <p className="state-message error modal-error-message">
                    {updateErrorMessage}
                  </p>
                ) : null}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditFormError(null);
                    }}
                    disabled={isUpdating}
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Lagrer..." : "Lagre endringer"}
                  </button>
                </div>
              </form>
            ) : (
              <>
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
              </>
            )}

            {deleteErrorMessage ? (
              <p className="state-message error modal-error-message">
                {deleteErrorMessage}
              </p>
            ) : null}

            {hasMultipleImages ? (
              <div className="modal-thumbnails" aria-label="Flere bilder">
                {imageUrls.map((url, index) => (
                  <button
                    key={url}
                    type="button"
                    className={
                      index === currentImageIndex
                        ? "modal-thumbnail is-active"
                        : "modal-thumbnail"
                    }
                    onClick={() => setCurrentImageIndex(index)}
                    aria-label={`Vis bilde ${index + 1}`}
                  >
                    <img src={url} alt="" />
                    {isEditing && coverImageUrl === url ? (
                      <span className="modal-thumbnail__cover-label">Forside</span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}

            {isEditing && currentImage ? (
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setCoverImageUrl(currentImage);
                    setPreviewFocusX(50);
                    setPreviewFocusY(50);
                  }}
                >
                  Bruk valgt bilde som forside
                </button>
              </div>
            ) : null}

            {!isEditing ? (
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsEditing(true)}
                >
                  Rediger produkt
                </button>
                <button
                  type="button"
                  className="danger-button"
                  disabled={isDeleting}
                  onClick={() => onDelete(project)}
                >
                  {isDeleting ? "Sletter..." : "Slett produkt"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
