import type { LobbyTeam, TeamColor } from "../../types";
import { TEAM_COLOR_HEX, TEAM_LABEL } from "../../types";

interface TeamCardProps {
  team: LobbyTeam;
  color: TeamColor;
  youTeamId: number | null;
  youRole: "capo" | "player" | null;
  className: string;
  onJoin: () => void;
  onLeave: () => void;
  onBecomeCapo: () => void;
  onBackToPlayer: () => void;
}

export default function TeamCard({
  team,
  color,
  youTeamId,
  youRole,
  className,
  onJoin,
  onLeave,
  onBecomeCapo,
  onBackToPlayer,
}: TeamCardProps) {
  const youInTeam = youTeamId === team.id;
  const capoIsYou = team.capo?.isYou ?? false;
  const canBecomeCapo = youInTeam && youRole === "player" && !team.capo;
  const canBackToPlayer = youInTeam && capoIsYou;

  return (
    <div className={className}>
      <div className="rounded-md border-[3px] border-oro bg-crema p-3.5 text-inchiostro shadow-[0_10px_26px_rgba(0,0,0,0.3)]">
        <div className="mb-2.5 flex items-center gap-2">
          <span
            className="h-3.5 w-3.5 flex-none rounded-full border-2 border-inchiostro"
            style={{ background: TEAM_COLOR_HEX[color] }}
          />
          <span className="font-display text-[17px] tracking-wide text-vinaccia">
            {TEAM_LABEL[color]}
          </span>
          {youInTeam && (
            <button
              onClick={onLeave}
              className="ml-auto rounded-full border border-vinaccia px-2 py-1 font-serif text-[10.5px] text-vinaccia hover:bg-vinaccia hover:text-crema"
            >
              Esci
            </button>
          )}
        </div>

        {!youInTeam && (
          <button
            onClick={onJoin}
            className="mb-3 w-full rounded bg-vinaccia py-2.5 font-serif text-[13.5px] font-bold text-crema hover:bg-vinaccia-dark"
          >
            {youTeamId === null ? "Unisciti a questa Compagnia" : "Spostati qui"}
          </button>
        )}

        <div className="mb-2.5">
          <p className="mb-1 text-[10px] font-bold tracking-wide text-oro">CAPO</p>
          <div className="flex min-h-[18px] items-center justify-between rounded border border-vinaccia/25 bg-white px-2.5 py-2">
            <span className="text-[13.5px]">
              {team.capo ? (team.capo.isYou ? "Tu" : team.capo.name) : "— vuoto —"}
            </span>
            {canBecomeCapo && (
              <button
                onClick={onBecomeCapo}
                className="rounded bg-oro px-2 py-1 font-serif text-[11px] text-crema hover:bg-oro/80"
              >
                Diventa capo
              </button>
            )}
            {canBackToPlayer && (
              <button
                onClick={onBackToPlayer}
                className="rounded border border-vinaccia px-2 py-1 font-serif text-[11px] text-vinaccia hover:bg-vinaccia hover:text-crema"
              >
                Lascia ruolo
              </button>
            )}
          </div>
        </div>

        <div className="mb-2.5">
          <p className="mb-1 text-[10px] font-bold tracking-wide text-oro">
            ARTISTI ({team.players.length})
          </p>
          <div className="flex max-h-24 flex-col gap-1.5 overflow-y-auto">
            {team.players.length === 0 && (
              <p className="px-0.5 py-1 text-[12px] italic text-inchiostro/50">
                — nessun artista —
              </p>
            )}
            {team.players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded border border-vinaccia/15 bg-white px-2.5 py-1.5"
              >
                <span className="text-[13px]">{p.isYou ? "Tu" : p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
