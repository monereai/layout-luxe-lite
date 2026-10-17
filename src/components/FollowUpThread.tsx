import { useT } from "@/lib/i18n";
import { useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { MonereAvatar } from "@/components/MonereFigure";
import { MessageResponse } from "@/components/ai-elements/message";

export type ChatMsg = { role: "user" | "assistant"; content: string };

const CHIPS = ["Can you explain step 2 more?", "What if they say no?"];

export function FollowUpThread({
  messages,
  pending,
  onSend,
}: {
  messages: ChatMsg[];
  pending: boolean;
  onSend: (text: string) => void;
}) {
  const t = useT();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length || pending) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending]);

  function send(t: string) {
    const v = t.trim();
    if (!v || pending) return;
    onSend(v);
    setText("");
  }

  const Avatar = () => (
    <MonereAvatar />
  );

  return (
    <section aria-label="Chat with Monere" className="mt-6">
      {messages.length > 0 && (
        <div className="mb-4 flex flex-col gap-3">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="ml-10 self-end rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground">
                {m.content}
              </div>
            ) : (
              <div key={i} className="mr-6 flex items-end gap-2">
                <Avatar />
                <MessageResponse mode="static" className="min-w-0 text-sm leading-relaxed">{m.content}</MessageResponse>
              </div>
            ),
          )}
          {pending && (
            <div className="flex items-end gap-2" aria-live="polite">
              <Avatar />
              <div className="surface-card flex gap-1 rounded-2xl rounded-bl-md px-4 py-3.5" aria-label="Monere is typing">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${d * 150}ms` }} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <div ref={endRef} />
      {messages.length === 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <button key={c} type="button" disabled={pending} onClick={() => send(c)} className="rounded-full border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50">
              {c}
            </button>
          ))}
        </div>
      )}
      <form
        onSubmit={(e) => { e.preventDefault(); send(text); }}
        className="surface-card flex items-center gap-2 rounded-full py-1.5 pl-4 pr-1.5 focus-within:border-primary"
      >
        <input
          aria-label="Ask Monere a follow-up question"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1500}
          placeholder={t("followPh")}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button type="submit" disabled={pending || !text.trim()} aria-label="Send" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50">
          <SendHorizontal className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}
