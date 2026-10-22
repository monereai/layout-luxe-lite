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

import { applyAdventure as A4, canStep as C4, initialAdventure as I4, parseAdventure as P4, isRevealed as R4, type AdventureState as S4 } from "@/lib/treasure";
import { describe as d4, it as i4, expect as e4 } from "vitest";
const at4 = (p: Partial<S4>): S4 => ({ ...I4(), ...p });
d4("expanded griffin world", () => {
  i4("Barnaby gives the Lantern only after all 3 feathers", () => {
    let s = at4({ x: 14, y: 9, items: ["feather-1", "feather-2"] });
    e4(A4(s, { action: "deliver", id: "barnaby" }).gear).toEqual([]);
    s = { ...s, items: [...s.items, "feather-3"] };
    e4(A4(s, { action: "deliver", id: "barnaby" }).gear).toEqual(["lantern"]);
  });
  i4("dark cave needs the Lantern", () => {
    e4(C4(at4({ zone: "wood" }), 19, 4)).toBe(false);
    e4(C4(at4({ zone: "wood", gear: ["lantern"] }), 19, 4)).toBe(true);
  });
  i4("cliffs need Climbing Boots", () => {
    e4(C4(at4({ zone: "ravine" }), 17, 4)).toBe(false);
    e4(C4(at4({ zone: "ravine", gear: ["boots"] }), 17, 4)).toBe(true);
  });
  i4("invisible lair path needs the Goggles of Truth, which also show traps", () => {
    e4(C4(at4({ zone: "lair" }), 8, 15)).toBe(false);
    e4(C4(at4({ zone: "lair", gear: ["goggles"] }), 8, 15)).toBe(true);
    e4(C4(at4({ zone: "lair", gear: ["goggles"] }), 12, 15)).toBe(false);
    const fell = A4(at4({ zone: "lair", x: 12, y: 16 }), { action: "move", x: 12, y: 15 });
    e4([fell.x, fell.y]).toEqual([12, 19]);
  });
  i4("lily pads line up only after the bell is rung once", () => {
    const s = at4({ zone: "wood", x: 3, y: 15 });
    e4(C4(s, 10, 17) && C4(s, 10, 18)).toBe(false);
    const rung = A4(s, { action: "bell" });
    e4(rung.lily).toBe(1); e4(C4(rung, 10, 17) && C4(rung, 10, 18)).toBe(true);
  });
  i4("vault needs pet on its plate and Monere on his", () => {
    const s = at4({ zone: "ravine", x: 5, y: 20 });
    e4(A4(s, { action: "switch" }).quests).toEqual([]);
    const waiting = A4({ ...s, x: 8 }, { action: "stay" });
    e4(A4({ ...waiting, x: 5 }, { action: "switch" }).quests).toEqual(["vault"]);
  });
  i4("pet digs each spot once and fog lifts around Monere", () => {
    const s = at4({ x: 5, y: 16 });
    const dug = A4(s, { action: "dig", id: "m-coins" });
    e4(dug.dug).toEqual(["m-coins"]); e4(A4(dug, { action: "dig", id: "m-coins" }).dug).toEqual(["m-coins"]);
    e4(R4(I4(), "meadow", 10, 12)).toBe(true); e4(R4(I4(), "meadow", 21, 2)).toBe(false);
    e4(P4(JSON.parse(JSON.stringify(dug))).dug).toEqual(["m-coins"]);
  });
});
