import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthForm } from "~/components/auth-form";
import { useAuth } from "~/context/auth-context";
import { signOut, updateUserProfile } from "~/lib/auth";

export default function ProfilePage() {
  const { user, profile, isLoading: isAuthLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [avatarFile, setAvatarFile] = useState<File | undefined>(undefined);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    profile?.avatarUrl ?? null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (isAuthLoading) {
    return (
      <main className="content">
        <p className="state-message">Laster profil...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="content">
        <section className="intro">
          <h1>Min profil</h1>
          <p>Logg inn for å se profilen din.</p>
        </section>
        <AuthForm />
      </main>
    );
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleStartEdit = () => {
    setUsername(profile?.username ?? "");
    setBio(profile?.bio ?? "");
    setAvatarFile(undefined);
    setAvatarPreview(profile?.avatarUrl ?? null);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrorMessage(null);
  };

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await updateUserProfile(user.id, {
        username: username.trim() || undefined,
        bio,
        avatarFile,
      });
      await refreshProfile();
      setSuccessMessage("Profilen ble oppdatert!");
      setIsEditing(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Klarte ikke oppdatere profilen.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate("/", { replace: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Klarte ikke logge ut.";
      setErrorMessage(message);
      setIsLoggingOut(false);
    }
  };

  const currentAvatar = avatarPreview || profile?.avatarUrl;

  return (
    <main className="content profile-page" aria-label="Min profil">
      {/*   <div className="profile-page__nav">
        <Link to="/" className="profile-back-link">
          <span aria-hidden="true">←</span> Tilbake til Min side
        </Link>
        <div className="intro-top">
          <h1>Min profil</h1>
        </div>
      </div> */}

      <section className="intro">
        <div className="intro-top">
          <Link to="/" className="profile-back-link">
            <span aria-hidden="true">←</span>
          </Link>
          <h1>Min profil</h1>
        </div>
      </section>

      {successMessage ? (
        <p className="state-message success">{successMessage}</p>
      ) : null}
      {errorMessage ? (
        <p className="state-message error">{errorMessage}</p>
      ) : null}

      <div className="profile-card">
        <div className="profile-card__header">
          <div className="profile-card__avatar">
            {currentAvatar ? (
              <img src={currentAvatar} alt="" />
            ) : (
              <span>
                {profile?.username
                  ? profile.username.slice(0, 1).toUpperCase()
                  : "👤"}
              </span>
            )}
          </div>

          <div className="profile-card__info">
            <h2 className="profile-card__name">
              {profile?.username ?? "Ingen brukernavn"}
            </h2>
            <p className="profile-card__email">{user.email}</p>
          </div>
        </div>

        {isEditing ? (
          <form className="profile-edit-form" onSubmit={handleSaveProfile}>
            <label className="form-field">
              Brukernavn
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                disabled={isSubmitting}
              />
            </label>

            <label className="form-field">
              Bio / beskrivelse
              <textarea
                rows={2}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Fortell litt om deg selv..."
                disabled={isSubmitting}
              />
            </label>

            <label className="form-field">
              Endre profilbilde
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={isSubmitting}
              />
            </label>

            <div className="profile-edit-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={handleCancelEdit}
                disabled={isSubmitting}
              >
                Avbryt
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Lagrer..." : "Lagre endringer"}
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-card__details">
            <div className="profile-detail-item">
              <span className="profile-detail-item__label">Brukernavn</span>
              <span className="profile-detail-item__value">
                {profile?.username ?? "Ikke satt"}
              </span>
            </div>

            <div className="profile-detail-item">
              <span className="profile-detail-item__label">E-post</span>
              <span className="profile-detail-item__value">{user.email}</span>
            </div>

            <div className="profile-detail-item">
              <span className="profile-detail-item__label">Om meg</span>
              <span className="profile-detail-item__value">
                {profile?.bio || "Ingen bio lagt til enda."}
              </span>
            </div>

            <div className="profile-card__actions">
              <button
                type="button"
                className="secondary-button"
                onClick={handleStartEdit}
              >
                Rediger profil
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="profile-page__logout-section">
        <button
          type="button"
          className="danger-button profile-logout-button"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Logger ut..." : "Logg ut"}
        </button>
      </div>
    </main>
  );
}
