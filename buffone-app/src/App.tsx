import { useEffect, useRef, useState } from "react";
import LobbyCapoView from "./components/lobby/LobbyCapoView";
import LobbyPlayerView from "./components/lobby/LobbyPlayerView";
import GameBoard from "./components/game/GameBoard";
import RoomEntry from "./components/RoomEntry";
import RoomCodeBadge from "./components/RoomCodeBadge";
import { useLobbyState } from "./components/lobby/useLobbyState";
import { useRoomChannel } from "./hooks/useRoomChannel";
import { useAnonymousAuth } from "./hooks/useAnonymousAuth";
import { getPlayerId } from "./lib/playerIdentity";

type Screen = "room-entry" | "joining" | "lobby" | "board";

interface RoomInfo {
  code: string;
  playerName: string;
  isHost: boolean;
}

// Quanto aspettare, da guest appena connesso al canale, prima di concludere
// che nessun host è presente sulla stanza (codice mai creato/scaduto).
const HOST_PRESENCE_TIMEOUT_MS = 2500;

export default function App() {
  const [screen, setScreen] = useState<Screen>("room-entry");
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const playerId = getPlayerId();

  // Sessione anonima Supabase, invisibile al giocatore: necessaria per i
  // canali Realtime "privati" (vedi useRoomChannel/useAnonymousAuth). Il
  // canale/room non viene creato finché non è pronta.
  const authReady = useAnonymousAuth();

  const channel = useRoomChannel(
    authReady ? (room?.code ?? null) : null,
    playerId,
    room?.playerName ?? "",
    room?.isHost ?? false
  );
  const lobby = useLobbyState(channel, playerId, room?.playerName ?? "", room?.isHost ?? false, 3);

  // `lobby.started` è l'unica sorgente di verità per "siamo in partita o in
  // lobby" — sincronizzata in rete, quindi vale per tutti i client allo
  // stesso modo: si avvia quando l'host clicca "Avvia Partita", si chiude
  // quando un giocatore qualsiasi conferma "Torna alla lobby" (chiude la
  // partita per tutti, deciso il 2026-07-15 — non è più un
  // semplice "sbircia la lobby" locale). Guardia su room/screen per non
  // sovrascrivere le schermate "room-entry"/"joining" prima ancora di essere
  // entrati in una stanza.
  useEffect(() => {
    if (!room || screen === "room-entry" || screen === "joining") return;
    setScreen(lobby.started ? "board" : "lobby");
  }, [lobby.started, room, screen]);

  // Un guest che entra con un codice mai creato (o di una stanza ormai
  // chiusa) non deve finire — nemmeno per pochi secondi — in una lobby vuota
  // che sembra valida: resta sulla schermata "joining" finché la presenza
  // dell'host non è confermata (emerso in playtest il 2026-07-15, prima
  // versione di questo fix mostrava comunque la lobby finta durante l'attesa).
  const presenceRef = useRef(channel.presence);
  useEffect(() => {
    presenceRef.current = channel.presence;
  }, [channel.presence]);

  useEffect(() => {
    if (!room || room.isHost || screen !== "joining") return;
    const hostPresent = Object.values(channel.presence).some((p) => p.isHost);
    if (hostPresent) setScreen("lobby");
  }, [room, screen, channel.presence]);

  useEffect(() => {
    if (!room || room.isHost || channel.status !== "connected" || screen !== "joining") return;
    const timeout = setTimeout(() => {
      const hostPresent = Object.values(presenceRef.current).some((p) => p.isHost);
      if (!hostPresent) {
        setJoinError(`Nessuna stanza trovata con il codice "${room.code}".`);
        setRoom(null);
        setScreen("room-entry");
      }
    }, HOST_PRESENCE_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [room, channel.status, screen]);

  if (!authReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-inchiostro text-crema">
        <p className="font-display text-xl tracking-widest text-oro-light">BUFFONE</p>
      </div>
    );
  }

  if (screen === "room-entry" || !room) {
    return (
      <RoomEntry
        error={joinError}
        onEnter={(code, playerName, isHost) => {
          setJoinError(null);
          setRoom({ code, playerName, isHost });
          setScreen(isHost ? "lobby" : "joining");
        }}
      />
    );
  }

  if (screen === "joining") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-inchiostro text-crema">
        <p className="font-display text-xl tracking-widest text-oro-light">
          Connessione alla stanza {room.code}…
        </p>
      </div>
    );
  }

  if (screen === "lobby") {
    return (
      <div className="relative">
        <RoomCodeBadge code={room.code} />
        {room.isHost ? (
          <LobbyCapoView lobby={lobby} onStart={() => lobby.startGame()} />
        ) : (
          <LobbyPlayerView lobby={lobby} />
        )}
      </div>
    );
  }

  return <GameBoard lobby={lobby} channel={channel} isHost={room.isHost} />;
}
