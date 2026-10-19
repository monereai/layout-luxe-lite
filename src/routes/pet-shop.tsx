import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PetShop } from "@/components/PetShop";
import { MonereFigure } from "@/components/MonereFigure";
import { MonereCharacterView } from "@/components/MonereCharacterView";
import petShopMark from "@/assets/shop/pet-shop.png";

export const Route = createFileRoute("/pet-shop")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Pet Shop — MonereAI" },
      { name: "description", content: "Adopt a puppy, kitten, goldfish and more as a companion for Monere the lion using your Shop Points." },
      { property: "og:title", content: "Monere's Pet Shop — MonereAI" },
      { property: "og:description", content: "Spend Shop Points on adorable pet companions for Monere." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PetShopPage,
});

function PetShopPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-4 flex items-center gap-3">
          <img src={petShopMark} alt="" width={816} height={816} className="h-16 w-16" />
          <h1 className="font-display text-2xl font-semibold">Pet Shop</h1>
        </div>
        <div className="mb-5 flex justify-center rounded-lg border border-border bg-card/60 py-3">
          <div className="h-72 w-72 max-w-full">
            <MonereCharacterView>
              <MonereFigure bareBase alt="Monere with your companion pet" className="h-full w-full" />
            </MonereCharacterView>
          </div>
        </div>
        <PetShop />
      </div>
    </AppShell>
  );
}
