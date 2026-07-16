import type { LogEntry, TeamColor } from "../../types";
import { TEAM_COLOR_HEX, TEAM_LABEL } from "../../types";

function resultLabel(entry: Extract<LogEntry, { type: "reveal" }>): {
  label: string;
  color: string;
} {
  if (entry.resultKind === "jester") return { label: "GIULLARE — eliminata!", color: "#7a1414" };
  if (entry.resultKind === "neutral") return { label: "carta neutra", color: "#9a8a70" };
  if (entry.resultKind === "own")
    return { label: "propria carta ✓", color: TEAM_COLOR_HEX[entry.teamColor] };
  const opponent = entry.resultTeamColor as TeamColor;
  return { label: TEAM_LABEL[opponent], color: TEAM_COLOR_HEX[opponent] };
}

export default function LogPanel({ log, isMobile }: { log: LogEntry[]; isMobile?: boolean }) {
  return (
    <div className={isMobile ? "flex flex-col gap-2.5" : "flex h-full flex-col gap-2.5 overflow-y-auto"}>
      <div className="text-[12px] uppercase tracking-[2px] text-oro-light/70">Storico indizi</div>
      {log.length === 0 && (
        <div className="text-[13px] italic text-crema/40">Nessun indizio ancora dato.</div>
      )}
      {log.map((entry, i) => {
        if (entry.type === "clue") {
          const color = TEAM_COLOR_HEX[entry.teamColor];
          return (
            <div
              key={i}
              className="rounded-md border border-[#5a3a22] bg-[#2a160c] py-2 pl-3 pr-3"
              style={{ borderLeft: `4px solid ${color}` }}
            >
              <div className="font-display text-[13px] tracking-wide" style={{ color }}>
                {TEAM_LABEL[entry.teamColor]} — indizio
              </div>
              <div className="text-[13px] text-crema">
                "{entry.word}" → {entry.number === "inf" ? "∞" : entry.number}
              </div>
            </div>
          );
        }

        const { label, color } = resultLabel(entry);
        const headerColor = TEAM_COLOR_HEX[entry.teamColor];
        return (
          <div
            key={i}
            className="rounded-md border border-[#5a3a22] bg-[#2a160c] py-2 pl-3 pr-3"
            style={{ borderLeft: `4px solid ${headerColor}` }}
          >
            <div className="font-display text-[13px] tracking-wide" style={{ color: headerColor }}>
              {TEAM_LABEL[entry.teamColor]} ha girato
            </div>
            <div className="text-[13px] text-crema">
              "{entry.word}" → <span style={{ color }}>{label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
