import { it, expect } from "vitest";
import { JIGSAW_BONUS, jigsawSolved, lockedSlots, shufflePieces } from "@/lib/game";
import { grantJigsawReward } from "@/lib/shop";

const rewardGame = { points: 0, detective: false, best: {}, finds: {}, jigsaws: [3, 4, 5, 6] };
const rewardShop = { spent: 120, owned: ["amber-snapback"], equipped: { hat: "amber-snapback" } };

it("requires all four completed jigsaw levels before granting a shop item", () => {
  for (const missing of [3, 4, 5, 6]) {
    expect(grantJigsawReward(rewardShop, { ...rewardGame, jigsaws: rewardGame.jigsaws.filter((size) => size !== missing) })).toBeNull();
  }
  const gift = grantJigsawReward(rewardShop, rewardGame, () => 0);
  expect(gift?.item?.id).toBe("cozy-beanie");
  expect(gift?.state.owned).toEqual(["amber-snapback", "cozy-beanie"]);
});

it("awards the item free without replacing equipped clothing", () => {
  const gift = grantJigsawReward(rewardShop, rewardGame, () => 0);
  expect(gift?.state.spent).toBe(120);
  expect(gift?.state.equipped).toEqual({ hat: "amber-snapback" });
});

it("does not grant another item after replay or saved-state reload", () => {
  const gift = grantJigsawReward(rewardShop, rewardGame, () => 0);
  expect(gift).not.toBeNull();
  if (!gift) throw new Error("Expected a completion reward");
  expect(grantJigsawReward(JSON.parse(JSON.stringify(gift.state)), rewardGame)).toBeNull();
});

it("handles a fully owned inventory without duplicate items", async () => {
  const { SHOP_ITEMS } = await import("@/lib/shop");
  const owned = SHOP_ITEMS.map((item) => item.id);
  const gift = grantJigsawReward({ ...rewardShop, owned }, rewardGame);
  expect(gift?.item).toBeNull();
  expect(gift?.state.owned).toEqual(owned);
  expect(gift?.state.jigsawReward).toBe("all-owned");
});

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
