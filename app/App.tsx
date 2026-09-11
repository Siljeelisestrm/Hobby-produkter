import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { AuthProvider } from "~/context/auth-context";
import ExplorePage from "~/routes/explore";
import FavoritesPage from "~/routes/favorites";
import HomePage from "~/routes/home";
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
  "/favoritter": {
    title: "Favoritter | Hjemmelagde Ting",
    description: "Produkter du har markert som favoritt.",
  },
};

function DocumentMeta() {
  const location = useLocation();
  const meta = routeMeta[location.pathname] ?? routeMeta["/"];

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
          <Route path="/favoritter" element={<FavoritesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}
