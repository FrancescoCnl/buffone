import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

export type ConnectionStatus = "connecting" | "connected" | "error";

export interface PresenceInfo {
  name: string;
  isHost?: boolean;
}

type Handler = (data: unknown) => void;

// Evento riservato: un giocatore ha lasciato la stanza (tab chiusa,
// disconnessione). playerId del giocatore uscito come `data`.
export const PRESENCE_LEAVE = "__presence_leave__";

export interface RoomChannel {
  status: ConnectionStatus;
  presence: Record<string, PresenceInfo>;
  send: (kind: string, data: unknown) => void;
  on: (kind: string, handler: Handler) => () => void;
}

/**
 * Un solo canale Supabase Realtime per stanza, condiviso da lobby e tavolo di
 * gioco (creato una volta in App.tsx e passato in giù). I messaggi sono tutti
 * incapsulati in un unico evento broadcast "msg" con un campo `kind` interno,
 * smistato a listener registrati via `on()` — evita il problema di dover
 * registrare gli `.on()` di Supabase prima della singola `.subscribe()`.
 */
export function useRoomChannel(
  roomCode: string | null,
  playerId: string,
  playerName: string,
  isHost: boolean
): RoomChannel {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const listenersRef = useRef<Map<string, Set<Handler>>>(new Map());
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [presence, setPresence] = useState<Record<string, PresenceInfo>>({});

  useEffect(() => {
    if (!roomCode) return;
    setStatus("connecting");

    // `private: true` attiva la Realtime Authorization di Supabase: solo
    // client con un JWT valido (qui: sessione anonima, vedi
    // useAnonymousAuth) possono collegarsi, secondo le policy RLS su
    // `realtime.messages` configurate lato dashboard.
    const channel = supabase.channel(`room:${roomCode}`, {
      config: { presence: { key: playerId }, private: true },
    });

    channel.on("broadcast", { event: "msg" }, ({ payload }) => {
      const { kind, data } = payload as { kind: string; data: unknown };
      listenersRef.current.get(kind)?.forEach((fn) => fn(data));
    });

    channel.on("presence", { event: "sync" }, () => {
      const raw = channel.presenceState<PresenceInfo>();
      const flat: Record<string, PresenceInfo> = {};
      for (const key in raw) {
        const entry = raw[key][0];
        if (entry) flat[key] = { name: entry.name, isHost: entry.isHost };
      }
      setPresence(flat);
    });

    // Un giocatore disconnesso (tab chiusa, rete caduta) va rimosso dalla
    // squadra in cui si trovava — altrimenti resta "fantasma" per sempre
    // nello stato condiviso. Solo l'host applica la conseguenza (vedi
    // useLobbyState), qui ci limitiamo a inoltrare l'evento.
    channel.on("presence", { event: "leave" }, ({ key }) => {
      listenersRef.current.get(PRESENCE_LEAVE)?.forEach((fn) => fn(key));
    });

    channel.subscribe(async (subscribeStatus) => {
      if (subscribeStatus === "SUBSCRIBED") {
        setStatus("connected");
        await channel.track({ name: playerName, isHost });
      } else if (subscribeStatus === "CHANNEL_ERROR" || subscribeStatus === "TIMED_OUT") {
        setStatus("error");
      }
    });

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomCode, playerId, playerName, isHost]);

  // `send`/`on` operano solo su ref (mai su state), quindi possono restare
  // identici tra un render e l'altro: senza `useCallback`, `useRoomChannel`
  // restituirebbe un nuovo oggetto ad ogni render, e i consumer (useLobbyState,
  // useGameState) con `channel` nelle dipendenze dei loro `useEffect`
  // smonterebbero e rimonterebbero i listener broadcast ad ogni render di
  // `App` (anche solo per un evento presence innocuo) — con una finestra in
  // cui un messaggio in arrivo va perso, e l'host che ri-manda lo snapshot
  // anche quando `shared` non è affatto cambiato. Bug reale osservato
  // in playtest il 2026-07-16: regole non sincronizzate tra schede, stanza
  // "non trovata" al rientro dopo un refresh.
  const send = useCallback((kind: string, data: unknown) => {
    channelRef.current?.send({ type: "broadcast", event: "msg", payload: { kind, data } });
  }, []);

  const on = useCallback((kind: string, handler: Handler): (() => void) => {
    if (!listenersRef.current.has(kind)) listenersRef.current.set(kind, new Set());
    listenersRef.current.get(kind)!.add(handler);
    return () => listenersRef.current.get(kind)?.delete(handler);
  }, []);

  return useMemo(
    () => ({ status, presence, send, on }),
    [status, presence, send, on]
  );
}
