# Hjemmelagde ting

Personlig nettside for å vise fram ting jeg har laget, med status:

- **Beholdt**
- **Vurderes solgt**
- **Solgt** (med pris)

## Kom i gang

```bash
pnpm i
pnpm dev
```

Kjører lokalt på `http://localhost:5173`.

## Publisering på GitHub Pages

Prosjektet er satt opp som en vanlig Vite SPA med base path `/Hobby-produkter/`.
Deploy-workflowen bygger til `dist/` og publiserer automatisk via GitHub Actions.

## Supabase-oppsett

1. Kjør SQL fra `supabase/products.sql` i **Supabase SQL Editor**.
2. Legg inn `.env.local` i prosjektroten:
   ```env
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<publishable-key>
   ```
3. Restart `pnpm dev`.

SQL-filen inkluderer nå også rettigheter/policies for å **slette produkter** og tilhørende bilder.

## Endre innhold

1. Produkter hentes/lages via `app/lib/products.ts`.
2. Status-visning ligger i `app/components/project-card.tsx`.
3. Toppfelt/logo ligger i `app/components/site-header.tsx`.
4. Skjema for å legge inn nye produkter ligger i `app/components/add-product-form.tsx`.
5. Egen side for nytt produkt ligger i `app/routes/add-product.tsx` (`/legg-til-produkt`).

## Endre farger

Alle hovedfarger ligger samlet i `app/app.css` under `:root` som CSS-variabler.
