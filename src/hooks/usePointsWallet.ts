import { useGame } from "@/lib/game";
import { useShop, walletBalance } from "@/lib/shop";
import { useProperties } from "@/lib/properties";
import { usePlan } from "@/hooks/usePlan";
import { isSandboxAdmin, SANDBOX_POINTS } from "@/lib/admin";

/** One spendable balance for the header, games, and shop. The sandbox admin always sees 99,999. */
export function usePointsWallet() {
  const game = useGame();
  const shop = useShop();
  const properties = useProperties();
  const { bonusPoints, user } = usePlan();
  if (isSandboxAdmin(user)) return SANDBOX_POINTS;
  return walletBalance(game.points + bonusPoints, shop, properties.spent + (game.hintsSpent ?? 0));
}
