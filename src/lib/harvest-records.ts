export function saveHarvestRecord(account: string, collected: number, storage: Pick<Storage, "getItem" | "setItem"> = localStorage): number {
  const key = `monere-harvest-best-${account}`;
  const previous = Number(storage.getItem(key));
  const best = Math.max(Number.isFinite(previous) ? previous : 0, Math.max(0, Math.floor(collected)));
  storage.setItem(key, String(best));
  return best;
}