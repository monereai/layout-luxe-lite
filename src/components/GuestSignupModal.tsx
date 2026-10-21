import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { MonereMentor } from "@/components/MonereMentor";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { clearGuest, guestCompleted, guestPoints, markGuestComplete, subscribeGuest } from "@/lib/guest-preview";

export const guestRewardText = (points: number) =>
  `You have ${points} unsaved points! Create a free account or sign in with Google to save your points and unlock the Pet Shop.`;

/** One shared guest modal (mounted in AppShell for guests). */
let guestOpen = false;
const listeners = new Set<() => void>();
const setGuestOpen = (v: boolean) => { guestOpen = v; listeners.forEach((l) => l()); };
export const openGuestReward = () => setGuestOpen(true);

/** Record a finished guest activity (locks the preview) and show the save-your-points modal. */
export function completeGuestActivity(points: number) {
  markGuestComplete(points);
  openGuestReward();
}

const useGuestState = () => useSyncExternalStore(subscribeGuest, () => `${guestCompleted()}:${guestPoints()}`, () => "false:0");

export function GuestRewardHost() {
  const open = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => guestOpen, () => false);
  useGuestState();
  // After a refresh, a finished preview stays locked and the sign-in modal reappears.
  useEffect(() => { if (guestCompleted()) openGuestReward(); }, []);
  const next = typeof window === "undefined" ? "/" : window.location.pathname;
  return <GuestSignupModal open={open} onOpenChange={setGuestOpen} next={next} points={guestPoints()} />;
}

/** For signed-in users: move guest points onto the account once, then clear the local keys. */
export function GuestPointsTransfer({ userId, onCredited }: { userId: string; onCredited?: () => void }) {
  const done = useRef<string | null>(null);
  useEffect(() => {
    if (done.current === userId) return;
    done.current = userId;
    const points = guestPoints();
    if (!guestCompleted() && points === 0) return;
    void supabase.rpc("claim_guest_points", { p_points: points }).then(({ data, error }) => {
      if (error) return; // keep the keys so it can retry next visit
      clearGuest();
      if (typeof data === "number" && data > 0) { toast.success(`+${data} guest points saved to your account! 🦁`); onCredited?.(); }
    });
  }, [userId, onCredited]);
  return null;
}

export async function googleSignIn() {
  const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
  if (result.error) toast.error("Google sign-in didn't work. Please try again.");
}

export function GuestSignupModal({ open, onOpenChange, next = "/", points = 0 }: { open: boolean; onOpenChange: (o: boolean) => void; next?: string; points?: number }) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto rounded-lg p-5 text-center">
        <DialogTitle className="flex items-center justify-center gap-2 font-display text-2xl"><Sparkles className="text-primary" /> {points} unsaved points!</DialogTitle>
        <MonereMentor mode="results" companion />
        <DialogDescription className="font-body text-base leading-relaxed text-foreground">{guestRewardText(points)}</DialogDescription>
        <div className="mt-2 grid gap-2">
          <Button asChild className="btn-gold h-auto whitespace-normal py-3.5 text-base"><Link to="/auth" search={{ next }}>Save My Progress (Free Sign-Up)</Link></Button>
          <Button variant="outline" disabled={busy} onClick={async () => { setBusy(true); await googleSignIn(); setBusy(false); }} className="h-auto whitespace-normal py-3">
            {busy ? "Opening Google…" : "Continue with Google"}
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground">Maybe later</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
