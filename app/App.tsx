import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { AuthProvider } from "~/context/auth-context";
import ExplorePage from "~/routes/explore";
import HomePage from "~/routes/home";
import StashPage from "~/routes/stash";
import UserProfilePage from "~/routes/user-profile";
import UsersPage from "~/routes/users";
import { SiteHeader } from "~/components/site-header";
import "./app.css";

const routeMeta: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Min side | Hjemmelagde Ting",
    description: "Din private oversikt over hjemmelagde prosjekter.",
  },
  "/utforsk": {
    title: "Utforsk | Hjemmelagde Ting",
    description: "Utforsk produkter som andre brukere har delt.",
  },
  "/bibliotek": {
    title: "Hobbybibliotek | Hjemmelagde Ting",
    description: "Oversikt over garn, stoff, perler og annet du har liggende.",
  },
  "/brukere": {
    title: "Brukere | Hjemmelagde Ting",
    description: "Utforsk brukere og deres delte produkter.",
  },
};

function DocumentMeta() {
  const location = useLocation();
  const meta = location.pathname.startsWith("/profil/")
    ? {
        title: "Brukerprofil | Hjemmelagde Ting",
        description: "Se delte produkter og profilinformasjon for en bruker.",
      }
    : (routeMeta[location.pathname] ?? routeMeta["/"]);

  useEffect(() => {
    document.title = meta.title;

    const descriptionTag =
      document.querySelector('meta[name="description"]') ??
      document.createElement("meta");
    descriptionTag.setAttribute("name", "description");
    descriptionTag.setAttribute("content", meta.description);

    if (!descriptionTag.parentElement) {
      document.head.appendChild(descriptionTag);
    }
  }, [meta.description, meta.title]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="page">
        <DocumentMeta />
        <SiteHeader />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/utforsk" element={<ExplorePage />} />
          <Route path="/bibliotek" element={<StashPage />} />
          <Route path="/profil" element={<Navigate to="/" replace />} />
          <Route path="/profil/:username" element={<UserProfilePage />} />
          <Route path="/brukere" element={<UsersPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}
