import { useState } from "react";
import { useIsMobileLayout } from "./lobby/useIsMobileLayout";
import { buildInviteLink } from "../lib/roomCode";

const CENSORED_MASK = "•••••";

/**
 * Badge col codice stanza: nascosto di default (protegge da chi guarda lo
 * schermo, es. streaming/foto), con toggle per rivelarlo e un tasto per
 * copiarlo negli appunti — deciso il 2026-07-16.
 *
 * Su desktop resta `fixed` in basso al centro (lobby non scrollabile, nessun
 * rischio di coprire bottoni). Su mobile la lobby è invece impilata e
 * scrollabile: un badge `fixed` lì finisce quasi sempre sopra un bottone
 * reale nella posizione di riposo (verificato con screenshot — copriva
 * "Unisciti a questa Compagnia" appena atterrati in lobby), quindi lì
 * diventa parte del normale flusso della pagina, in cima, mai sovrapposto a
 * nulla.
 */
export default function RoomCodeBadge({ code }: { code: string }) {
  const isMobile = useIsMobileLayout();
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
    <div
      className={`z-50 flex items-center gap-2 rounded-full border border-oro bg-inchiostro/90 px-3.5 py-1.5 font-display text-[13px] tracking-[2px] text-oro-light ${
        isMobile
          ? "relative mx-auto mt-2 w-fit"
          : "fixed bottom-3 left-1/2 -translate-x-1/2"
      }`}
    >
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
