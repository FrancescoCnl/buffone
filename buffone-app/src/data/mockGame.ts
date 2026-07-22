import { illustrations, jesterIllustration } from "../assets";
import type { CardColor, GameCard, RiskLevel, TeamColor } from "../types";
import { WORD_POOL, shuffle } from "./words";

const TEAM_ORDER: TeamColor[] = ["red", "blue", "green", "yellow"];

// Sezione 2 del documento di design: dimensione griglia per numero di squadre
// (numeri del Livello di Rischio "Classico": 1 sola carta Giullare)
const SETUP = {
  2: { cols: 5, rows: 5, base: 8, starting: 9, neutral: 7 },
  3: { cols: 6, rows: 5, base: 8, starting: 9, neutral: 4 },
  4: { cols: 7, rows: 5, base: 7, starting: 8, neutral: 5 },
} as const;

// Sezione 3.3: il Livello di Rischio sostituisce carte neutre con carte
// Giullare aggiuntive, senza cambiare la dimensione della griglia. Il totale
// di celle "non di squadra" (neutre + Giullare) è sempre neutral+1, dato che
// SETUP.neutral è già il numero di neutre del Livello Classico (che ha 1 sola
// carta Giullare a parte).
export function nonTeamSlots(teamCount: 2 | 3 | 4): number {
  return SETUP[teamCount].neutral + 1;
}

function jesterCount(
  teamCount: 2 | 3 | 4,
  riskLevel: RiskLevel,
  customJesterCount: number
): number {
  if (riskLevel === "classico") return 1;
  if (riskLevel === "rischioso") return 3;
  if (riskLevel === "personalizzato") return customJesterCount;
  return nonTeamSlots(teamCount); // caos: tutte le neutre diventano Giullare
}

export function teamCardCount(
  teamCount: 2 | 3 | 4,
  team: TeamColor,
  startingTeam: TeamColor
): number {
  const setup = SETUP[teamCount];
  return team === startingTeam ? setup.starting : setup.base;
}

export function buildGrid(
  teamCount: 2 | 3 | 4,
  riskLevel: RiskLevel,
  startingTeam: TeamColor,
  customJesterCount = 0
): {
  cards: GameCard[];
  cols: number;
  rows: number;
} {
  const setup = SETUP[teamCount];
  const teams = TEAM_ORDER.slice(0, teamCount);
  const jesters = Math.max(
    0,
    Math.min(jesterCount(teamCount, riskLevel, customJesterCount), nonTeamSlots(teamCount))
  );
  const neutral = nonTeamSlots(teamCount) - jesters;

  const colors: CardColor[] = [];
  teams.forEach((team) => {
    const count = teamCardCount(teamCount, team, startingTeam);
    for (let n = 0; n < count; n++) colors.push(team);
  });
  for (let n = 0; n < neutral; n++) colors.push("neutral");
  for (let n = 0; n < jesters; n++) colors.push("jester");

  const shuffledColors = shuffle(colors);
  const words = shuffle(WORD_POOL).slice(0, shuffledColors.length);
  const pool = shuffle(illustrations);

  const cards: GameCard[] = shuffledColors.map((color, i) => ({
    id: `card-${i}`,
    word: words[i],
    color,
    originalColor: color,
    revealed: false,
    illustration:
      color === "jester" ? jesterIllustration : pool[i % pool.length],
  }));

  return { cards, cols: setup.cols, rows: setup.rows };
}
