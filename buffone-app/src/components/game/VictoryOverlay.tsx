import { motion } from "framer-motion";
import { TEAM_COLOR_HEX, TEAM_LABEL, type TeamColor } from "../../types";

// Sovraschermata locale al singolo browser (mai sincronizzata in rete, stesso
// pattern delle altre feature "private" — vedi memoria game-board-architecture
// punto 4): appare da sola alla vittoria, ma resta finché il giocatore non la
// chiude lui stesso, per lasciargli decidere quando passare a osservare il
// tabellone ormai rivelato. Deciso il 2026-07-20.
export default function VictoryOverlay({
  winnerTeamId,
  onClose,
}: {
  winnerTeamId: TeamColor;
  onClose: () => void;
}) {
  const color = TEAM_COLOR_HEX[winnerTeamId];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 14 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-w-md flex-col items-center gap-6 rounded-2xl border-[3px] bg-[#1c0f08] px-10 py-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
        style={{ borderColor: color }}
      >
        <div className="font-display text-[13px] uppercase tracking-[3px] text-oro-light/70">
          Partita conclusa
        </div>
        <div
          className="font-display text-[38px] leading-tight tracking-wide"
          style={{ color, textShadow: "0 3px 0 rgba(0,0,0,0.4)" }}
        >
          🏆 {TEAM_LABEL[winnerTeamId]}
          <br />
          HA VINTO!
        </div>
        <button
          onClick={onClose}
          className="rounded-lg border-2 px-5 py-2.5 font-display text-[14px] tracking-wide text-crema hover:brightness-125"
          style={{ borderColor: color }}
        >
          Guarda il tabellone →
        </button>
      </motion.div>
    </div>
  );
}
