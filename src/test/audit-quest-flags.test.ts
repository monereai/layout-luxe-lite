import { expect, it } from "vitest";
import { initialAdventure, applyAdventure, interactionHere, parseAdventure, sideQuests, SCROLLS } from "@/lib/treasure";

it.each(["meadow", "wood"] as const)("%s raw scroll cannot be picked up", zone => {
  const s = { ...initialAdventure(), zone, ...SCROLLS[zone] };
  expect(applyAdventure(s, { action: "collect" }).scrolls).toEqual([]);
  expect(interactionHere(s)?.kind).not.toBe("scroll");
});
it("Connie completion requires a true game win, not Wood Scroll ownership", () => {
  const s = { ...initialAdventure(), scrolls: ["wood" as const] };
  expect(sideQuests(s).find(q => q.id === "connie-arcade")?.done).toBe(false);
  expect(sideQuests({ ...s, connieMiniGameWon: true }).find(q => q.id === "connie-arcade")?.done).toBe(true);
  expect(parseAdventure(JSON.parse(JSON.stringify({ ...s, connieMiniGameWon: true }))).connieMiniGameWon).toBe(true);
  expect(parseAdventure({ ...s, connieMiniGameWon: "true" }).connieMiniGameWon).toBe(false);
});