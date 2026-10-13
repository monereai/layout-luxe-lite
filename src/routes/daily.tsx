import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/daily")({
  head: () => ({
    meta: [
      { title: "Daily Reflection — MoralSphere" },
      { name: "description", content: "A daily verse and short thought for the real challenges of teen life." },
      { property: "og:title", content: "Daily Reflection — MoralSphere" },
      { property: "og:description", content: "A daily verse and short thought for the real challenges of teen life." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Daily,
});

const DAYS = [
  { theme: "Anxiety", ref: "Philippians 4:6-7 (NLT)", text: "Don't worry about anything; instead, pray about everything. Tell God what you need, and thank him for all he has done. Then you will experience God's peace.", thought: "You don't have to have it all figured out tonight. Name one worry, hand it to God, and take the next small step." },
  { theme: "Peer Pressure", ref: "Romans 12:2 (NLT)", text: "Don't copy the behavior and customs of this world, but let God transform you into a new person by changing the way you think.", thought: "Being different isn't weird — it's brave. Who you're becoming matters more than fitting in today." },
  { theme: "Forgiveness", ref: "Colossians 3:13 (NLT)", text: "Make allowance for each other's faults, and forgive anyone who offends you. Remember, the Lord forgave you, so you must forgive others.", thought: "Forgiving doesn't mean what they did was okay. It means you're choosing freedom over carrying it." },
  { theme: "Self-Worth", ref: "Psalm 139:14 (NIV)", text: "I praise you because I am fearfully and wonderfully made; your works are wonderful, I know that full well.", thought: "Likes and follows don't define you. You were made on purpose, with purpose." },
  { theme: "Honesty", ref: "Proverbs 12:22 (NLT)", text: "The Lord detests lying lips, but he delights in those who tell the truth.", thought: "Truth can feel costly in the moment, but it builds a life people can trust — including you." },
  { theme: "Loneliness", ref: "Deuteronomy 31:8 (NLT)", text: "Do not be afraid or discouraged, for the Lord will personally go ahead of you. He will be with you; he will neither fail you nor abandon you.", thought: "Even on days when no one texts back, you are not alone. Reach out to one person today." },
  { theme: "Courage", ref: "Joshua 1:9 (NIV)", text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", thought: "Courage isn't the absence of fear. It's doing the right thing while your hands shake." },
];

function Daily() {
  const [i, setI] = useState(0);
  useEffect(() => setI(Math.floor(Date.now() / 86400000) % DAYS.length), []);
  const d = DAYS[i] ?? DAYS[0]!;
  const date = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  return (
    <AppShell>
      <p className="text-sm font-semibold text-primary">{date}</p>
      <h1 className="mt-2 font-display text-4xl">Daily Reflection</h1>
      <div className="surface-card mt-6 p-6">
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-widest text-accent-foreground">{d.theme}</span>
        <blockquote className="mt-5 font-display text-2xl italic leading-snug">"{d.text}"</blockquote>
        <p className="mt-3 font-semibold text-primary">— {d.ref}</p>
      </div>
      <div className="surface-card mt-4 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Today's thought</p>
        <p className="mt-2 leading-relaxed">{d.thought}</p>
      </div>
    </AppShell>
  );
}
