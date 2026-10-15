import { beforeEach, describe, expect, it } from "vitest";
import { MAP_UNLOCK_FINDS, mapUnlocked, recordMini } from "@/lib/game";

describe("map unlocks", () => {
  beforeEach(() => { localStorage.clear(); });

  it("first map is always unlocked", () => {
    expect(mapUnlocked({})).toBe(true);
  });

  it(`next map needs ${MAP_UNLOCK_FINDS} finds in the previous map`, () => {
    expect(mapUnlocked({}, "jungle")).toBe(false);
    expect(mapUnlocked({ jungle: MAP_UNLOCK_FINDS - 1 }, "jungle")).toBe(false);
    expect(mapUnlocked({ jungle: MAP_UNLOCK_FINDS }, "jungle")).toBe(true);
  });

  it("recordMini counts finds per scene", () => {
    for (let i = 0; i < MAP_UNLOCK_FINDS; i++) recordMini("school");
    expect(mapUnlocked({ school: MAP_UNLOCK_FINDS }, "school")).toBe(true);
    expect(mapUnlocked({ school: MAP_UNLOCK_FINDS }, "arcade")).toBe(false);
  });
});
