import { useState } from "react";
import { buildInviteLink } from "../lib/roomCode";

const CENSORED_MASK = "•••••";

/**
 * Badge col codice stanza: nascosto di default (protegge da chi guarda lo
 * schermo, es. streaming/foto), con toggle per rivelarlo e un tasto per
 * copiarlo negli appunti — deciso il 2026-07-16.
 *
 * Sempre in-flow (non più `fixed`), montato dentro l'header della lobby
 * insieme al link "Regole del gioco": prima viveva da solo, `fixed` in fondo
 * allo schermo, e finiva sovrapposto al pannello regole quando quest'ultimo
 * cresceva in altezza (emerso in playtest il 2026-07-22) — l'header è
 * l'unica fascia della lobby non contesa dagli angoli delle Compagnie né dal
 * pannello centrale, quindi è la posizione stabile per qualunque numero di
 * Compagnie/dimensione del pannello.
 */
export default function RoomCodeBadge({ code }: { code: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(buildInviteLink(code));
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1500);
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-oro bg-inchiostro/90 px-3.5 py-1.5 font-display text-[13px] tracking-[2px] text-oro-light">
      <span>Stanza</span>
      <span className="min-w-[5ch] text-center">{revealed ? code : CENSORED_MASK}</span>
      <button
        onClick={() => setRevealed((v) => !v)}
        title={revealed ? "Nascondi codice" : "Mostra codice"}
        className="rounded-full px-1.5 py-0.5 text-[15px] leading-none hover:bg-oro/15"
      >
        {revealed ? "🔓" : "🔒"}
      </button>
      <button
        onClick={handleCopy}
        title="Copia codice"
        className="rounded-full px-1.5 py-0.5 text-[15px] leading-none hover:bg-oro/15"
      >
        {copied ? "✓" : "📋"}
      </button>
      <button
        onClick={handleCopyLink}
        title="Copia link di invito"
        className="rounded-full px-1.5 py-0.5 text-[15px] leading-none hover:bg-oro/15"
      >
        {linkCopied ? "✓" : "🔗"}
      </button>
    </div>
  );
}
