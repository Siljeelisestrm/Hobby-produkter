import { useEffect, useState } from "react";

const LOGO_SRC = `${import.meta.env.BASE_URL}hobby-icon.png`;
const FALLBACK_LOGO = `${import.meta.env.BASE_URL}images/logo.png`;

type SplashScreenProps = {
  isLoading: boolean;
};

export function SplashScreen({ isLoading }: SplashScreenProps) {
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [logoSrc, setLogoSrc] = useState(LOGO_SRC);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, 650);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading && minTimePassed) {
      setFadeOut(true);
      const timer = setTimeout(() => setVisible(false), 380);
      return () => clearTimeout(timer);
    }
  }, [isLoading, minTimePassed]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`splash-screen ${fadeOut ? "splash-screen--fade-out" : ""}`}
      aria-label="Laster inn appen..."
    >
      <div className="splash-screen__content">
        <img
          src={logoSrc}
          alt="Hjemmelagde Ting Logo"
          className="splash-screen__logo"
          onError={() => setLogoSrc(FALLBACK_LOGO)}
        />
        <div className="splash-screen__spinner" />
      </div>
    </div>
  );
}
