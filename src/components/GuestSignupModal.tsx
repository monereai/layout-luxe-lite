import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { MonereMentor } from "@/components/MonereMentor";
import { lovable } from "@/integrations/lovable/index";

export const GUEST_REWARD_TEXT = "Great choice! You've earned +50 Points and +25 Energy. Create a free account or sign in to save your progress and start your daily streak!";

export async function googleSignIn() {
  const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
  if (result.error) toast.error("Google sign-in didn't work. Please try again.");
}

/** Conversion modal for guests after a Daily Dilemma or the guest chat limit. Rewards are celebratory only. */
export function GuestSignupModal({ open, onOpenChange, next = "/" }: { open: boolean; onOpenChange: (o: boolean) => void; next?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto rounded-lg p-5 text-center">
        <DialogTitle className="flex items-center justify-center gap-2 font-display text-2xl"><Sparkles className="text-primary" /> Great choice!</DialogTitle>
        <MonereMentor mode="results" companion />
        <DialogDescription className="font-body text-base leading-relaxed text-foreground">{GUEST_REWARD_TEXT}</DialogDescription>
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
