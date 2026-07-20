import { useEffect, useState } from "react";
import type {
  LobbyTeam,
  RiskLevel,
  TimerConfig,
  TimerType,
  YouState,
} from "../../types";
import { PRESENCE_LEAVE, type RoomChannel } from "../../hooks/useRoomChannel";

function buildTeams(n: number, prev: LobbyTeam[]): LobbyTeam[] {
  const out: LobbyTeam[] = [];
  for (let i = 0; i < n; i++) {
    out.push(prev[i] ?? { id: i, capo: null, players: [] });
  }
  return out;
}

function removePlayerEverywhere(teams: LobbyTeam[], playerId: string): LobbyTeam[] {
  return teams.map((t) => ({
    ...t,
    capo: t.capo?.id === playerId ? null : t.capo,
    players: t.players.filter((p) => p.id !== playerId),
  }));
}

interface SharedState {
  numTeams: 2 | 3 | 4;
  teams: LobbyTeam[];
  riskLevel: RiskLevel;
  clueTimer: TimerConfig;
  guessTimer: TimerConfig;
  started: boolean;
}

function initialShared(defaultNumTeams: 2 | 3 | 4): SharedState {
  return {
    numTeams: defaultNumTeams,
    teams: buildTeams(defaultNumTeams, []),
    riskLevel: "classico",
    clueTimer: { type: "soft", duration: "infinito" },
    guessTimer: { type: "soft", duration: "infinito" },
    started: false,
  };
}

type Action =
  | { type: "SET_NUM_TEAMS"; n: 2 | 3 | 4 }
  | { type: "JOIN_TEAM"; teamId: number; actorId: string; actorName: string }
  | { type: "LEAVE_TEAM"; actorId: string }
  | { type: "BECOME_CAPO"; teamId: number; actorId: string; actorName: string }
  | { type: "BACK_TO_PLAYER"; teamId: number; actorId: string }
  | { type: "SET_RISK"; risk: RiskLevel }
  | { type: "SET_CLUE_TIMER_TYPE"; timerType: TimerType }
  | { type: "SET_CLUE_DURATION"; duration: number | "infinito" }
  | { type: "SET_GUESS_TIMER_TYPE"; timerType: TimerType }
  | { type: "SET_GUESS_DURATION"; duration: number | "infinito" }
  | { type: "START_GAME" }
  | { type: "END_GAME" };

function reduce(s: SharedState, a: Action): SharedState {
  switch (a.type) {
    case "SET_NUM_TEAMS":
      return { ...s, numTeams: a.n, teams: buildTeams(a.n, s.teams) };

    case "JOIN_TEAM": {
      const cleared = removePlayerEverywhere(s.teams, a.actorId);
      const teams = cleared.map((t) =>
        t.id === a.teamId
          ? { ...t, players: [...t.players, { id: a.actorId, name: a.actorName }] }
          : t
      );
      return { ...s, teams };
    }

    case "LEAVE_TEAM":
      return { ...s, teams: removePlayerEverywhere(s.teams, a.actorId) };

    case "BECOME_CAPO": {
      const teams = s.teams.map((t) => {
        if (t.id !== a.teamId || t.capo) return t;
        return {
          ...t,
          capo: { id: a.actorId, name: a.actorName },
          players: t.players.filter((p) => p.id !== a.actorId),
        };
      });
      return { ...s, teams };
    }

    case "BACK_TO_PLAYER": {
      const teams = s.teams.map((t) => {
        if (t.id !== a.teamId || t.capo?.id !== a.actorId) return t;
        return {
          ...t,
          capo: null,
          players: [...t.players, { id: a.actorId, name: t.capo!.name }],
        };
      });
      return { ...s, teams };
    }

    case "SET_RISK":
      return { ...s, riskLevel: a.risk };
    case "SET_CLUE_TIMER_TYPE":
      return { ...s, clueTimer: { ...s.clueTimer, type: a.timerType } };
    case "SET_CLUE_DURATION":
      return { ...s, clueTimer: { ...s.clueTimer, duration: a.duration } };
    case "SET_GUESS_TIMER_TYPE":
      return { ...s, guessTimer: { ...s.guessTimer, type: a.timerType } };
    case "SET_GUESS_DURATION":
      return { ...s, guessTimer: { ...s.guessTimer, duration: a.duration } };
    case "START_GAME":
      return { ...s, started: true };
    case "END_GAME":
      return { ...s, started: false };

    default:
      return s;
  }
}

/**
 * Stato lobby sincronizzato in rete via Supabase Realtime.
 *
 * Modello host-authoritative: il capo-lobby (isHost) è l'unico che mantiene
 * lo stato reale e lo ribroadcasta ad ogni cambiamento; tutti gli altri
 * client sono "dumb renderer" — le loro azioni diventano "intent" spediti
 * sul canale, e solo l'host li applica. Evita conflitti di scrittura
 * concorrente senza bisogno di un vero backend/server.
 */
