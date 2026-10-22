import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useT } from "@/lib/i18n";

export function TreasureConstructionGate() {
  const t = useT();
  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-2xl border border-primary/25 bg-card text-center [&>button]:hidden">
        <div className="flex flex-col items-center gap-4 py-2">
          <img src="/monere/looks/default/0.webp" alt="" width={256} height={256} loading="eager" className="h-28 w-28 rounded-2xl border border-primary/20 bg-primary/5 object-contain p-1 pop-shadow" />
          <DialogTitle className="font-display text-2xl font-semibold text-foreground">{t("constructionTitle")}</DialogTitle>
          <DialogDescription className="max-w-xs text-base leading-relaxed text-muted-foreground">{t("constructionBody")}</DialogDescription>
          <Button asChild size="lg" className="mt-2 font-heading">
            <Link to="/" title={t("constructionBack")} aria-label={t("constructionBack")}>{t("constructionBack")}</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
