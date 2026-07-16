// Alfabeto senza caratteri ambigui (niente 0/O, 1/I/L).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateRoomCode(length = 5): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

export function normalizeRoomCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// Query string, mai un dominio hardcoded: funziona identico su qualunque
// hosting statico (Vercel/Netlify/Cloudflare Pages/GitHub Pages, incluso
// sotto-percorso) e in locale, perché `origin`/`pathname` vengono letti dal
// browser al momento della chiamata, non scritti a mano.
export function buildInviteLink(code: string): string {
  return `${window.location.origin}${window.location.pathname}?room=${code}`;
}

// Letto una sola volta al mount di RoomEntry: nessun router, nessun redirect
// server-side, solo `URLSearchParams` sull'URL corrente — non può interferire
// con l'autenticazione anonima Supabase (che non passa mai per l'URL) né con
// altri parametri futuri, perché legge solo la chiave "room".
export function readInviteCodeFromUrl(): string | null {
  const raw = new URLSearchParams(window.location.search).get("room");
  return raw ? normalizeRoomCode(raw) : null;
}
