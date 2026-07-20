import type { GameState } from "./useGameState";
import type { TeamColor } from "../../types";
import { TEAM_COLOR_HEX, TEAM_LABEL } from "../../types";

const TEAM_ORDER: TeamColor[] = ["red", "blue", "green", "yellow"];

export default function Scoreboard({
  game,
  isMobile,
  myTeamColor,
}: {
  game: GameState;
  isMobile?: boolean;
  myTeamColor?: TeamColor | null;
}) {
  const teams = TEAM_ORDER.filter((id) => game.teamIds.includes(id));

  return (
    <div
      className={
        isMobile
          ? "flex flex-row gap-2.5 overflow-x-auto pb-1"
          : "flex h-full flex-col gap-2.5 overflow-y-auto"
      }
    >
      {!isMobile && (
        <div className="mb-[-2px] text-[12px] uppercase tracking-[2px] text-oro-light/70">
          Ordine turni
        </div>
      )}
      {teams.map((id) => {
        const ts = game.teamState[id];
        const isActive = id === game.activeTeam && !ts.eliminated && !game.winnerTeamId;
        const isMine = id === myTeamColor;
        return (
          <div
            key={id}
            className={`relative rounded-[10px] p-3 ${isMine ? "border-[3px]" : "border-2"} ${
              isMobile ? "w-[150px] flex-none" : ""
            }`}
            style={{
              borderColor: ts.eliminated ? "#4a3a2c" : TEAM_COLOR_HEX[id],
              background: ts.eliminated ? "#241812" : isActive ? "#3a2214" : "#2a160c",
              opacity: ts.eliminated ? 0.6 : 1,
              boxShadow: isMine ? `0 0 0 3px ${TEAM_COLOR_HEX[id]}55` : undefined,
            }}
          >
            {isActive && (
              <div className="absolute -top-[9px] right-2.5 rounded-lg bg-oro px-2 py-0.5 text-[10px] font-bold tracking-wide text-inchiostro">
                IN TURNO
              </div>
            )}
            {isMine && (
              <div className="absolute -top-[9px] left-2.5 rounded-lg bg-crema px-2 py-0.5 text-[10px] font-bold tracking-wide text-vinaccia">
                TU
              </div>
            )}
            <div className="font-display text-[19px] tracking-wide text-crema">
              {TEAM_LABEL[id]}
            </div>
            <div className="mt-0.5 text-[13px] text-crema/85">
              {ts.eliminated ? "Eliminata \u{1F480}" : `${ts.remaining} carte rimaste`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