export function useLobbyState(
  channel: RoomChannel,
  playerId: string,
  playerName: string,
  isHost: boolean,
  defaultNumTeams: 2 | 3 | 4 = 3
) {
  const [shared, setShared] = useState<SharedState>(() => initialShared(defaultNumTeams));

  function applyOnHost(a: Action) {
    setShared((prev) => reduce(prev, a));
  }

  function dispatch(a: Action) {
    if (isHost) applyOnHost(a);
    else channel.send("lobby-intent", a);
  }

  // Host: riceve gli intent dagli altri client e li applica.
  useEffect(() => {
    if (!isHost) return;
    return channel.on("lobby-intent", (data) => applyOnHost(data as Action));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, channel]);

  // Host: un giocatore che si disconnette (tab chiusa, rete caduta) va
  // rimosso dalla squadra — altrimenti resta "fantasma" per sempre, come
  // emerso in playtest il 2026-07-15. Il capo-lobby stesso non viene mai
  // rimosso così (è la sorgente di verità, se sparisce la stanza si ferma).
  useEffect(() => {
    if (!isHost) return;
    return channel.on(PRESENCE_LEAVE, (data) => {
      const departedId = data as string;
      if (departedId === playerId) return;
      applyOnHost({ type: "LEAVE_TEAM", actorId: departedId });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, channel, playerId]);

  // Host: ribroadcasta lo stato completo ad ogni cambiamento.
  useEffect(() => {
    if (isHost) channel.send("lobby-state", shared);
  }, [isHost, channel, shared]);

  // Host: un client appena entrato chiede lo stato corrente, lo rimanda.
  useEffect(() => {
    if (!isHost) return;
    return channel.on("request-lobby-state", () => channel.send("lobby-state", shared));
  }, [isHost, channel, shared]);

  // Guest: riceve gli snapshot dall'host e li rispecchia in locale.
  useEffect(() => {
    if (isHost) return;
    return channel.on("lobby-state", (data) => setShared(data as SharedState));
  }, [isHost, channel]);

  // Guest: appena connesso, chiede allo stato attuale (late-join).
  useEffect(() => {
    if (isHost || channel.status !== "connected") return;
    channel.send("request-lobby-state", {});
  }, [isHost, channel, channel.status]);

  const you: YouState = (() => {
    for (const t of shared.teams) {
      if (t.capo?.id === playerId) return { teamId: t.id, role: "capo" };
      if (t.players.some((p) => p.id === playerId)) return { teamId: t.id, role: "player" };
    }
    return { teamId: null, role: null };
  })();

  // isYou è relativo a chi guarda: non fa parte dello stato condiviso,
  // viene calcolato qui confrontando con il playerId locale.
  const teams: LobbyTeam[] = shared.teams.map((t) => ({
    ...t,
    capo: t.capo ? { ...t.capo, isYou: t.capo.id === playerId } : null,
    players: t.players.map((p) => ({ ...p, isYou: p.id === playerId })),
  }));

  // Hard-block: ogni Compagnia deve avere 1 capo + almeno 1 giocatore,
  // E ogni giocatore connesso deve essere assegnato a una Compagnia —
  // deciso in chat il 2026-07-13.
  const teamsReady = shared.teams.every((t) => t.capo !== null && t.players.length >= 1);
  const everyoneAssigned = you.teamId !== null;
  const startValid = teamsReady && everyoneAssigned;

  return {
    numTeams: shared.numTeams,
    teams,
    you,
    riskLevel: shared.riskLevel,
    clueTimer: shared.clueTimer,
    guessTimer: shared.guessTimer,
    started: shared.started,
    startValid,
    teamsReady,
    everyoneAssigned,
    setNumTeams: (n: 2 | 3 | 4) => dispatch({ type: "SET_NUM_TEAMS", n }),
    setRiskLevel: (risk: RiskLevel) => dispatch({ type: "SET_RISK", risk }),
    setClueTimerType: (timerType: TimerType) => dispatch({ type: "SET_CLUE_TIMER_TYPE", timerType }),
    setClueDuration: (duration: number | "infinito") =>
      dispatch({ type: "SET_CLUE_DURATION", duration }),
    setGuessTimerType: (timerType: TimerType) => dispatch({ type: "SET_GUESS_TIMER_TYPE", timerType }),
    setGuessDuration: (duration: number | "infinito") =>
      dispatch({ type: "SET_GUESS_DURATION", duration }),
    joinTeam: (teamId: number) =>
      dispatch({ type: "JOIN_TEAM", teamId, actorId: playerId, actorName: playerName }),
    leaveTeam: () => dispatch({ type: "LEAVE_TEAM", actorId: playerId }),
    becomeCapo: (teamId: number) =>
      dispatch({ type: "BECOME_CAPO", teamId, actorId: playerId, actorName: playerName }),
    backToPlayer: (teamId: number) => dispatch({ type: "BACK_TO_PLAYER", teamId, actorId: playerId }),
    startGame: () => dispatch({ type: "START_GAME" }),
    // Chiudibile da qualsiasi giocatore (non solo host): l'intent passa
    // comunque dall'host, che è l'unico ad applicarlo e ribroadcastarlo, così
    // la partita finisce per tutti allo stesso momento — deciso
    // il 2026-07-15.
    endGame: () => dispatch({ type: "END_GAME" }),
  };
}

export type LobbyState = ReturnType<typeof useLobbyState>;
