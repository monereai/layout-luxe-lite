import { describe, expect, it } from "vitest";
import { applyAdventure, initialAdventure, parseAdventure, GATES, DUEL_START, type AdventureState } from "@/lib/treasure";
import { PETS, petButtonState } from "@/lib/pets";

const at = (s: Partial<AdventureState>): AdventureState => ({ ...initialAdventure(), ...s });

describe("Griffin rescue rules", () => {
  it("gate answers match the riddles", () => {
    expect(GATES.meadow.options[GATES.meadow.answer]).toBe("A Clock");
    expect(GATES.wood.options[GATES.wood.answer]).toBe("A Towel");
    expect(GATES.ravine.options[GATES.ravine.answer]).toBe("A Keyboard");
    expect(GATES.lair.options[GATES.lair.answer]).toBe("Your Name");
  });
  it("gate needs the scroll first", () => {
    const s = at({ x: 20, y: 10 });
    expect(applyAdventure(s, { action: "answer", id: "meadow", x: 0 }).gates).toEqual([]);
    expect(applyAdventure({ ...s, scrolls: ["meadow"] }, { action: "answer", id: "meadow", x: 0 }).gates).toEqual(["meadow"]);
    expect(applyAdventure({ ...s, scrolls: ["meadow"] }, { action: "answer", id: "meadow", x: 1 }).gates).toEqual([]);
  });
  it("forward portal stays locked until the riddle is solved", () => {
    const s = at({ x: 20, y: 10, scrolls: ["meadow"] });
    expect(applyAdventure(s, { action: "portal", id: "wood" }).zone).toBe("meadow");
    expect(applyAdventure({ ...s, gates: ["meadow"] }, { action: "portal", id: "wood" }).zone).toBe("wood");
  });
  it("wrong duel tile sends Monere back to the start mark", () => {
    const s = at({ zone: "lair", gates: ["meadow", "wood", "ravine", "lair"], scrolls: ["meadow", "wood", "ravine", "lair"], x: 10, y: 6 });
    expect(applyAdventure(s, { action: "duel", x: 0 })).toMatchObject(DUEL_START);
  });
  it("three correct tiles rescue the Griffin", () => {
    let s = at({ zone: "lair", gates: ["meadow", "wood", "ravine", "lair"], x: 12, y: 6 });
    s = applyAdventure(s, { action: "duel", x: 1 }); expect(s.duel).toBe(1);
    s = applyAdventure({ ...s, x: 14 }, { action: "duel", x: 2 });
    s = applyAdventure({ ...s, x: 10 }, { action: "duel", x: 0 });
    expect(s.rescued).toBe(true);
  });
  it("old saves restart the new adventure", () => { expect(parseAdventure({ zone: "sky", relics: ["wisdom-star"] })).toEqual(initialAdventure()); });
  it("Golden Griffin cannot be bought", () => {
    const g = PETS.find(p => p.id === "golden-griffin")!;
    expect(petButtonState({ owned: [], active: null }, 99999, g)).toBe("reward");
  });
});

import { scrollWarmth as _w, SCROLLS as _S } from "@/lib/treasure";
import { describe as _d, it as _i, expect as _e } from "vitest";
_d("hidden scroll hints", () => {
  _i("is hot beside the scroll and cold far away", () => {
    const base = { version: 3, zone: "meadow", scrolls: [], gates: [], duel: 0, rescued: false } as never as Parameters<typeof _w>[0];
    _e(_w({ ...base, x: _S.meadow.x + 1, y: _S.meadow.y })).toContain("hot");
    _e(_w({ ...base, x: _S.meadow.x + 15, y: _S.meadow.y })).toContain("Cold");
  });
});
