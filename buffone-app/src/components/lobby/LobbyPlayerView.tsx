import { useIsMobileLayout, cornerClassName } from "./useIsMobileLayout";
import TeamCard from "./TeamCard";
import RoomCodeBadge from "../RoomCodeBadge";
import { RISK_LEVELS, formatDuration } from "../../data/lobbyOptions";
import type { TeamColor } from "../../types";
import type { LobbyState } from "./useLobbyState";

const TEAM_ORDER: TeamColor[] = ["red", "blue", "green", "yellow"];

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded border border-vinaccia/20 bg-white px-2.5 py-1.5">
      <span className="text-[10px] font-bold tracking-wide text-oro">{label}</span>
      <span className="text-[12.5px]">{value}</span>
    </div>
  );
}

export default function LobbyPlayerView({ lobby, code }: { lobby: LobbyState; code: string }) {
  const isMobile = useIsMobileLayout();

  const riskDef = RISK_LEVELS.find((r) => r.value === lobby.riskLevel)!;

  return (
    <div
      className={
        isMobile
          ? "relative min-h-screen overflow-auto px-3 pb-12 pt-5 text-inchiostro"
          : "flex h-screen w-screen flex-col overflow-hidden text-inchiostro"
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
          Lobby pre-partita — In attesa del via
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <a
            href="/regole.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg border border-oro/50 px-3 py-1.5 font-display text-[12px] tracking-wide text-oro-light/80 hover:bg-oro/10 hover:text-oro-light"
          >
            📖 Come si gioca
          </a>
          <RoomCodeBadge code={code} />
        </div>
      </header>

      <div
        className={
          isMobile
            ? "relative mx-auto mb-5 w-[92%] max-w-[420px]"
            : "flex min-h-0 flex-1 items-center justify-center py-3"
        }
      >
        {/* Stessa strategia di centratura flessibile di LobbyCapoView: evita
            che il pannello sconfini sotto l'header, qualunque sia la sua
            altezza (vedi commento gemello lì per il dettaglio del bug
            originale). */}
        <div
          className={`rounded-md border-[3px] border-oro bg-crema p-[18px_22px] shadow-[0_12px_32px_rgba(0,0,0,0.35)] ${
            isMobile ? "" : "w-[360px] max-h-full overflow-y-auto"
          }`}
        >
          <h2 className="mb-3 border-b-2 border-oro pb-2 text-center font-display text-[22px] tracking-wide text-vinaccia">
            Regole della Partita
          </h2>

          <div className="mb-3 flex flex-col gap-1.5">
            <InfoRow label="COMPAGNIE" value={String(lobby.numTeams)} />
            <InfoRow
              label="RISCHIO"
              value={
                lobby.riskLevel === "personalizzato"
                  ? `${riskDef.label} — ${lobby.customJesterCount} Giullare`
                  : riskDef.label
              }
            />
            <InfoRow
              label="TIMER INDIZIO"
              value={`${lobby.clueTimer.type === "hard" ? "Hard" : "Soft"} — ${formatDuration(
                lobby.clueTimer.duration
              )}`}
            />
            <InfoRow
              label="TIMER INDOVINAMENTO"
              value={`${lobby.guessTimer.type === "hard" ? "Hard" : "Soft"} — ${formatDuration(
                lobby.guessTimer.duration
              )}`}
            />
          </div>
          <p className="mb-3 text-center text-[11px] italic text-inchiostro/50">
            Solo il capo-lobby può modificare queste impostazioni.
          </p>

          <div className="mb-3 h-0.5 bg-gradient-to-r from-transparent via-oro to-transparent" />

          <div className="flex items-center justify-center gap-2.5 p-2">
            <span className="h-2.5 w-2.5 animate-buffone-pulse rounded-full bg-oro" />
            <span className="font-display text-[14px] tracking-[1.3px] text-vinaccia">
              IN ATTESA CHE IL CAPO-LOBBY AVVII LA PARTITA
            </span>
          </div>

          <p className="mt-2 text-center text-[10.5px] italic text-inchiostro/50">
            Scegli una Compagnia e un ruolo qui sotto.
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
