import Card, { type CardNote } from "../Card";
import type { GameState } from "./useGameState";
import { useFitGrid } from "./useFitGrid";

const GAP_PX = 6;

export default function CardGrid({
  game,
  pov,
  isMobile,
  canReveal,
  selectableForClue,
  selectedForClue,
  onToggleSelectForClue,
  notesMode,
  notes,
  onCycleNote,
}: {
  game: GameState;
  pov: "spymaster" | "player";
  isMobile?: boolean;
  canReveal: boolean;
  selectableForClue?: boolean;
  selectedForClue?: Set<string>;
  onToggleSelectForClue?: (cardId: string) => void;
  notesMode?: boolean;
  notes?: Record<string, CardNote>;
  onCycleNote?: (cardId: string) => void;
}) {
  const canClick = game.phase === "guessing" && !game.winnerTeamId && canReveal;
  const { containerRef, cardWidth, cardHeight } = useFitGrid(game.cols, game.rows, GAP_PX);

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center rounded-[14px] border border-[#5a3a22] bg-[#2a160c] p-2.5 ${
        isMobile ? "h-[62vh] min-h-[300px] w-full" : "min-h-0 flex-1"
      } ${game.boardShaking ? "animate-board-shake" : ""}`}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${game.cols}, ${cardWidth}px)`,
          gridTemplateRows: `repeat(${game.rows}, ${cardHeight}px)`,
          gap: `${GAP_PX}px`,
        }}
      >
        {game.grid.map((card) => (
          <Card
            key={card.id}
            card={card}
            viewerRole={pov}
            onReveal={game.revealCard}
            disabled={!canClick}
            selectableForClue={selectableForClue}
            selectedForClue={selectedForClue?.has(card.id)}
            onToggleSelectForClue={() => onToggleSelectForClue?.(card.id)}
            notesMode={notesMode}
            note={notes?.[card.id] ?? null}
            onCycleNote={() => onCycleNote?.(card.id)}
          />
        ))}
      </div>
    </div>
  );
}
