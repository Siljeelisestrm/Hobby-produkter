import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("legg-til-produkt", "routes/add-product.tsx"),
] satisfies RouteConfig;
