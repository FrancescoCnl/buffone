import { useEffect, useState } from "react";
import { generateRoomCode, normalizeRoomCode, readInviteCodeFromUrl } from "../lib/roomCode";

export default function RoomEntry({
  error,
  onEnter,
}: {
  error?: string | null;
  onEnter: (roomCode: string, playerName: string, isHost: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<"choose" | "join">(error ? "join" : "choose");

  // Link di invito (?room=CODICE): precompila il codice e apre subito il
  // modulo "Entra con un codice", ma NON invia da solo — il nome va comunque
  // scelto e il tasto cliccato a mano, per non rischiare un ingresso
  // automatico in una stanza sbagliata/scaduta. Ripulisce l'URL subito dopo
  // averlo letto (solo estetico, `replaceState` non ricarica la pagina) così
  // non resta appeso alla barra degli indirizzi.
  useEffect(() => {
    const invited = readInviteCodeFromUrl();
    if (!invited) return;
    setJoinCode(invited);
    setMode("join");
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const trimmedName = name.trim();

  function handleCreate() {
    if (!trimmedName) return;
    onEnter(generateRoomCode(), trimmedName, true);
  }

  function handleJoin() {
    const code = normalizeRoomCode(joinCode);
    if (!trimmedName || !code) return;
    onEnter(code, trimmedName, false);
  }

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-inchiostro px-4 text-crema">
      <h1 className="font-display text-4xl tracking-widest text-oro-light">BUFFONE</h1>

      {error && (
        <p className="w-64 text-center text-[13px] text-red-400">{error}</p>
      )}

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Il tuo nome"
        maxLength={20}
        className="w-64 rounded border-2 border-oro bg-crema px-3.5 py-2.5 text-center font-serif text-inchiostro"
      />

      {mode === "choose" && (
        <div className="flex flex-col items-center gap-3">
          <button
            disabled={!trimmedName}
            onClick={handleCreate}
            className="w-64 rounded bg-oro py-3 font-display tracking-wide text-inchiostro disabled:cursor-not-allowed disabled:opacity-40"
          >
            Crea una nuova stanza
          </button>
          <button
            disabled={!trimmedName}
            onClick={() => setMode("join")}
            className="w-64 rounded border border-oro py-3 font-display tracking-wide text-oro-light disabled:cursor-not-allowed disabled:opacity-40"
          >
            Entra con un codice
          </button>
        </div>
      )}

      {mode === "join" && (
        <div className="flex flex-col items-center gap-3">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Codice stanza"
            maxLength={8}
            className="w-64 rounded border-2 border-oro bg-crema px-3.5 py-2.5 text-center font-display tracking-[4px] text-inchiostro"
          />
          <button
            disabled={!trimmedName || !joinCode.trim()}
            onClick={handleJoin}
            className="w-64 rounded bg-oro py-3 font-display tracking-wide text-inchiostro disabled:cursor-not-allowed disabled:opacity-40"
          >
            Entra nella stanza
          </button>
          <button
            onClick={() => setMode("choose")}
            className="font-serif text-[13px] text-crema/60 hover:text-crema"
          >
            ← Indietro
          </button>
        </div>
      )}

      <div className="mt-2 flex items-center gap-3">
        <a
          href="/regole.html"
          target="_blank"
          rel="noopener noreferrer"
          className="font-serif text-[11.5px] text-crema/40 hover:text-crema/70"
        >
          📖 Come si gioca
        </a>
        <a
          href="/privacy.html"
          target="_blank"
          rel="noopener noreferrer"
          className="font-serif text-[11.5px] text-crema/40 hover:text-crema/70"
        >
          Privacy Policy
        </a>
      </div>
      <p className="mt-1 font-serif text-[10.5px] text-crema/30">
        Illustrazioni generate con intelligenza artificiale.
      </p>
    </div>
  );
}
