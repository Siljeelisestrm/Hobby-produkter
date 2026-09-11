import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import AddProductPage from "~/routes/add-product";
import FavoritesPage from "~/routes/favorites";
import HomePage from "~/routes/home";
import { SiteHeader } from "~/components/site-header";
import "./app.css";

const routeMeta: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Hjemmelagde Ting",
    description: "Personlig oversikt over hjemmelagde prosjekter og salgsstatus.",
  },
  "/legg-til-produkt": {
    title: "Legg til produkt | Hjemmelagde Ting",
    description: "Legg til nytt produkt med bilde og status.",
  },
  "/favoritter": {
    title: "Favoritter | Hjemmelagde Ting",
    description: "Produkter markert som favoritt.",
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
    <div className="page">
      <DocumentMeta />
      <SiteHeader />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/legg-til-produkt" element={<AddProductPage />} />
        <Route path="/favoritter" element={<FavoritesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
