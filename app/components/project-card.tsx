import type { KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import type { ProjectItem } from "~/types/project";
import {
  formatCurrencyNok,
  statusClassName,
  statusLabel,
} from "~/utils/project-display";

type ProjectCardProps = {
  project: ProjectItem;
  onSelect?: (project: ProjectItem) => void;
  showOwner?: boolean;
  showLikes?: boolean;
  showStatus?: boolean;
  showShareState?: boolean;
  ownerProfileHref?: string;
};

export function ProjectCard({
  project,
  onSelect,
  showOwner = false,
  showLikes = false,
  showStatus = true,
  showShareState = false,
  ownerProfileHref,
}: ProjectCardProps) {
  const previewImage = project.imageUrls?.[0] ?? project.imageUrl;
  const isInteractive = typeof onSelect === "function";
  const handleSelect = () => {
    if (!onSelect) {
      return;
    }

    onSelect(project);
  };

  return (
    <article className="project-card">
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
            <h2>{project.title}</h2>
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

          {project.description ? <p>{project.description}</p> : null}

          {showStatus && project.status === "solgt" ? (
            typeof project.soldPriceNok === "number" ? (
              <p className="sold-price">
                Solgt for <strong>{formatCurrencyNok(project.soldPriceNok)}</strong>
              </p>
            ) : (
              <p className="sold-price">Pris er ikke lagt inn enda.</p>
            )
          ) : null}

          {typeof project.madeYear === "number" ? (
            <p className="project-meta project-meta--year">Laget i {project.madeYear}</p>
          ) : null}

          {showLikes ? (
            <p className="project-meta">
              {project.likeCount} {project.likeCount === 1 ? "like" : "likes"}
            </p>
          ) : null}
        </div>
      </div>
      {showOwner && project.ownerUsername ? (
        <div className="project-card__owner-row">
          <span className="project-meta">Av </span>
          {ownerProfileHref ? (
            <Link className="project-card__owner-link" to={ownerProfileHref}>
              {project.ownerUsername}
            </Link>
          ) : (
            <span className="project-meta">{project.ownerUsername}</span>
          )}
        </div>
      ) : null}
    </article>
  );
}
