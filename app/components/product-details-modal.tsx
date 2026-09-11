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
  canEdit?: boolean;
  canDelete?: boolean;
  showStatus?: boolean;
  showFavoriteToggle?: boolean;
  showShareToggle?: boolean;
  shareLabel?: string;
  showLikeToggle?: boolean;
  onToggleFavorite?: (
    project: ProjectItem,
    isFavorite: boolean,
  ) => Promise<void>;
  onToggleShare?: (project: ProjectItem, isShared: boolean) => Promise<void>;
  onToggleLike?: (project: ProjectItem, shouldLike: boolean) => Promise<void>;
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
  canEdit = true,
  canDelete = true,
  showStatus = true,
  showFavoriteToggle = true,
  showShareToggle = false,
  shareLabel = "Del med venner",
  showLikeToggle = false,
  onToggleFavorite,
  onToggleShare,
  onToggleLike,
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
  const [editableImageUrls, setEditableImageUrls] = useState<string[]>(imageUrls);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description ?? "");
  const [details, setDetails] = useState(project.details ?? "");
  const [madeYearInput, setMadeYearInput] = useState(project.madeYear?.toString() ?? "");
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

  const activeImageUrls = isEditing ? editableImageUrls : imageUrls;
  const hasMultipleImages = activeImageUrls.length > 1;
  const shouldShowThumbnails = isEditing
    ? activeImageUrls.length > 0
    : hasMultipleImages;
  const currentImage = activeImageUrls[currentImageIndex];

  const goToPreviousImage = () => {
    if (activeImageUrls.length < 2) {
      return;
    }

    setCurrentImageIndex((current) =>
      current === 0 ? activeImageUrls.length - 1 : current - 1,
    );
  };

  const goToNextImage = () => {
    if (activeImageUrls.length < 2) {
      return;
    }

    setCurrentImageIndex((current) =>
      current === activeImageUrls.length - 1 ? 0 : current + 1,
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
    setEditableImageUrls(imageUrls);
    setTitle(project.title);
    setDescription(project.description ?? "");
    setDetails(project.details ?? "");
    setMadeYearInput(project.madeYear?.toString() ?? "");
    setStatus(project.status);
    setSoldPriceInput(project.soldPriceNok?.toString() ?? "");
    setPreviewFocusX(project.previewFocusX ?? 50);
    setPreviewFocusY(project.previewFocusY ?? 50);
    setCoverImageUrl(imageUrls[0] ?? null);
  }, [imageUrls, project]);

  useEffect(() => {
    if (activeImageUrls.length === 0) {
      setCurrentImageIndex(0);
      return;
    }

    if (currentImageIndex > activeImageUrls.length - 1) {
      setCurrentImageIndex(activeImageUrls.length - 1);
    }
  }, [activeImageUrls, currentImageIndex]);

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

  const resetEditState = () => {
    setEditFormError(null);
    setTitle(project.title);
    setDescription(project.description ?? "");
    setDetails(project.details ?? "");
    setMadeYearInput(project.madeYear?.toString() ?? "");
    setStatus(project.status);
    setSoldPriceInput(project.soldPriceNok?.toString() ?? "");
    setEditableImageUrls(imageUrls);
    setCoverImageUrl(imageUrls[0] ?? null);
    setPreviewFocusX(project.previewFocusX ?? 50);
    setPreviewFocusY(project.previewFocusY ?? 50);
    setCurrentImageIndex(0);
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

    let soldPriceNok: number | undefined;
    let madeYear: number | undefined;
    const maxAllowedYear = new Date().getFullYear() + 1;

    if (madeYearInput.trim()) {
      const parsedYear = Number(madeYearInput);
      if (
        !Number.isInteger(parsedYear) ||
        parsedYear < 1900 ||
        parsedYear > maxAllowedYear
      ) {
        setEditFormError(`Årstall må være et heltall mellom 1900 og ${maxAllowedYear}.`);
        return;
      }

      madeYear = parsedYear;
    }

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
    if (editableImageUrls.length + newImageFiles.length === 0) {
      setEditFormError("Produkt må ha minst ett bilde.");
      return;
    }

    const wasUpdated = await onUpdate(project, {
      title: trimmedTitle,
      description: trimmedDescription,
      details: trimmedDetails || undefined,
      madeYear,
      status,
      soldPriceNok,
      keptImageUrls: editableImageUrls,
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

  const handleRemoveImage = (index: number) => {
    const imageUrlToRemove = editableImageUrls[index];
    if (!imageUrlToRemove) {
      return;
    }

    const nextImageUrls = editableImageUrls.filter((_, currentIndex) => currentIndex !== index);
    setEditableImageUrls(nextImageUrls);

    if (coverImageUrl === imageUrlToRemove) {
      setCoverImageUrl(nextImageUrls[0] ?? null);
      setPreviewFocusX(50);
      setPreviewFocusY(50);
    }

    setCurrentImageIndex((current) => {
      if (current > index) {
        return current - 1;
      }

      if (current === index) {
        return index > 0 ? index - 1 : 0;
      }

      return current;
    });
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
          <span className="icon-mark icon-mark--close" aria-hidden="true" />
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
                      <span className="modal-image-nav__glyph" aria-hidden="true">‹</span>
                    </button>
                    <button
                      type="button"
                      className="modal-image-nav modal-image-nav--next"
                      onClick={goToNextImage}
                      aria-label="Neste bilde"
                    >
                      <span className="modal-image-nav__glyph" aria-hidden="true">›</span>
                    </button>
                    <p className="modal-image-counter">
                      {currentImageIndex + 1} / {activeImageUrls.length}
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
              {showStatus ? (
                <span className={statusClassName[isEditing ? status : project.status]}>
                  {statusLabel[isEditing ? status : project.status]}
                </span>
              ) : null}
              {!isEditing && project.ownerUsername ? (
                <p className="project-meta">Av {project.ownerUsername}</p>
              ) : null}
              {!isEditing && showLikeToggle ? (
                <p className="project-meta">
                  {project.likeCount} {project.likeCount === 1 ? "like" : "likes"}
                </p>
              ) : null}
            </div>

            {isEditing && canEdit ? (
              <form
                id={`edit-product-form-${project.id}`}
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
                  Kort beskrivelse (valgfritt)
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

                {showStatus ? (
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
                      <option value="gave">Gave</option>
                    </select>
                  </label>
                ) : null}

                <label className="form-field">
                  År laget (valgfritt)
                  <input
                    type="number"
                    min={1900}
                    max={new Date().getFullYear() + 1}
                    step={1}
                    value={madeYearInput}
                    onChange={(event) => setMadeYearInput(event.target.value)}
                    disabled={isUpdating}
                  />
                </label>

                {showStatus && status === "solgt" ? (
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

              </form>
            ) : (
              <>
                {project.description ? <p>{project.description}</p> : null}
                {typeof project.madeYear === "number" ? (
                  <p className="project-meta">Laget i {project.madeYear}</p>
                ) : null}
                {project.details ? <p>{project.details}</p> : null}
                {showStatus && project.status === "solgt" ? (
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

            {shouldShowThumbnails ? (
              <div className="modal-thumbnails" aria-label="Flere bilder">
                {activeImageUrls.map((url, index) => (
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
                    {isEditing ? (
                      <button
                        type="button"
                        className="modal-thumbnail__remove"
                        aria-label={`Fjern bilde ${index + 1}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemoveImage(index);
                        }}
                      >
                        <span className="icon-mark icon-mark--close icon-mark--small" aria-hidden="true" />
                      </button>
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

            {isEditing ? (
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    resetEditState();
                    setIsEditing(false);
                  }}
                  disabled={isUpdating}
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  form={`edit-product-form-${project.id}`}
                  className="primary-button"
                  disabled={isUpdating}
                >
                  {isUpdating ? "Lagrer..." : "Lagre endringer"}
                </button>
              </div>
            ) : null}

            {!isEditing ? (
              <div className="modal-actions">
                {showFavoriteToggle ? (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => onToggleFavorite?.(project, !project.isFavorite)}
                    disabled={isUpdating || isDeleting}
                  >
                    {project.isFavorite ? "Fjern fra favoritter" : "Legg til favoritter"}
                  </button>
                ) : null}
                {showShareToggle ? (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => onToggleShare?.(project, !project.isShared)}
                    disabled={isUpdating || isDeleting}
                  >
                    {project.isShared ? "Ikke del med venner" : shareLabel}
                  </button>
                ) : null}
                {showLikeToggle ? (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => onToggleLike?.(project, !project.likedByMe)}
                    disabled={isUpdating}
                  >
                    {project.likedByMe ? "Fjern like" : "Lik produkt"}
                  </button>
                ) : null}
                {canEdit ? (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      resetEditState();
                      setIsEditing(true);
                    }}
                  >
                    Rediger produkt
                  </button>
                ) : null}
                {canDelete ? (
                  <button
                    type="button"
                    className="danger-button"
                    disabled={isDeleting}
                    onClick={() => onDelete(project)}
                  >
                    {isDeleting ? "Sletter..." : "Slett produkt"}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
