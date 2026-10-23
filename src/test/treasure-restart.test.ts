import { describe, expect, it } from "vitest";
import { applyAdventure, initialAdventure, validRiddles, type AdventureState } from "@/lib/treasure";

const complete = (): AdventureState => ({ ...initialAdventure(), zone: "lair", x: 10, y: 6, scrolls: ["meadow", "wood", "ravine", "lair"], gates: ["meadow", "wood", "ravine", "lair"], duel: 3, rescued: true, gear: ["lantern", "boots", "goggles"], items: ["bell"], quests: ["rocco"], met: ["rocco"], dug: ["m-coins"], lily: 2, pet: { x: 8, y: 20 }, fog: { lair: [0, 1, 2] } });
describe("Explicit quest restart", () => {
  it("fully resets position, inventory and quest progress", () => {
    const next = applyAdventure(complete(), { action: "restart" });
    expect({ ...next, riddles: [] }).toEqual({ ...initialAdventure(), riddles: [] });
    expect([next.zone, next.x, next.y]).toEqual(["meadow", 10, 12]);
    expect(validRiddles(next.riddles)).not.toBeNull();
  });
  it("does not restart an unfinished quest", () => { const s = { ...complete(), rescued: false, duel: 2 }; expect(applyAdventure(s, { action: "restart" })).toBe(s); });
  it("completed games cannot keep moving, answering or restarting automatically", () => {
    const s = complete();
    for (const a of [{ action: "move", x: 11, y: 6 }, { action: "duel", x: 0 }, { action: "status" }, { action: "portal", id: "ravine" }] as const) expect(applyAdventure(s, a)).toEqual(s);
  });
});