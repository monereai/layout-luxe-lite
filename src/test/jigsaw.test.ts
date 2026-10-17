import { it, expect } from "vitest";
import { JIGSAW_BONUS, jigsawSolved, lockedSlots, shufflePieces } from "@/lib/game";

it("awards only 5 points per puzzle", () => expect(JIGSAW_BONUS).toBe(5));
it("shuffle never starts solved and keeps all pieces", () => {
  for (const n of [9, 16, 25]) {
    const a = shufflePieces(n);
    expect(jigsawSolved(a)).toBe(false);
    expect([...a].sort((x, y) => x - y)).toEqual(Array.from({ length: n }, (_, i) => i));
  }
});

it("locks exactly the pieces that sit in their home slot", () => {
  expect(lockedSlots([0, 2, 1, 3])).toEqual(new Set([0, 3]));
  expect(lockedSlots([2, 1, 0])).toEqual(new Set([1]));
  expect(lockedSlots([1, 0])).toEqual(new Set());
  expect(lockedSlots([0, 1, 2])).toEqual(new Set([0, 1, 2]));
});

it("unlocks levels in order of play", async () => {
  const { jigsawUnlocked, recordJigsaw } = await import("@/lib/game");
  const fresh = { points: 0, detective: false, best: {}, finds: {} };
  expect(jigsawUnlocked(3, fresh)).toBe(true);
  expect(jigsawUnlocked(4, fresh)).toBe(false);
  expect(jigsawUnlocked(5, fresh)).toBe(false);
  expect(jigsawUnlocked(4, { ...fresh, jigsaws: [3] })).toBe(true);
  expect(jigsawUnlocked(5, { ...fresh, jigsaws: [3] })).toBe(false);
  expect(jigsawUnlocked(5, { ...fresh, jigsaws: [3, 4] })).toBe(true);
  localStorage.clear();
  recordJigsaw(3);
  expect(jigsawUnlocked(4)).toBe(true);
  expect(jigsawUnlocked(5)).toBe(false);
});

it("gives each jigsaw level its own illustration", async () => {
  const { JIGSAW_IMAGES } = await import("@/components/JigsawGame");
  expect(Object.keys(JIGSAW_IMAGES).sort()).toEqual(["3", "4", "5", "6"]);
  const values = Object.values(JIGSAW_IMAGES);
  expect(new Set(values).size).toBe(4);
  expect(values.every((v) => v.startsWith("/find/"))).toBe(true);
});
