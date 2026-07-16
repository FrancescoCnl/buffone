import { fmtTime } from "./useGameState";
import type { GameState } from "./useGameState";
import { TEAM_COLOR_HEX, TEAM_LABEL } from "../../types";

const CLUE_NUMBER_OPTIONS = [
  { value: "0", label: "0" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "7", label: "7" },
  { value: "8", label: "8" },
  { value: "inf", label: "∞" },
];

export default function CluePanel({
  game,
  canGiveClue,
  canPassTurn,
  selectedCount,
}: {
  game: GameState;
  canGiveClue: boolean;
  canPassTurn: boolean;
  /** Quante carte il capo ha selezionato privatamente sulla griglia (vedi CardGrid). */
  selectedCount?: number;
}) {
  const activeColor = TEAM_COLOR_HEX[game.activeTeam];
  const activeName = TEAM_LABEL[game.activeTeam];

  if (game.winnerTeamId) {
    return (
      <div className="flex flex-shrink-0 items-center gap-4 rounded-xl border border-[#5a3a22] bg-[#2a160c] px-4.5 py-3.5">
        <div className="font-display text-lg tracking-wide text-crema">
          Partita conclusa —{" "}
          <span style={{ color: TEAM_COLOR_HEX[game.winnerTeamId] }}>
            {TEAM_LABEL[game.winnerTeamId]}
          </span>{" "}
          ha vinto!
        </div>
      </div>
    );
  }

  if (game.phase === "clue") {
    if (!canGiveClue) {
      return (
        <div className="flex flex-shrink-0 flex-wrap items-center gap-4 rounded-xl border border-[#5a3a22] bg-[#2a160c] px-4.5 py-3.5">
          <div className="font-display text-[15px] tracking-wide text-oro-light/80">
            In attesa che il capo di <span style={{ color: activeColor }}>{activeName}</span> dia
            l'indizio…
          </div>
          <div className="ml-auto text-sm text-oro-light/70">
            ⏱ indizio: {fmtTime(game.clueRemaining)}
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-shrink-0 flex-wrap items-center gap-4 rounded-xl border border-[#5a3a22] bg-[#2a160c] px-4.5 py-3.5">
        <div className="font-display text-[15px] tracking-wide text-oro-light/80">
          Il capo di <span style={{ color: activeColor }}>{activeName}</span> dà l'indizio:
        </div>
        <input
          type="text"
          placeholder="parola indizio"
          value={game.clueWordInput}
          onChange={(e) => game.setClueWord(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") game.submitClue();
          }}
          className="w-40 rounded-md border border-[#5a3a22] bg-inchiostro px-3 py-2 font-serif text-[15px] text-crema"
        />
        <select
          value={game.clueNumberInput}
          onChange={(e) => game.setClueNumber(e.target.value)}
          className="rounded-md border border-[#5a3a22] bg-inchiostro px-2.5 py-2 text-[15px] text-crema"
        >
          {CLUE_NUMBER_OPTIONS.map((n) => (
            <option key={n.value} value={n.value}>
              {n.label}
            </option>
          ))}
        </select>
        <button
          onClick={game.submitClue}
          className="rounded-lg bg-oro px-4.5 py-2.5 font-display text-[15px] font-bold tracking-wide text-inchiostro"
        >
          Dai indizio →
        </button>
        {!!selectedCount && (
          <div className="text-[12.5px] italic text-oro-light/70">
            {selectedCount} carta{selectedCount === 1 ? "" : "e"} selezionata
            {selectedCount === 1 ? "" : "e"} (solo tu la vedi) — numero precompilato
          </div>
        )}
        <div className="ml-auto text-sm text-oro-light/70">
          ⏱ indizio: {fmtTime(game.clueRemaining)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-shrink-0 flex-wrap items-center gap-3.5 rounded-xl border border-[#5a3a22] bg-[#2a160c] px-4.5 py-3.5">
      <div className="font-display text-xl tracking-wide text-crema">
        "{game.currentClue?.word}"{" "}
        <span style={{ color: activeColor }}>
          → {game.currentClue?.number === "inf" ? "∞" : game.currentClue?.number}
        </span>
      </div>
      <div className="text-[13px] text-oro-light/70">
        Tentativi: {game.guessesUsed} / {game.guessLimit === Infinity ? "∞" : game.guessLimit}
      </div>
      <div className="text-sm text-oro-light/70">⏱ indovinamento: {fmtTime(game.guessRemaining)}</div>
      {canPassTurn && (
        <button
          onClick={game.passTurn}
          className="ml-auto rounded-lg border border-oro px-4 py-2 font-display text-sm tracking-wide text-oro-light hover:bg-oro/10"
        >
          Passa il turno
        </button>
      )}
    </div>
  );
}
