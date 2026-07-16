import { useEffect, useState } from "react";
import { buildGrid, teamCardCount } from "../../data/mockGame";
import { shuffle } from "../../data/words";
import type {
  ClueInfo,
  GameCard,
  GamePhase,
  LogEntry,
  RiskLevel,
  TeamColor,
  TeamRuntimeState,
  TimerConfig,
} from "../../types";
import type { RoomChannel } from "../../hooks/useRoomChannel";

const TEAM_ORDER: TeamColor[] = ["red", "blue", "green", "yellow"];

export interface GameConfig {
  numTeams: 2 | 3 | 4;
  riskLevel: RiskLevel;
  clueTimer: TimerConfig;
  guessTimer: TimerConfig;
}

interface SharedState {
  teamIds: TeamColor[];
  turnOrder: TeamColor[];
  currentTurnIdx: number;
  grid: GameCard[];
  cols: number;
  rows: number;
  teamState: Record<TeamColor, TeamRuntimeState>;
  phase: GamePhase;
  currentClue: ClueInfo | null;
  guessesUsed: number;
  guessLimit: number | null;
  winnerTeamId: TeamColor | null;
  log: LogEntry[];
  boardShaking: boolean;
  clueRemaining: number | "infinito";
  guessRemaining: number | "infinito";
}

// Calcolata una sola volta, sull'host, perché contiene lo shuffle casuale
// del tabellone: se ogni client la ricalcolasse in proprio otterrebbe una
// griglia diversa dalle altre.
function buildInitialState(config: GameConfig): SharedState {
  const teamIds = TEAM_ORDER.slice(0, config.numTeams);
  const turnOrder = shuffle(teamIds);
  const startingTeam = turnOrder[0];
  const { cards, cols, rows } = buildGrid(config.numTeams, config.riskLevel, startingTeam);
  const teamState = {} as Record<TeamColor, TeamRuntimeState>;
  teamIds.forEach((id) => {
    teamState[id] = {
      remaining: teamCardCount(config.numTeams, id, startingTeam),
      eliminated: false,
    };
  });
  return {
    teamIds,
    turnOrder,
    currentTurnIdx: 0,
    grid: cards,
    cols,
    rows,
    teamState,
    phase: "clue",
    currentClue: null,
    guessesUsed: 0,
    guessLimit: null,
    winnerTeamId: null,
    log: [],
    boardShaking: false,
    clueRemaining: config.clueTimer.duration,
    guessRemaining: config.guessTimer.duration,
  };
}

// Placeholder locale per i client non-host, in attesa del primo snapshot
// reale dall'host: mai renderizzato (vedi `ready` nel valore di ritorno).
function placeholderState(config: GameConfig): SharedState {
  const teamIds = TEAM_ORDER.slice(0, config.numTeams);
  const teamState = {} as Record<TeamColor, TeamRuntimeState>;
  teamIds.forEach((id) => {
    teamState[id] = { remaining: 0, eliminated: false };
  });
  return {
    teamIds,
    turnOrder: teamIds,
    currentTurnIdx: 0,
    grid: [],
    cols: 0,
    rows: 0,
    teamState,
    phase: "clue",
    currentClue: null,
    guessesUsed: 0,
    guessLimit: null,
    winnerTeamId: null,
    log: [],
    boardShaking: false,
    clueRemaining: config.clueTimer.duration,
    guessRemaining: config.guessTimer.duration,
  };
}

function activeTeam(s: SharedState): TeamColor {
  return s.turnOrder[s.currentTurnIdx % s.turnOrder.length];
}

function nextAliveIdx(s: SharedState): number {
  let idx = s.currentTurnIdx;
  for (let i = 0; i < s.turnOrder.length; i++) {
    idx = (idx + 1) % s.turnOrder.length;
    if (!s.teamState[s.turnOrder[idx]].eliminated) break;
  }
  return idx;
}

function advanceTurn(s: SharedState, config: GameConfig): SharedState {
  return {
    ...s,
    currentTurnIdx: nextAliveIdx(s),
    phase: "clue",
    currentClue: null,
    guessesUsed: 0,
    guessLimit: null,
    clueRemaining: config.clueTimer.duration,
  };
}

function checkWin(s: SharedState, justActedTeam: TeamColor): SharedState {
  const acted = s.teamState[justActedTeam];
  if (acted && !acted.eliminated && acted.remaining === 0) {
    return { ...s, winnerTeamId: justActedTeam, phase: "over" };
  }
  const alive = s.teamIds.filter((id) => !s.teamState[id].eliminated);
  if (alive.length === 1) {
    return { ...s, winnerTeamId: alive[0], phase: "over" };
  }
  return s;
}

