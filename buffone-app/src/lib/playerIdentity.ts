const ID_KEY = "buffone-player-id";

// sessionStorage (non localStorage): ogni scheda del browser è un giocatore
// distinto, utile sia per giocatori reali su dispositivi diversi sia per
// testare più "giocatori" in schede diverse sullo stesso browser.
export function getPlayerId(): string {
  let id = sessionStorage.getItem(ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(ID_KEY, id);
  }
  return id;
}
