import { Lock, Crown } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function SpaceStationPreview() {
  return <section aria-label="Locked Space Station preview" className="relative isolate overflow-hidden rounded-lg border border-border">
    <img src="/properties/space-station.jpg" alt="Space Station observation deck" width={816} height={816} className="aspect-square w-full object-cover" />
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/70 p-4 text-center">
      <Lock className="h-8 w-8 text-primary" />
      <h2 className="font-display text-xl font-semibold">Space Station</h2>
      <p className="text-sm">Exclusive to Monere Club</p>
      <Button asChild className="h-auto max-w-full whitespace-normal py-3"><Link to="/shop" hash="memberships"><Crown />Upgrade to Monere Club (£4.99)</Link></Button>
    </div>
  </section>;
}