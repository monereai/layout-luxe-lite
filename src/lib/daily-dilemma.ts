export const DILEMMA_ENERGY = 25;
export const DILEMMA_POINTS = 50;
export const DAILY_DILEMMAS = [
  {
    title: 'The group chat', theme: 'Courage online',
    story: 'A funny-looking photo of a classmate lands in Monere’s group chat. Everyone is adding cruel captions, and his friends want him to join in. Monere wants to belong—but he knows the classmate would be hurt.',
    choices: ['Add a caption so his friends keep liking him.', 'Refuse to share it, ask the group to stop, and check on the classmate.', 'Stay quiet and forward it to another group.'],
    wise: 1, reflection: 'Choosing kindness over likes is lionhearted courage, reflecting Jesus’ call to treat others as you want to be treated.', reference: 'Luke 6:31 · Christian principle',
    feedback: 'Belonging matters, but sharing someone’s embarrassment can hurt them—what would protect their dignity?',
  },
  {
    title: 'The broken project', theme: 'Honesty',
    story: 'While tidying up, Monere accidentally knocks over a friend’s school project. Nobody sees it happen. His friend has worked on it for days, and Monere worries that telling the truth will cost their friendship.',
    choices: ['Tell his friend what happened, apologise, and offer to help repair it.', 'Say someone else must have broken it.', 'Hide the broken pieces and hope nobody notices.'],
    wise: 0, reflection: 'Owning your mistake and making it right builds trust, echoing Proverbs’ reminder that walking in integrity brings security.', reference: 'Proverbs 10:9 · Christian principle',
    feedback: 'Mistakes don’t make you a bad friend; hiding them can damage trust—what would help put things right?',
  },
  {
    title: 'A seat at the table', theme: 'Kindness',
    story: 'At lunch, Monere notices a new student sitting alone. His friends roll their eyes and say the student is “too different” to join them. Monere remembers how lonely his own first day felt.',
    choices: ['Ignore the student so lunch stays comfortable.', 'Make a joke about the student to impress his friends.', 'Invite the student to sit with him and make them feel welcome.'],
    wise: 2, reflection: 'Making room for someone left out puts love into action, living out Jesus’ call to love your neighbour.', reference: 'Mark 12:31 · Christian principle',
    feedback: 'Being different isn’t a reason to be excluded—what small act could help this student feel valued?',
  },
  {
    title: 'Before you hit send', theme: 'Managing anger',
    story: 'A teammate blames Monere for losing a match and posts an unfair comment about him. Monere feels furious and starts typing a harsh reply. He wants to defend himself without making the argument worse.',
    choices: ['Post an insult that will embarrass the teammate.', 'Pause, calm down, then explain his feelings respectfully in private.', 'Get everyone to pile on with angry replies.'],
    wise: 1, reflection: 'Pausing before a gentle, honest response shows strength, echoing Proverbs’ wisdom that a gentle answer turns away anger.', reference: 'Proverbs 15:1 · Christian principle',
    feedback: 'Your anger is understandable, but attacking back can escalate things—what response protects both truth and peace?',
  },
] as const;
export const dilemmaEnergyGain = (energy: number) => Math.max(0, Math.min(DILEMMA_ENERGY, 100 - energy));
export const dilemmaRewardAvailable = (last: string | null, now: Date) => last !== now.toISOString().slice(0, 10);
export function dilemmaIndex(day: string) {
  const days = Math.floor((Date.parse(`${day}T00:00:00Z`) - Date.parse('2026-01-01T00:00:00Z')) / 86400000);
  return ((days % DAILY_DILEMMAS.length) + DAILY_DILEMMAS.length) % DAILY_DILEMMAS.length;
}
export function dilemmaCountdown(nextAt: number, serverNow: number, elapsed: number) {
  const seconds = Math.max(0, Math.ceil((nextAt - serverNow - elapsed) / 1000));
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(n => String(n).padStart(2, '0')).join(':');
}