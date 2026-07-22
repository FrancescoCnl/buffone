import { useEffect, useRef, useState } from "react";
import { useGameState } from "./useGameState";
import Scoreboard from "./Scoreboard";
import CluePanel from "./CluePanel";
import CardGrid from "./CardGrid";
import LogPanel from "./LogPanel";
import VictoryOverlay from "./VictoryOverlay";
import { useIsMobileLayout } from "../lobby/useIsMobileLayout";
import { TEAM_COLOR_HEX, TEAM_LABEL, type TeamColor } from "../../types";
import type { LobbyState } from "../lobby/useLobbyState";
import type { RoomChannel } from "../../hooks/useRoomChannel";
import type { CardNote } from "../Card";

const BG_GRADIENT = "radial-gradient(ellipse at 50% 0%, #3a1a0e 0%, #1c0f08 70%)";
const TEAM_ORDER: TeamColor[] = ["red", "blue", "green", "yellow"];

// Sfondo tinto col colore della propria Compagnia — deciso il
// 2026-07-20 dopo un playtest in cui era difficile ricordarsi la propria
// squadra durante la partita. Il radial di base resta identico, si aggiunge
// solo un secondo layer radiale col colore della squadra molto attenuato.
function boardBackground(myColor: TeamColor | null): string {
  if (!myColor) return BG_GRADIENT;
  return `radial-gradient(ellipse at 50% 0%, ${TEAM_COLOR_HEX[myColor]}b3 0%, ${TEAM_COLOR_HEX[myColor]}40 45%, transparent 85%), ${BG_GRADIENT}`;
}

