const PATTERNS = [
  /\b(kill|hurt|harm|cut(ting)?)\s+(myself|me)\b/i,
  /\bsuicid/i,
  /\bself[- ]?harm/i,
  /\b(want|wanna|going) to die\b/i,
  /\bend (my|it all|my life)\b/i,
  /\bno reason to live\b/i,
  /\b(abus(e|ed|ing)|molest|rap(e|ed))\b/i,
  /\b(hits?|beats?|beating) me\b/i,
  /\b(touch(es|ed)? me|unsafe at home|afraid to go home)\b/i,
  /\b(gun|weapon|overdose)\b/i,
];

export function detectCrisis(text: string): boolean {
  return PATTERNS.some((p) => p.test(text));
}