type Action =
  | { type: "SUBMIT_CLUE"; word: string; number: string }
  | { type: "REVEAL_CARD"; cardId: string }
  | { type: "PASS_TURN" }
  | { type: "TICK_CLUE" }
  | { type: "TICK_GUESS" }
  | { type: "CLEAR_BOARD_SHAKE" };

function reduce(s: SharedState, action: Action, config: GameConfig): SharedState {
  if (s.winnerTeamId && action.type !== "CLEAR_BOARD_SHAKE") return s;

  switch (action.type) {
    case "SUBMIT_CLUE": {
      if (s.phase !== "clue") return s;
      const team = activeTeam(s);
      const word = action.word.trim() || "(indizio)";
      const numRaw = action.number;
      const limit = numRaw === "inf" || numRaw === "0" ? Infinity : parseInt(numRaw, 10) + 1;
      const entry: LogEntry = { type: "clue", teamColor: team, word, number: numRaw };
      return {
        ...s,
        phase: "guessing",
        currentClue: { teamColor: team, word, number: numRaw },
        guessesUsed: 0,
        guessLimit: limit,
        log: [entry, ...s.log],
        guessRemaining: config.guessTimer.duration,
      };
    }

    case "REVEAL_CARD": {
      if (s.phase !== "guessing") return s;
      const card = s.grid.find((c) => c.id === action.cardId);
      if (!card || card.revealed) return s;

      const team = activeTeam(s);
      const trueColor = card.color;
      let resultKind: NonNullable<GameCard["resultKind"]>;
      if (trueColor === "jester") resultKind = "jester";
      else if (trueColor === "neutral") resultKind = "neutral";
      else if (trueColor === team) resultKind = "own";
      else resultKind = "other";

      const logEntry: LogEntry = {
        type: "reveal",
        teamColor: team,
        word: card.word,
        resultKind,
        resultTeamColor:
          resultKind === "own" || resultKind === "other" ? (trueColor as TeamColor) : undefined,
      };

      const grid = s.grid.map((c) =>
        c.id === action.cardId ? { ...c, revealed: true, resultKind } : c
      );
      let next: SharedState = { ...s, grid, log: [logEntry, ...s.log] };

      if (resultKind === "jester") {
        const teamState = {
          ...s.teamState,
          [team]: { ...s.teamState[team], eliminated: true },
        };
        const clearedGrid = grid.map((c) =>
          !c.revealed && c.color === team ? { ...c, color: "neutral" as const } : c
        );
        next = { ...next, grid: clearedGrid, teamState, boardShaking: true };
        next = checkWin(next, team);
        if (next.winnerTeamId) return next;
        return advanceTurn(next, config);
      }

      if (resultKind === "neutral") {
        return advanceTurn(next, config);
      }

      const owner = trueColor as TeamColor;
      const teamState = {
        ...s.teamState,
        [owner]: { ...s.teamState[owner], remaining: Math.max(0, s.teamState[owner].remaining - 1) },
      };
      next = { ...next, teamState };

      if (resultKind === "own") {
        const guessesUsed = s.guessesUsed + 1;
        next = { ...next, guessesUsed };
        next = checkWin(next, owner);
        if (next.winnerTeamId) return next;
        if (guessesUsed >= (s.guessLimit ?? Infinity)) {
          return advanceTurn(next, config);
        }
        return next;
      }

      next = checkWin(next, owner);
      if (next.winnerTeamId) return next;
      return advanceTurn(next, config);
    }

    case "PASS_TURN":
      return advanceTurn(s, config);

    case "TICK_CLUE": {
      if (s.phase !== "clue" || typeof s.clueRemaining !== "number") return s;
      if (s.clueRemaining <= 1) {
        return config.clueTimer.type === "hard" ? advanceTurn(s, config) : { ...s, clueRemaining: 0 };
      }
      return { ...s, clueRemaining: s.clueRemaining - 1 };
    }

    case "TICK_GUESS": {
      if (s.phase !== "guessing" || typeof s.guessRemaining !== "number") return s;
      if (s.guessRemaining <= 1) {
        return config.guessTimer.type === "hard" ? advanceTurn(s, config) : { ...s, guessRemaining: 0 };
      }
      return { ...s, guessRemaining: s.guessRemaining - 1 };
    }

    case "CLEAR_BOARD_SHAKE":
      return { ...s, boardShaking: false };

    default:
      return s;
  }
}

