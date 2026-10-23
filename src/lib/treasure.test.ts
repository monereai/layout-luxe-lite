
import { randomRiddles as rr } from "./treasure";
test("a replay never repeats the last playthrough's riddles", () => {
  for (let n = 0; n < 50; n++) { const a = rr(); const b = rr(Math.random, a); expect(b.some(r => a.some(o => o.i === r.i))).toBe(false); }
});
