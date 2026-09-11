import type { KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import type { ProjectItem } from "~/types/project";
import { statusClassName, statusLabel } from "~/utils/project-display";

type ProjectCardProps = {
  project: ProjectItem;
  onSelect?: (project: ProjectItem) => void;
  showOwner?: boolean;
  showLikes?: boolean;
  showLikeButton?: boolean;
  isLikeUpdating?: boolean;
  showStatus?: boolean;
  showShareState?: boolean;
  ownerProfileHref?: string;
  onToggleLike?: (project: ProjectItem, shouldLike: boolean) => Promise<void>;
};

export function ProjectCard({
  project,
  onSelect,
  showOwner = false,
  showLikes = false,
  showLikeButton = false,
  isLikeUpdating = false,
  showStatus = true,
  showShareState = false,
  ownerProfileHref,
  onToggleLike,
}: ProjectCardProps) {
  const previewImage = project.imageUrls?.[0] ?? project.imageUrl;
  const isInteractive = typeof onSelect === "function";
  const ownerInitial = (project.ownerUsername ?? "U").slice(0, 1).toUpperCase();
  const handleSelect = () => {
    if (!onSelect) {
      return;
    }

    onSelect(project);
  };

  return (
    <article className="project-card">
      {showOwner && project.ownerUsername ? (
        <div className="project-card__owner-header">
          {ownerProfileHref ? (
            <Link className="project-card__owner-link-row" to={ownerProfileHref}>
              <span className="project-card__owner-avatar" aria-hidden="true">
                {project.ownerAvatarUrl ? (
                  <img src={project.ownerAvatarUrl} alt="" />
                ) : (
                  <span>{ownerInitial}</span>
                )}
              </span>
              <span className="project-card__owner-name">{project.ownerUsername}</span>
            </Link>
          ) : (
            <div className="project-card__owner-link-row">
              <span className="project-card__owner-avatar" aria-hidden="true">
                {project.ownerAvatarUrl ? (
                  <img src={project.ownerAvatarUrl} alt="" />
                ) : (
                  <span>{ownerInitial}</span>
                )}
              </span>
              <span className="project-card__owner-name">{project.ownerUsername}</span>
            </div>
          )}
        </div>
      ) : null}

      <div
        className={isInteractive ? "project-card__button is-clickable" : "project-card__button"}
        {...(isInteractive
          ? {
              role: "button",
              tabIndex: 0,
              onClick: handleSelect,
              onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleSelect();
                }
              },
              "aria-label": `Se detaljer for ${project.title}`,
            }
          : {})}
      >
        <div className="project-image-wrapper">
          {previewImage ? (
            <img
              src={previewImage}
              alt={project.title}
              className="project-image"
              style={{
                objectPosition: `${project.previewFocusX ?? 50}% ${
                  project.previewFocusY ?? 50
                }%`,
              }}
            />
          ) : (
            <div className="project-image-placeholder" aria-hidden="true">
              Legg til bilde
            </div>
          )}
        </div>

        <div className="project-card__content">
          <div className="project-card__header">
            <div className="project-card__title-row">
              {showLikeButton ? (
                <button
                  type="button"
                  className={
                    project.likedByMe
                      ? "project-card__like-button is-active"
                      : "project-card__like-button"
                  }
                  aria-label={project.likedByMe ? "Fjern like" : "Lik produkt"}
                  title={project.likedByMe ? "Fjern like" : "Lik produkt"}
                  disabled={isLikeUpdating}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void onToggleLike?.(project, !project.likedByMe);
                  }}
                >
                  {project.likedByMe ? "♥" : "♡"}
                </button>
              ) : null}
              <h2>{project.title}</h2>
            </div>
            {showStatus ? (
              <span className={statusClassName[project.status]}>
                {statusLabel[project.status]}
              </span>
            ) : null}
          </div>

          {showShareState ? (
            <p className="project-meta">
              {project.isShared ? "Publisert" : "Ikke publisert"}
            </p>
          ) : null}

          {showLikes ? (
            <p className="project-meta">
              {project.likeCount} {project.likeCount === 1 ? "like" : "likes"}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
