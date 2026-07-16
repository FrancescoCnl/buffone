import { useIsMobileLayout, cornerClassName } from "./useIsMobileLayout";
import TeamCard from "./TeamCard";
import { DURATIONS, RISK_LEVELS, formatDuration } from "../../data/lobbyOptions";
import type { TeamColor } from "../../types";
import { TEAM_LABEL } from "../../types";
import type { LobbyState } from "./useLobbyState";

const TEAM_ORDER: TeamColor[] = ["red", "blue", "green", "yellow"];

function segClass(active: boolean) {
  return `flex-1 rounded border-2 border-oro px-2.5 py-2 font-serif text-[12.5px] font-bold ${
    active ? "bg-vinaccia text-crema" : "bg-white text-vinaccia hover:bg-vinaccia/15"
  }`;
}

export default function LobbyCapoView({
  lobby,
  onStart,
}: {
  lobby: LobbyState;
  onStart: () => void;
}) {
  const isMobile = useIsMobileLayout();

  const activeRisk = RISK_LEVELS.find((r) => r.value === lobby.riskLevel)!;

  const missingTeams = lobby.teams
    .filter((t) => !t.capo || t.players.length === 0)
    .map((t) => TEAM_LABEL[TEAM_ORDER[t.id]]);
  const missingReasons: string[] = [];
  if (missingTeams.length > 0) missingReasons.push(missingTeams.join(", "));
  if (!lobby.everyoneAssigned) missingReasons.push("Tu (non hai ancora scelto una Compagnia)");

  return (
    <div
      className={
        isMobile
          ? "relative min-h-screen overflow-auto px-3 pb-12 pt-5 text-inchiostro"
          : "relative h-screen w-screen overflow-hidden text-inchiostro"
      }
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, #8a3a20 0%, #712B13 45%, #4d1c0c 100%)",
      }}
    >
      <header className={`text-center ${isMobile ? "pb-2 pt-1" : "pb-2 pt-4"}`}>
        <h1
          className="font-display text-[38px] tracking-[5px] text-crema"
          style={{ textShadow: "0 3px 0 #4d1c0c" }}
        >
          BUFFONE
        </h1>
        <p className="mt-0.5 text-[12px] uppercase tracking-[2.5px] text-oro-light">
          Lobby pre-partita · Vista Capo-Lobby
        </p>
      </header>

      <div
        className={
          isMobile
            ? "relative mx-auto mb-5 w-[92%] max-w-[420px]"
            : "absolute left-1/2 top-[100px] w-[360px] -translate-x-1/2"
        }
      >
        <div className="rounded-md border-[3px] border-oro bg-crema p-[18px_22px] shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
          <h2 className="mb-3 border-b-2 border-oro pb-2 text-center font-display text-[22px] tracking-wide text-vinaccia">
            Regole della Partita
          </h2>

          <div className="mb-3">
            <p className="mb-1.5 text-[10.5px] font-bold tracking-wide text-oro">
              NUMERO COMPAGNIE
            </p>
            <div className="flex gap-2">
              {[2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => lobby.setNumTeams(n as 2 | 3 | 4)}
                  className={segClass(lobby.numTeams === n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <p className="mb-1.5 text-[10.5px] font-bold tracking-wide text-oro">
              LIVELLO DI RISCHIO
            </p>
            <div className="flex flex-wrap gap-2">
              {RISK_LEVELS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => lobby.setRiskLevel(r.value)}
                  className={segClass(lobby.riskLevel === r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11.5px] italic text-inchiostro/70">{activeRisk.desc}</p>
          </div>

          <div className="mb-3">
            <p className="mb-1.5 text-[10.5px] font-bold tracking-wide text-oro">
              TIMER INDIZIO (Fase 1)
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {(["soft", "hard"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => lobby.setClueTimerType(t)}
                  className={segClass(lobby.clueTimer.type === t) + " flex-none w-16"}
                >
                  {t === "soft" ? "Soft" : "Hard"}
                </button>
              ))}
              <select
                value={lobby.clueTimer.duration}
                onChange={(e) =>
                  lobby.setClueDuration(
                    e.target.value === "infinito" ? "infinito" : Number(e.target.value)
                  )
                }
                className="ml-auto rounded border-2 border-oro bg-white px-2.5 py-2 font-serif text-[13px] text-inchiostro"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {formatDuration(d)}
                  </option>
                ))}
                <option value="infinito">Tempo infinito</option>
              </select>
            </div>
          </div>

          <div className="mb-3.5">
            <p className="mb-1.5 text-[10.5px] font-bold tracking-wide text-oro">
              TIMER INDOVINAMENTO (Fase 2)
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {(["soft", "hard"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => lobby.setGuessTimerType(t)}
                  className={segClass(lobby.guessTimer.type === t) + " flex-none w-16"}
                >
                  {t === "soft" ? "Soft" : "Hard"}
                </button>
              ))}
              <select
                value={lobby.guessTimer.duration}
                onChange={(e) =>
                  lobby.setGuessDuration(
                    e.target.value === "infinito" ? "infinito" : Number(e.target.value)
                  )
                }
                className="ml-auto rounded border-2 border-oro bg-white px-2.5 py-2 font-serif text-[13px] text-inchiostro"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {formatDuration(d)}
                  </option>
                ))}
                <option value="infinito">Tempo infinito</option>
              </select>
            </div>
          </div>

          <div className="mb-3 h-0.5 bg-gradient-to-r from-transparent via-oro to-transparent" />

          <button
            disabled={!lobby.startValid}
            onClick={onStart}
            className={`w-full rounded py-3.5 font-display text-[18px] tracking-[2px] ${
              lobby.startValid
                ? "cursor-pointer bg-gradient-to-b from-oro-light to-oro text-inchiostro"
                : "cursor-not-allowed bg-inchiostro/20 text-inchiostro/40"
            }`}
          >
            AVVIA PARTITA
          </button>
          {!lobby.startValid && (
            <p className="mt-1.5 text-center text-[11.5px] leading-snug text-vinaccia">
              Non pronti: {missingReasons.join(" · ")}
            </p>
          )}

          <p className="mt-2.5 text-center text-[10.5px] italic text-inchiostro/50">
            Anche tu, come capo-lobby, devi scegliere una Compagnia e un ruolo qui sotto.
          </p>
        </div>
      </div>

      {lobby.teams.map((team, idx) => (
        <TeamCard
          key={team.id}
          team={team}
          color={TEAM_ORDER[idx]}
          youTeamId={lobby.you.teamId}
          youRole={lobby.you.role}
          className={cornerClassName(idx, lobby.numTeams, isMobile)}
          onJoin={() => lobby.joinTeam(team.id)}
          onLeave={lobby.leaveTeam}
          onBecomeCapo={() => lobby.becomeCapo(team.id)}
          onBackToPlayer={() => lobby.backToPlayer(team.id)}
        />
      ))}
    </div>
  );
}
