import type { RiskLevel } from "../types";

export const DURATIONS = [45, 60, 75, 90, 105, 120, 135, 150, 165, 180] as const;

export const RISK_LEVELS: { value: RiskLevel; label: string; desc: string }[] = [
  {
    value: "classico",
    label: "Classico",
    desc: "1 carta Giullare — fedele all'originale.",
  },
  {
    value: "rischioso",
    label: "Rischioso",
    desc: "3 carte Giullare — più tensione, più probabilità di eliminazione.",
  },
  {
    value: "caos",
    label: "Caos",
    desc: "Tutte le carte neutre diventano Giullare — zero margine d'errore.",
  },
];

export function formatDuration(d: number | "infinito"): string {
  return d === "infinito" ? "Tempo infinito" : `${d}s`;
}
