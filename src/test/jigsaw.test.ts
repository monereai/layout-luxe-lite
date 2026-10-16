import { it, expect } from "vitest";
import { JIGSAW_BONUS, jigsawSolved, shufflePieces } from "@/lib/game";

it("awards 50 points per puzzle", () => expect(JIGSAW_BONUS).toBe(50));
it("shuffle never starts solved and keeps all pieces", () => {
  for (const n of [9, 16, 25]) {
    const a = shufflePieces(n);
    expect(jigsawSolved(a)).toBe(false);
    expect([...a].sort((x, y) => x - y)).toEqual(Array.from({ length: n }, (_, i) => i));
  }
});
