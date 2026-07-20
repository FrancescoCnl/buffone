import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cardBack, cardFront } from "../assets";
import type { GameCard, CardColor, TeamColor } from "../types";
import { TEAM_COLOR_HEX } from "../types";

const TINT: Record<CardColor, string> = {
  red: "#b3392c",
  blue: "#2c5f8a",
  green: "#3f7a4f",
  yellow: "#c99a2e",
  neutral: "transparent",
  jester: "#161615",
};

interface ConfettiParticle {
  left: string;
  color: string;
  delay: string;
  duration: string;
}

function buildConfetti(color: string): ConfettiParticle[] {
  return Array.from({ length: 14 }).map(() => ({
    left: `${Math.random() * 90}%`,
    color,
    delay: `${(Math.random() * 0.2).toFixed(2)}s`,
    duration: `${(0.7 + Math.random() * 0.4).toFixed(2)}s`,
  }));
}

export type CardNote = "maybe" | "sure";

interface CardProps {
  card: GameCard;
  /** "spymaster" vede sempre il vero colore, "player" vede neutro finché non è rivelata */
  viewerRole: "spymaster" | "player";
  onReveal: (id: string) => void;
  disabled?: boolean;
  /** Partita finita: i veri colori vanno mostrati a tutti, anche sulle carte mai girate. */
  revealAll?: boolean;
  /** Capo in fase indizio: click seleziona/deseleziona la carta (solo locale, mai in rete). */
  selectableForClue?: boolean;
  selectedForClue?: boolean;
  onToggleSelectForClue?: () => void;
  /** Giocatore in "modalità appunti": click marca invece di girare (solo locale, mai in rete). */
  notesMode?: boolean;
  note?: CardNote | null;
  onCycleNote?: () => void;
}

export default function Card({
  card,
  viewerRole,
  onReveal,
  disabled,
  revealAll,
  selectableForClue,
  selectedForClue,
  onToggleSelectForClue,
  notesMode,
  note,
  onCycleNote,
}: CardProps) {
  const [shaking, setShaking] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [popping, setPopping] = useState(false);
  const [jesterBlinking, setJesterBlinking] = useState(false);
  // "Sbircia" una carta già girata: la rimostra a fronte scoperto per un
  // attimo, senza mai toccare `card.revealed`/`resultKind` né chiamare
  // `onReveal` — puramente un effetto visivo locale, la carta resta
  // esattamente rivelata com'era (scelta di design del
  // 2026-07-16: non deve MAI poter rientrare in gioco).
  const [peeking, setPeeking] = useState(false);

  const seenColor: CardColor =
    viewerRole === "spymaster" || card.revealed || revealAll ? card.color : "neutral";
  const tint = TINT[seenColor];
  const confetti =
    card.resultKind === "own" ? buildConfetti(TEAM_COLOR_HEX[card.color as TeamColor]) : [];

  useEffect(() => {
    if (!card.revealed) return;
    if (card.resultKind === "own") {
      setShowSpotlight(true);
      setShowConfetti(true);
      setPopping(true);
      const t1 = setTimeout(() => setShowSpotlight(false), 700);
      const t2 = setTimeout(() => setShowConfetti(false), 1200);
      const t3 = setTimeout(() => setPopping(false), 450);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
    if (card.resultKind === "jester") {
      setJesterBlinking(true);
      const t = setTimeout(() => setJesterBlinking(false), 1500);
      return () => clearTimeout(t);
    }
  }, [card.revealed, card.resultKind]);

  function handleClick() {
    if (card.revealed) {
      if (peeking) return;
      setPeeking(true);
      setTimeout(() => setPeeking(false), 1400);
      return;
    }
    if (selectableForClue) {
      onToggleSelectForClue?.();
      return;
    }
    if (notesMode) {
      onCycleNote?.();
      return;
    }
    if (disabled) return;
    setShaking(true);
    setTimeout(() => {
      setShaking(false);
      onReveal(card.id);
    }, 650);
  }

  return (
    <div
      className="h-full min-h-0 w-full min-w-0 [perspective:1200px] [isolation:isolate]"
      onClick={handleClick}
    >
      <motion.div
        className="relative h-full w-full cursor-pointer [transform-style:preserve-3d]"
        animate={
          shaking
            ? { x: [0, -3, 3, -2, 2, 0], rotate: [0, -1, 1, -0.5, 0.5, 0] }
            : {
                rotateY: card.revealed && !peeking ? 180 : 0,
                scale: popping ? [1, 1.09, 1] : 1,
              }
        }
        transition={
          shaking
            ? { duration: 0.6 }
            : { type: "spring", stiffness: 120, damping: 12, duration: 0.9 }
        }
      >
        {/* SPOTLIGHT (match squadra propria) */}
        {showSpotlight && (
          <div
            className="pointer-events-none absolute -inset-[30%] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(186,117,23,0.9) 0%, rgba(186,117,23,0) 70%)",
              animation: "spotlightPulse 650ms ease-out",
            }}
          />
        )}

        {/* FRONTE */}
        <div
          className="absolute inset-0 overflow-hidden rounded-md shadow-lg [backface-visibility:hidden]"
          style={jesterBlinking ? { animation: "jesterBlink 500ms ease-in-out 3" } : undefined}
        >
          <img src={cardFront} alt="" className="absolute inset-0 h-full w-full object-fill" />
          <div
            className="absolute inset-0 mix-blend-multiply"
            style={{ background: tint, opacity: seenColor === "neutral" ? 0 : 0.55 }}
          />
          <div className="absolute inset-0 flex items-start justify-center pt-[18%]">
            <span className="font-serif text-[clamp(10px,1.3vw,18px)] font-semibold tracking-wide text-inchiostro px-2 text-center">
              {card.word}
            </span>
          </div>

          {/* Selezione del capo in fase indizio: solo locale, mai in rete —
              nessun altro client vede questo anello. */}
          {selectedForClue && (
            <div className="pointer-events-none absolute inset-0 rounded-md ring-[3px] ring-inset ring-oro" />
          )}

          {/* Appunto personale del giocatore: solo locale, mai in rete. */}
          {note && (
            <div
              className={`pointer-events-none absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                note === "sure"
                  ? "border-2 border-oro bg-oro text-inchiostro"
                  : "border-2 border-dashed border-oro bg-inchiostro/80 text-oro-light"
              }`}
            >
              {note === "sure" ? "✓" : "?"}
            </div>
          )}
        </div>

        {/* RETRO */}
        <div
          className="absolute inset-0 overflow-hidden rounded-md shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={jesterBlinking ? { animation: "jesterBlink 500ms ease-in-out 3" } : undefined}
        >
          <img src={cardBack} alt="" className="absolute inset-0 h-full w-full object-fill" />
          <div
            className="absolute inset-0 mix-blend-multiply"
            style={{ background: tint, opacity: seenColor === "neutral" ? 0.08 : 0.55 }}
          />
          <div className="absolute inset-0 flex items-center justify-center p-[6%]">
            <img
              src={card.illustration}
              alt=""
              className="max-h-full max-w-full object-contain drop-shadow-sm"
            />
          </div>
        </div>

        {/* CONFETTI (match squadra propria) */}
        {showConfetti && (
          <div className="pointer-events-none absolute inset-0 z-10 overflow-visible">
            {confetti.map((p, i) => (
              <div
                key={i}
                className="absolute top-[40%] h-2.5 w-1.5"
                style={{
                  left: p.left,
                  background: p.color,
                  animation: `confettiFall ${p.duration} ease-in ${p.delay} forwards`,
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
