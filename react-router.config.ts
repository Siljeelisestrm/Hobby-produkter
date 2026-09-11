import type { Config } from "@react-router/dev/config";

export default {
  basename: "/Hobby-produkter",
  prerender: ["/", "/legg-til-produkt"],
  ssr: true,
} satisfies Config;
