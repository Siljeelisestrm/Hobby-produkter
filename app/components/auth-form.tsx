import { useState } from "react";
import type { FormEvent } from "react";
import { signInWithEmail, signUpWithEmail } from "~/lib/auth";
import { useAuth } from "~/context/auth-context";

export function AuthForm() {
  const { refreshProfile } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const username = String(formData.get("username") ?? "").trim();
    const bio = String(formData.get("bio") ?? "").trim();
    const avatarFileRaw = formData.get("avatarFile");
    const avatarFile =
      avatarFileRaw instanceof File && avatarFileRaw.size > 0
        ? avatarFileRaw
        : undefined;

    try {
      if (mode === "signup") {
        if (!username) {
          throw new Error("Brukernavn er påkrevd ved registrering.");
        }

        await signUpWithEmail({
          email,
          password,
          username,
          bio: bio || undefined,
          avatarFile,
        });
        setInfoMessage("Konto opprettet. Sjekk e-post hvis bekreftelse er slått på.");
      } else {
        await signInWithEmail({ email, password });
      }

      await refreshProfile();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Ukjent feil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-panel" aria-label="Logg inn eller opprett konto">
      <div className="auth-panel__tabs" role="tablist" aria-label="Innlogging">
        <button
          type="button"
          className={mode === "signin" ? "secondary-button is-active" : "secondary-button"}
          onClick={() => setMode("signin")}
        >
          Logg inn
        </button>
        <button
          type="button"
          className={mode === "signup" ? "secondary-button is-active" : "secondary-button"}
          onClick={() => setMode("signup")}
        >
          Opprett profil
        </button>
      </div>

      <form className="product-form auth-form" onSubmit={handleSubmit}>
        <label className="form-field">
          E-post
          <input name="email" type="email" required disabled={isSubmitting} />
        </label>

        <label className="form-field">
          Passord
          <input name="password" type="password" minLength={6} required disabled={isSubmitting} />
        </label>

        {mode === "signup" ? (
          <>
            <label className="form-field">
              Brukernavn
              <input name="username" type="text" required disabled={isSubmitting} />
            </label>

            <label className="form-field">
              Kort bio (valgfritt)
              <textarea name="bio" rows={2} disabled={isSubmitting} />
            </label>

            <label className="form-field">
              Profilbilde (valgfritt)
              <input
                name="avatarFile"
                type="file"
                accept="image/*"
                disabled={isSubmitting}
              />
            </label>
          </>
        ) : null}

        {errorMessage ? <p className="state-message error">{errorMessage}</p> : null}
        {infoMessage ? <p className="state-message success">{infoMessage}</p> : null}

        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting
            ? "Jobber..."
            : mode === "signup"
              ? "Opprett konto"
              : "Logg inn"}
        </button>
      </form>
    </section>
  );
}
