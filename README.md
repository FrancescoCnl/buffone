# Buffone

Party game multiplayer a squadre, giocabile dal browser: si crea una stanza, si condivide il codice e ognuno si collega dal proprio telefono. È ispirato a Codenames, con un'ambientazione da circo e regole mie (più squadre, livelli di rischio, carte Giullare).

**Online su [buffone.vercel.app](https://buffone.vercel.app)**

## Come si gioca

I giocatori si dividono in **Compagnie** (da 2 a 4). Sulla griglia ci sono delle parole: ogni carta appartiene a una Compagnia, è neutra oppure è una carta **Giullare**. In ogni Compagnia il **Capo** vede i colori veri e dà un indizio di una parola; gli **Artisti** vedono solo le parole e devono indovinare quali sono le loro. La Compagnia che gira un Giullare viene eliminata; vince la prima che scopre tutte le proprie carte, o l'ultima rimasta in gioco.

Il regolamento completo è nella pagina [Come si gioca](https://buffone.vercel.app/regole.html).

## Stack

| | |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion |
| Realtime | Supabase Realtime (broadcast + presence), Supabase Auth anonima |
| Deploy | Vercel |

Non c'è un database di gioco: le partite vivono solo nei client collegati.

## Architettura

### Host-authoritative senza server
Ogni stanza è un canale Supabase Realtime. Il **capo-lobby** (host) tiene l'unica copia reale dello stato di lobby e di partita: gli altri client non modificano niente direttamente, ma inviano degli *intent* sul canale (es. "giro questa carta"). L'host li valida, applica la mossa e ritrasmette lo snapshot aggiornato a tutti.

In questo modo non ci sono conflitti tra scritture concorrenti e non serve un backend dedicato: la logica è un reducer TypeScript ([`useGameState.ts`](buffone-app/src/components/game/useGameState.ts), [`useLobbyState.ts`](buffone-app/src/components/lobby/useLobbyState.ts)).

### Presence e disconnessioni
La **presence** del canale tiene traccia di chi è collegato e di chi è l'host. Chi entra con un codice resta in attesa finché la presenza dell'host non è confermata, così non finisce in una lobby vuota se la stanza non esiste più.

### Sicurezza
I canali sono **privati**: per collegarsi serve una sessione Supabase (anonima, creata in automatico all'apertura del sito) e le policy RLS su `realtime.messages`. Senza questo, chiunque leggesse la chiave pubblica nel codice del sito potrebbe collegarsi ai canali.

### Altro
- 2054 parole italiane selezionate a mano per categoria ([`words.ts`](buffone-app/src/data/words.ts)).
- Font self-hosted (nessuna richiesta a Google Fonts) e privacy policy che descrive cosa fa davvero il codice.
- Le illustrazioni sono generate con AI, come indicato anche nel sito.

## Struttura

```
buffone-app/
├── public/                 font, regolamento e privacy policy (pagine statiche)
└── src/
    ├── components/
    │   ├── lobby/          stanza pre-partita: squadre, ruoli, regole
    │   └── game/           tabellone, indizi, turni, fine partita
    ├── hooks/              canale Realtime e autenticazione anonima
    ├── data/               parole e opzioni di lobby
    └── lib/                funzioni di supporto
```

## Avvio in locale

Serve un progetto Supabase con Realtime abilitato.

```bash
cd buffone-app
cp .env.example .env.local   # URL e anon key del progetto Supabase
npm install
npm run dev
```