export default function GameBoard({
  lobby,
  channel,
  isHost,
}: {
  lobby: LobbyState;
  channel: RoomChannel;
  isHost: boolean;
}) {
  // Config is snapshotted once by useGameState on first render — later lobby
  // edits (impossible mid-match anyway) won't reset an in-progress game.
  const game = useGameState(channel, isHost, {
    numTeams: lobby.numTeams,
    riskLevel: lobby.riskLevel,
    customJesterCount: lobby.customJesterCount,
    clueTimer: lobby.clueTimer,
    guessTimer: lobby.guessTimer,
  });

  const [confirmingExit, setConfirmingExit] = useState(false);
  const [confirmingNewGame, setConfirmingNewGame] = useState(false);

  // Sez. 3.1 del doc di design: la vista dipende dal proprio ruolo reale,
  // non da un toggle manuale — i capi vedono sempre i veri colori.
  const pov: "spymaster" | "player" = lobby.you.role === "capo" ? "spymaster" : "player";

  // Chi può davvero agire ora: solo il capo della squadra IN TURNO dà
  // l'indizio, solo un giocatore normale della squadra IN TURNO gira le
  // carte/passa il turno — prima non c'era alcun controllo qui e chiunque,
  // con qualsiasi ruolo, poteva fare entrambe le cose in ogni momento (bug
  // emerso in playtest il 2026-07-15).
  const myTeamColor = lobby.you.teamId !== null ? TEAM_ORDER[lobby.you.teamId] : null;
  const isMyTeamTurn = myTeamColor !== null && myTeamColor === game.activeTeam;
  const canGiveClue = isMyTeamTurn && pov === "spymaster";
  const canReveal = isMyTeamTurn && pov === "player";

  // Selezione privata del capo mentre prepara l'indizio: solo stato locale a
  // questo browser, mai spedita in rete — nessun altro client la vede
  // (scelta di design del 2026-07-16). Serve solo a
  // precompilare il numero dell'indizio, il capo può comunque correggerlo a
  // mano dopo (dare un numero minore delle carte selezionate è una mossa
  // legittima).
  const [selectedForClue, setSelectedForClue] = useState<Set<string>>(new Set());
  const selectableForClue = canGiveClue && game.phase === "clue";

  function toggleSelectForClue(cardId: string) {
    setSelectedForClue((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  }

  // Svuota la selezione a ogni nuovo turno/fase indizio — altrimenti
  // resterebbe visibile (e sbagliata) sul turno successivo.
  useEffect(() => {
    setSelectedForClue(new Set());
  }, [game.phase, game.currentTurnIdx]);

  useEffect(() => {
    if (!selectableForClue || selectedForClue.size === 0) return;
    game.setClueNumber(String(Math.min(selectedForClue.size, 8)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedForClue]);

  // Appunti personali del giocatore normale ("quali penso siano nostre"):
  // stato locale, mai in rete, mai visto dagli altri — attivabile solo dai
  // giocatori non-capo (i capi vedono già i colori veri, non serve loro).
  // Deciso il 2026-07-16.
  const [notesMode, setNotesMode] = useState(false);
  const [notes, setNotes] = useState<Record<string, CardNote>>({});

  function cycleNote(cardId: string) {
    setNotes((prev) => {
      const current = prev[cardId];
      const next = { ...prev };
      if (!current) next[cardId] = "maybe";
      else if (current === "maybe") next[cardId] = "sure";
      else delete next[cardId];
      return next;
    });
  }

  // Gli id delle carte sono posizionali (card-0, card-1...), quindi restano
  // identici da una partita all'altra: senza questo reset, gli appunti presi
  // sulla partita precedente resterebbero incollati alle carte nella stessa
  // posizione del nuovo tabellone, mostrando note sbagliate.
  useEffect(() => {
    setNotes({});
  }, [game.round]);

  // Stesso breakpoint della lobby (760px larghezza o 480px altezza): sotto
  // quella soglia le colonne a larghezza fissa (scoreboard/storico) non ci
  // starebbero e verrebbero tagliate da overflow-hidden — si passa quindi a
  // un layout impilato e scrollabile, coerente con LobbyCapoView/PlayerView.
  // Chiamato incondizionatamente (regole degli Hook) anche mentre si aspetta
  // la sincronizzazione: il valore semplicemente non serve finché non si
  // esce dal ramo `!game.ready` qui sotto.
  const isMobile = useIsMobileLayout();

  // Sovraschermata di vittoria: appare in automatico solo al momento vero
  // della vittoria (transizione null → squadra), mai per un client che si
  // ricollega/ricarica a partita già finita — in quel caso resta comunque
  // disponibile cliccando il badge "Vince…" in header (vedi winnerBanner).
  const [showVictoryOverlay, setShowVictoryOverlay] = useState(false);
  const prevWinnerTeamId = useRef<typeof game.winnerTeamId>(null);
  useEffect(() => {
    if (game.winnerTeamId && !prevWinnerTeamId.current) {
      setShowVictoryOverlay(true);
    }
    prevWinnerTeamId.current = game.winnerTeamId;
  }, [game.winnerTeamId]);

  if (!game.ready) {
    return (
      <div
        className="flex h-screen w-screen items-center justify-center text-crema"
        style={{ background: BG_GRADIENT }}
      >
        <p className="font-display text-xl tracking-widest text-oro-light">
          Sincronizzazione con la stanza…
        </p>
      </div>
    );
  }

  // Unico indicatore persistente di fine partita (sostituisce sia la vecchia
  // scritta duplicata in CluePanel sia questo stesso banner statico) — clic
  // per riaprire la sovraschermata di vittoria se l'hai già chiusa.
  const winnerBanner = game.winnerTeamId && (
    <button
      onClick={() => setShowVictoryOverlay(true)}
      title="Rivedi l'annuncio di vittoria"
      className="rounded-full border border-oro bg-vinaccia px-3.5 py-1.5 text-[14px] text-crema hover:bg-vinaccia-dark"
    >
      🏆 Vince{" "}
      <span style={{ color: TEAM_COLOR_HEX[game.winnerTeamId] }}>
        {TEAM_LABEL[game.winnerTeamId]}
      </span>
    </button>
  );

  const victoryOverlay = showVictoryOverlay && game.winnerTeamId && (
    <VictoryOverlay
      winnerTeamId={game.winnerTeamId}
      onClose={() => setShowVictoryOverlay(false)}
    />
  );

  const exitButton = (
    <button
      onClick={() => setConfirmingExit(true)}
      className="rounded-lg border border-oro px-3.5 py-2 font-display text-[13px] tracking-wide text-oro-light hover:bg-oro/10"
    >
      ↩ Torna alla lobby
    </button>
  );

  // Solo il capo-lobby (non il capo di una Compagnia — sono ruoli diversi,
  // vedi memoria game-board-architecture) può rigenerare una partita, sempre
  // visibile per lui, non solo a partita conclusa (deciso il
  // 2026-07-23) — rigenera subito un nuovo tabellone con le stesse
  // Compagnie/regole, senza passare dalla lobby. A partita ancora in corso
  // chiede conferma (stesso pattern del pulsante "Torna alla lobby": è
  // un'azione distruttiva per tutti i giocatori); a partita già conclusa
  // parte subito, senza nulla da perdere.
  const newGameButton = isHost && (
    <button
      onClick={() => (game.winnerTeamId ? game.newGame() : setConfirmingNewGame(true))}
      className="rounded-lg border border-oro bg-oro/15 px-3.5 py-2 font-display text-[13px] tracking-wide text-oro-light hover:bg-oro/25"
    >
      🔄 Nuova partita
    </button>
  );

  const newGameConfirmDialog = confirmingNewGame && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-md border-[3px] border-oro bg-crema p-5 text-inchiostro shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
        <h2 className="mb-2 font-display text-lg tracking-wide text-vinaccia">
          Ricominciare la partita?
        </h2>
        <p className="mb-4 text-[13.5px] text-inchiostro/80">
          La partita in corso verrà annullata per tutti i giocatori e sostituita da un nuovo
          tabellone, con le stesse Compagnie e regole.
        </p>
        <div className="flex justify-end gap-2.5">
          <button
            onClick={() => setConfirmingNewGame(false)}
            className="rounded border border-vinaccia px-3.5 py-2 font-serif text-[13px] text-vinaccia hover:bg-vinaccia hover:text-crema"
          >
            Annulla
          </button>
          <button
            onClick={() => {
              game.newGame();
              setConfirmingNewGame(false);
            }}
            className="rounded bg-vinaccia px-3.5 py-2 font-serif text-[13px] font-bold text-crema hover:bg-vinaccia-dark"
          >
            Sì, ricomincia
          </button>
        </div>
      </div>
    </div>
  );

  const rulesLink = (
    <a
      href="/regole.html"
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-lg border border-oro/50 px-3 py-2 font-display text-[13px] tracking-wide text-oro-light/70 hover:bg-oro/10 hover:text-oro-light"
    >
      📖 Come si gioca
    </a>
  );

  // Indicatore fisso della propria Compagnia, sempre visibile in header —
  // deciso il 2026-07-20 dopo un playtest in cui era difficile
  // ricordarsi la propria squadra durante la partita.
  const myTeamBadge = myTeamColor && (
    <div
      className="flex items-center gap-1.5 rounded-full border-2 px-3 py-1"
      style={{ borderColor: TEAM_COLOR_HEX[myTeamColor], background: `${TEAM_COLOR_HEX[myTeamColor]}33` }}
    >
      <span
        className="h-3 w-3 flex-none rounded-full"
        style={{ background: TEAM_COLOR_HEX[myTeamColor] }}
      />
      <span className="font-serif text-[12.5px] tracking-wide text-crema">
        La tua Compagnia: <strong>{TEAM_LABEL[myTeamColor]}</strong>
      </span>
    </div>
  );

  // Chiude la partita per TUTTI i giocatori, non solo per chi clicca —
  // deciso il 2026-07-15. Con conferma perché è un'azione
  // distruttiva per l'intero tavolo, non solo per chi la esegue.
  const exitConfirmDialog = confirmingExit && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-md border-[3px] border-oro bg-crema p-5 text-inchiostro shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
        <h2 className="mb-2 font-display text-lg tracking-wide text-vinaccia">
          Uscire dalla partita?
        </h2>
        <p className="mb-4 text-[13.5px] text-inchiostro/80">
          La partita verrà chiusa per tutti i giocatori e si tornerà alla lobby pre-partita.
        </p>
        <div className="flex justify-end gap-2.5">
          <button
            onClick={() => setConfirmingExit(false)}
            className="rounded border border-vinaccia px-3.5 py-2 font-serif text-[13px] text-vinaccia hover:bg-vinaccia hover:text-crema"
          >
            Annulla
          </button>
          <button
            onClick={() => lobby.endGame()}
            className="rounded bg-vinaccia px-3.5 py-2 font-serif text-[13px] font-bold text-crema hover:bg-vinaccia-dark"
          >
            Sì, esci per tutti
          </button>
        </div>
      </div>
    </div>
  );

  // Solo i giocatori normali possono lasciare appunti (i capi vedono già i
  // colori veri, non serve loro) — pulsante che attiva/disattiva la
  // "modalità appunti" scelta il 2026-07-16.
  const notesToggle = pov === "player" && (
    <button
      onClick={() => setNotesMode((v) => !v)}
      className={`rounded-lg border px-3.5 py-2 font-display text-[13px] tracking-wide ${
        notesMode
          ? "border-oro bg-oro text-inchiostro"
          : "border-oro text-oro-light hover:bg-oro/10"
      }`}
    >
      ✏️ Modalità appunti: {notesMode ? "ON" : "OFF"}
    </button>
  );

  if (isMobile) {
    return (
      <div
        className="relative min-h-screen overflow-auto p-3 text-crema"
        style={{ background: boardBackground(myTeamColor) }}
      >
        {exitConfirmDialog}
        {newGameConfirmDialog}
        {victoryOverlay}
        <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h1
            className="font-display text-[28px] tracking-[3px] text-oro-light"
            style={{ textShadow: "0 2px 0 #2C2C2A" }}
          >
            BUFFONE
          </h1>
          <div className="flex items-center gap-2">
            {rulesLink}
            {newGameButton}
            {exitButton}
          </div>
        </header>
        {myTeamBadge && <div className="mb-3">{myTeamBadge}</div>}
        {winnerBanner && <div className="mb-3">{winnerBanner}</div>}
        <Scoreboard game={game} isMobile myTeamColor={myTeamColor} />
        <div className="mt-3">
          <CluePanel
            game={game}
            canGiveClue={canGiveClue}
            canPassTurn={canReveal}
            selectedCount={selectableForClue ? selectedForClue.size : 0}
          />
        </div>
        {notesToggle && <div className="mt-3">{notesToggle}</div>}
        <div className="mt-3">
          <CardGrid
            game={game}
            pov={pov}
            isMobile
            canReveal={canReveal}
            selectableForClue={selectableForClue}
            selectedForClue={selectedForClue}
            onToggleSelectForClue={toggleSelectForClue}
            notesMode={notesMode}
            notes={notes}
            onCycleNote={cycleNote}
          />
        </div>
        <div className="mt-3">
          <LogPanel log={game.log} isMobile />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-screen w-screen overflow-hidden p-3.5 text-crema"
      style={{ background: boardBackground(myTeamColor) }}
    >
      {exitConfirmDialog}
      {newGameConfirmDialog}
      {victoryOverlay}
      <header className="mb-3.5 flex flex-shrink-0 flex-wrap items-center justify-between gap-4">
        <div className="flex items-baseline gap-3.5">
          <h1
            className="font-display text-[36px] tracking-[4px] text-oro-light"
            style={{ textShadow: "0 2px 0 #2C2C2A" }}
          >
            BUFFONE
          </h1>
          {myTeamBadge}
          {winnerBanner}
        </div>
        <div className="flex items-center gap-2">
          {rulesLink}
          {newGameButton}
          {exitButton}
        </div>
      </header>

      <div className="grid h-[calc(100%-64px)] grid-cols-[148px_1fr_168px] gap-2.5">
        <Scoreboard game={game} myTeamColor={myTeamColor} />
        <div className="flex min-h-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1">
              <CluePanel
                game={game}
                canGiveClue={canGiveClue}
                canPassTurn={canReveal}
                selectedCount={selectableForClue ? selectedForClue.size : 0}
              />
            </div>
            {notesToggle}
          </div>
          <CardGrid
            game={game}
            pov={pov}
            canReveal={canReveal}
            selectableForClue={selectableForClue}
            selectedForClue={selectedForClue}
            onToggleSelectForClue={toggleSelectForClue}
            notesMode={notesMode}
            notes={notes}
            onCycleNote={cycleNote}
          />
        </div>
        <LogPanel log={game.log} />
      </div>
    </div>
  );
}