/**
 * Stato di gioco sincronizzato in rete, stesso schema host-authoritative di
 * useLobbyState: l'host (capo-lobby) mantiene l'unica copia reale e la
 * ribroadcasta; gli altri client spediscono intent e rispecchiano gli
 * snapshot ricevuti. Il testo dell'indizio in corso di digitazione resta
 * invece locale al client che lo sta scrivendo — non ha senso sincronizzarlo
 * tasto per tasto, solo l'indizio inviato (SUBMIT_CLUE) entra nello stato
 * condiviso.
 */
export function useGameState(channel: RoomChannel, isHost: boolean, initialConfig: GameConfig) {
  const [config] = useState(initialConfig);
  const [shared, setShared] = useState<SharedState>(() =>
    isHost ? buildInitialState(config) : placeholderState(config)
  );
  const [synced, setSynced] = useState(isHost);
  const [clueWordInput, setClueWordInput] = useState("");
  const [clueNumberInput, setClueNumberInput] = useState("1");

  function applyOnHost(a: Action) {
    setShared((prev) => reduce(prev, a, config));
  }

  function dispatch(a: Action) {
    if (isHost) applyOnHost(a);
    else channel.send("game-intent", a);
  }

  useEffect(() => {
    if (!isHost) return;
    return channel.on("game-intent", (data) => applyOnHost(data as Action));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, channel]);

  useEffect(() => {
    if (isHost) channel.send("game-state", shared);
  }, [isHost, channel, shared]);

  useEffect(() => {
    if (!isHost) return;
    return channel.on("request-game-state", () => channel.send("game-state", shared));
  }, [isHost, channel, shared]);

  useEffect(() => {
    if (isHost) return;
    return channel.on("game-state", (data) => {
      setShared(data as SharedState);
      setSynced(true);
    });
  }, [isHost, channel]);

  useEffect(() => {
    if (isHost || channel.status !== "connected") return;
    channel.send("request-game-state", {});
  }, [isHost, channel, channel.status]);

  // Svuota l'input locale dell'indizio ogni volta che inizia una nuova fase
  // "clue" (nuovo turno o game appena partito) — sostituisce il reset che
  // prima avveniva dentro advanceTurn, ora impossibile perché l'input non fa
  // più parte dello stato condiviso.
  useEffect(() => {
    if (shared.phase === "clue") {
      setClueWordInput("");
      setClueNumberInput("1");
    }
  }, [shared.phase, shared.currentTurnIdx]);

  // Solo l'host fa scorrere i timer ed è quindi l'unico a dover ripulire lo
  // shake del tabellone dopo l'animazione.
  useEffect(() => {
    if (!isHost || shared.winnerTeamId || shared.phase !== "clue" || config.clueTimer.duration === "infinito")
      return;
    const id = setInterval(() => applyOnHost({ type: "TICK_CLUE" }), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, shared.phase, shared.currentTurnIdx, shared.winnerTeamId, config.clueTimer.duration]);

  useEffect(() => {
    if (!isHost || shared.winnerTeamId || shared.phase !== "guessing" || config.guessTimer.duration === "infinito")
      return;
    const id = setInterval(() => applyOnHost({ type: "TICK_GUESS" }), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, shared.phase, shared.currentTurnIdx, shared.winnerTeamId, config.guessTimer.duration]);

  useEffect(() => {
    if (!isHost || !shared.boardShaking) return;
    const t = setTimeout(() => applyOnHost({ type: "CLEAR_BOARD_SHAKE" }), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, shared.boardShaking]);

  return {
    ...shared,
    ready: synced,
    clueWordInput,
    clueNumberInput,
    activeTeam: activeTeam(shared),
    setClueWord: setClueWordInput,
    setClueNumber: setClueNumberInput,
    submitClue: () => dispatch({ type: "SUBMIT_CLUE", word: clueWordInput, number: clueNumberInput }),
    revealCard: (cardId: string) => dispatch({ type: "REVEAL_CARD", cardId }),
    passTurn: () => dispatch({ type: "PASS_TURN" }),
  };
}

export type GameState = ReturnType<typeof useGameState>;

export function fmtTime(sec: number | "infinito"): string {
  if (sec === "infinito") return "∞";
  const m = Math.floor(sec / 60);
  const rem = sec % 60;
  return m > 0 ? `${m}:${String(rem).padStart(2, "0")}` : `${rem}s`;
}
