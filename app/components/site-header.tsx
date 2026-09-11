import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useAuth } from "~/context/auth-context";
import { signOut } from "~/lib/auth";

const LOGO_SRC = `${import.meta.env.BASE_URL}images/logo.png`;

type IndicatorStyle = {
  left: number;
  width: number;
  ready: boolean;
};

export function SiteHeader() {
  const location = useLocation();
  const { user, profile } = useAuth();
  const navRef = useRef<HTMLElement | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<IndicatorStyle>({
    left: 0,
    width: 0,
    ready: false,
  });

  useEffect(() => {
    const updateIndicator = () => {
      const navElement = navRef.current;
      if (!navElement) {
        return;
      }

      const activeLink = navElement.querySelector(".site-nav__link--active");
      if (!(activeLink instanceof HTMLElement)) {
        setIndicatorStyle((current) => ({ ...current, ready: false }));
        return;
      }

      const navRect = navElement.getBoundingClientRect();
      const activeRect = activeLink.getBoundingClientRect();
      setIndicatorStyle({
        left: activeRect.left - navRect.left,
        width: activeRect.width,
        ready: true,
      });
    };

    const animationFrame = requestAnimationFrame(updateIndicator);
    window.addEventListener("resize", updateIndicator);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [location.pathname]);

  const navClassName = ({ isActive }: { isActive: boolean }) =>
    isActive ? "site-nav__link site-nav__link--active" : "site-nav__link";

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="site-logo" aria-label="Logo">
          {LOGO_SRC ? (
            <img src={LOGO_SRC} alt="Logo" className="site-logo__image" />
          ) : (
            <span>Logo</span>
          )}
        </div>

        <nav className="site-nav" aria-label="Hovedmeny" ref={navRef}>
          <span
            className={indicatorStyle.ready ? "site-nav__indicator" : "site-nav__indicator is-hidden"}
            style={{
              width: `${indicatorStyle.width}px`,
              transform: `translateX(${indicatorStyle.left}px)`,
            }}
            aria-hidden="true"
          />
          <NavLink to="/" end className={navClassName}>
            Min side
          </NavLink>
          <NavLink to="/utforsk" className={navClassName}>
            Utforsk
          </NavLink>
        </nav>

        {user ? (
          <div className="site-user">
            <NavLink
              to="/favoritter"
              className={({ isActive }) =>
                isActive
                  ? "header-icon-link header-icon-link--active"
                  : "header-icon-link"
              }
              aria-label="Favoritter"
              title="Favoritter"
            >
              ❤
            </NavLink>
            <span className="site-user__name">{profile?.username ?? user.email}</span>
            <button
              type="button"
              className="secondary-button site-user__logout"
              onClick={() => {
                void signOut();
              }}
            >
              Logg ut
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
