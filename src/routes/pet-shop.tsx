import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PetShop } from "@/components/PetShop";
import { MonereFigure } from "@/components/MonereFigure";
import { MonereCharacterView } from "@/components/MonereCharacterView";
import { PawPrint } from "lucide-react";
import petShopInterior from "@/assets/shop/pet-shop-interior.jpg";

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
          <PawPrint aria-hidden="true" className="h-8 w-8 text-primary" />
          <h1 className="font-display text-2xl font-semibold">Pet Shop</h1>
        </div>
        <div className="relative mb-5 flex justify-center overflow-hidden rounded-lg border border-border bg-card/60 py-3">
          <img src={petShopInterior} alt="" width={1536} height={1024} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover opacity-60" />
          <div className="relative z-10 h-80 w-80 max-w-full">
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
