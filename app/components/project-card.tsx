import type { ProjectItem } from "~/types/project";
import {
  formatCurrencyNok,
  statusClassName,
  statusLabel,
} from "~/utils/project-display";

type ProjectCardProps = {
  project: ProjectItem;
  onSelect: (project: ProjectItem) => void;
};

export function ProjectCard({ project, onSelect }: ProjectCardProps) {
  const previewImage = project.imageUrls?.[0] ?? project.imageUrl;

  return (
    <article className="project-card">
      <button
        type="button"
        className="project-card__button"
        onClick={() => onSelect(project)}
        aria-label={`Se detaljer for ${project.title}`}
      >
        <div className="project-image-wrapper">
          {previewImage ? (
            <img src={previewImage} alt={project.title} className="project-image" />
          ) : (
            <div className="project-image-placeholder" aria-hidden="true">
              Legg til bilde
            </div>
          )}
        </div>

        <div className="project-card__content">
          <div className="project-card__header">
            <h2>{project.title}</h2>
            <span className={statusClassName[project.status]}>
              {statusLabel[project.status]}
            </span>
          </div>

          <p>{project.description}</p>

          {project.status === "solgt" ? (
            typeof project.soldPriceNok === "number" ? (
              <p className="sold-price">
                Solgt for <strong>{formatCurrencyNok(project.soldPriceNok)}</strong>
              </p>
            ) : (
              <p className="sold-price">Pris er ikke lagt inn enda.</p>
            )
          ) : null}
        </div>
      </button>
    </article>
  );
}
