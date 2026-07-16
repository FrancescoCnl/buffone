import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Autenticazione anonima Supabase, invisibile al giocatore (nessuna
 * schermata, nessuna credenziale) — serve solo a ottenere un JWT valido per
 * i canali Realtime "privati", protetti da policy RLS lato Supabase.
 * Senza questo, chiunque trovi la chiave pubblica nel codice del sito può
 * collegarsi ai canali senza alcun controllo.
 */
export function useAnonymousAuth(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function ensureSession() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) console.error("Anonymous sign-in fallito:", error.message);
      }
      if (!cancelled) setReady(true);
    }
    ensureSession();
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}
