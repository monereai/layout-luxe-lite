export const SNAP_TARGET = 3;
export const SNAP_CYCLE_MS = 1750;
export const SNAP_ENERGY = 25;
export const SNAP_POINTS = 50;
export const SNAP_THEMES = [
  { title: "God's Promise", symbols: ['🌈', '🛶'], names: ['Rainbow', "Noah's Ark"], verse: 'I set my rainbow in the cloud.', reference: 'Genesis 9:13 (excerpt, WEB)' },
  { title: 'God Protects', symbols: ['🦁', '🙏'], names: ['Lion', 'Daniel'], verse: 'My God has sent his angel, and has shut the lions’ mouths.', reference: 'Daniel 6:22 (excerpt, WEB)' },
  { title: 'Holy Spirit', symbols: ['🕊️', '🕊️'], names: ['Dove', 'Peace'], verse: 'But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faith.', reference: 'Galatians 5:22 · WEB' },
  { title: 'Jesus Stills the Storm', symbols: ['⛵', '🌊'], names: ['Boat', 'Waves'], verse: 'He said to the sea, Peace! Be still!', reference: 'Mark 4:39 (adapted)' },
  { title: 'God Provides', symbols: ['🐟', '🍞'], names: ['Fish', 'Loaves'], verse: 'They all ate, and were filled.', reference: 'Matthew 14:20 (excerpt, WEB)' },
  { title: 'Armor of God', symbols: ['🛡️', '⚔️'], names: ['Shield', 'Armor'], verse: 'Put on the whole armor of God.', reference: 'Ephesians 6:11 (excerpt, WEB)' },
];
export const snapMatches = (left: number, right: number) => Math.floor(left / 2) === Math.floor(right / 2);
export const snapEnergyGain = (energy: number) => Math.max(0, Math.min(SNAP_ENERGY, 100 - energy));
export const snapRewardAvailable = (last: string | null, now: Date) => last !== now.toISOString().slice(0, 10);
export function snapCard(id: number) {
  const theme = SNAP_THEMES[Math.floor(id / 2)] ?? { title: "God's Promise", symbols: ['🌈'], names: ['Rainbow'], verse: 'I set my rainbow in the cloud.', reference: 'Genesis 9:13 (excerpt, WEB)' };
  return { ...theme, symbol: theme.symbols[id % 2], name: theme.names[id % 2] };
}