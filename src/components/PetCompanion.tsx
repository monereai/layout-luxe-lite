import { PETS, usePets } from "@/lib/pets";

/** Equipped companion pet, drawn beside Monere (never on him) so clothing stays untouched. */
export function PetCompanion() {
  const { active } = usePets();
  const pet = PETS.find((p) => p.id === active);
  if (!pet) return null;
  return (
    <div className="pointer-events-none absolute bottom-2 right-1 z-10 w-[28%] max-w-36" aria-hidden="true">
      <img src={pet.src} alt="" width={816} height={816} loading="lazy" className="pet-bob h-auto w-full object-contain drop-shadow-lg" />
    </div>
  );
}
