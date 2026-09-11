import type { ProjectStatus } from "~/types/project";

export const statusLabel: Record<ProjectStatus, string> = {
  beholdt: "Beholdt",
  "vurderes-solgt": "Vurderes solgt",
  solgt: "Solgt",
};

export const statusClassName: Record<ProjectStatus, string> = {
  beholdt: "status-badge status-badge--kept",
  "vurderes-solgt": "status-badge status-badge--considering",
  solgt: "status-badge status-badge--sold",
};

const currencyFormatter = new Intl.NumberFormat("nb-NO", {
  style: "currency",
  currency: "NOK",
  maximumFractionDigits: 0,
});

export function formatCurrencyNok(value: number): string {
  return currencyFormatter.format(value);
}
