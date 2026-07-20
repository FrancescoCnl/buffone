export type TeamColor = "red" | "blue" | "green" | "yellow";
export type CardColor = TeamColor | "neutral" | "jester";

export interface GameCard {
  id: string;
  word: string;
  color: CardColor;
  revealed: boolean;
  illustration: string;
  /** Esito rispetto alla squadra che ha girato la carta, fissato al momento del reveal. */
  resultKind?: "own" | "other" | "neutral" | "jester";
}

export const TEAM_LABEL: Record<TeamColor, string> = {
  red: "Compagnia Rossa",
  blue: "Compagnia Blu",
  green: "Compagnia Verde",
  yellow: "Compagnia Gialla",
};

export const TEAM_BG: Record<CardColor, string> = {
  red: "bg-team-red",
  blue: "bg-team-blue",
  green: "bg-team-green",
  yellow: "bg-team-yellow",
  neutral: "bg-crema",
  jester: "bg-inchiostro",
};

export const TEAM_COLOR_HEX: Record<TeamColor, string> = {
  red: "#A6332B",
  blue: "#2E5C82",
  green: "#3C6E4A",
  yellow: "#C99A2E",
};

// --- Lobby ---

export type RiskLevel = "classico" | "rischioso" | "caos" | "personalizzato";
export type TimerType = "soft" | "hard";
export interface TimerConfig {
  type: TimerType;
  duration: number | "infinito";
}

export interface LobbyPlayer {
  id: string;
  name: string;
  isYou?: boolean;
}

export interface LobbyTeam {
  id: number;
  capo: LobbyPlayer | null;
  players: LobbyPlayer[];
}

export interface YouState {
  teamId: number | null;
  role: "capo" | "player" | null;
}

// --- Game board ---

export type GamePhase = "clue" | "guessing" | "over";

export interface TeamRuntimeState {
  remaining: number;
  eliminated: boolean;
}

export interface ClueInfo {
  teamColor: TeamColor;
  word: string;
  number: string; // "0" | "1".."5" | "inf"
}

export type LogEntry =
  | {
      type: "clue";
      teamColor: TeamColor;
      word: string;
      number: string;
    }
  | {
      type: "reveal";
      teamColor: TeamColor;
      word: string;
      resultKind: "own" | "other" | "neutral" | "jester";
      resultTeamColor?: TeamColor;
    };
