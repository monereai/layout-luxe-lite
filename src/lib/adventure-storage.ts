import { parseAdventure, type AdventureState } from "./treasure";
const GUEST_KEY = "monere-griffin-guest-v1";
export function adventureStorageKey(account?: string) { return account ? `monere-treasure-cache-${account}` : GUEST_KEY; }
/** Account caches are mirrors, never imported into authenticated rewards. */
export function saveAdventure(state: AdventureState, account?: string, storage: Pick<Storage, "setItem"> = localStorage) {
  try { storage.setItem(adventureStorageKey(account), JSON.stringify(state)); } catch { /* Play remains available without storage. */ }
}
export function loadGuestAdventure(storage: Pick<Storage, "getItem"> = localStorage) {
  try { const raw: unknown = JSON.parse(storage.getItem(GUEST_KEY) ?? "null"); return { raw, state: parseAdventure(raw) }; }
  catch { return { raw: null, state: parseAdventure(null) }; }
}