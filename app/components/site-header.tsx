import { NavLink } from "react-router";

const LOGO_SRC = "images/logo.png";

export function SiteHeader() {
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

        <nav className="site-nav" aria-label="Hovedmeny">
          <NavLink to="/" end className={navClassName}>
            Produkter
          </NavLink>
          <NavLink to="/legg-til-produkt" className={navClassName}>
            Legg til produkt
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
