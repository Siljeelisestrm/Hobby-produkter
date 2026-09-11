import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchPublicProfiles,
  type PublicProfileSummary,
} from "~/lib/auth";

export default function UsersPage() {
  const [profiles, setProfiles] = useState<PublicProfileSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    const loadProfiles = async () => {
      try {
        const data = await fetchPublicProfiles();
        if (!isCancelled) {
          setProfiles(data);
          setErrorMessage(null);
        }
      } catch (error) {
        if (!isCancelled) {
          const message = error instanceof Error ? error.message : "Ukjent feil.";
          setErrorMessage(message);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadProfiles();

    return () => {
      isCancelled = true;
    };
  }, []);

  const visibleProfiles = useMemo(
    () =>
      profiles
        .filter((profile) => profile.sharedCount > 0)
        .sort((a, b) => b.sharedCount - a.sharedCount || a.username.localeCompare(b.username)),
    [profiles],
  );

  return (
    <main className="content" aria-label="Brukere">
      <section className="intro">
        <h1>Brukere</h1>
        <p>Finn profiler og se hva andre har delt.</p>
      </section>

      {!isLoading && !errorMessage && visibleProfiles.length > 0 ? (
        <section className="users-summary" aria-label="Oppsummering av brukere">
          <p>
            <strong>{visibleProfiles.length}</strong>{" "}
            {visibleProfiles.length === 1 ? "aktiv profil" : "aktive profiler"}
          </p>
          <p>
            <strong>
              {visibleProfiles.reduce((total, profile) => total + profile.sharedCount, 0)}
            </strong>{" "}
            delte produkter totalt
          </p>
        </section>
      ) : null}

      {isLoading ? <p className="state-message">Laster brukere...</p> : null}
      {errorMessage ? <p className="state-message error">{errorMessage}</p> : null}

      {!isLoading && !errorMessage && visibleProfiles.length === 0 ? (
        <p className="state-message">Ingen brukere med delte produkter enda.</p>
      ) : null}

      {visibleProfiles.length > 0 ? (
        <section className="users-grid" aria-label="Brukeroversikt">
          {visibleProfiles.map((profile) => (
            <Link
              key={profile.id}
              className="user-card"
              to={`/profil/${encodeURIComponent(profile.username)}`}
            >
              <div className="user-card__avatar" aria-hidden="true">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" />
                ) : (
                  <span>{profile.username.slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <div className="user-card__content">
                <h2>{profile.username}</h2>
                <p className="user-card__handle">@{profile.username}</p>
                {profile.bio ? <p>{profile.bio}</p> : null}
                <span className="user-card__count">
                  {profile.sharedCount} delt{" "}
                  {profile.sharedCount === 1 ? "produkt" : "produkter"}
                </span>
              </div>
            </Link>
          ))}
        </section>
      ) : null}
    </main>
  );
}
