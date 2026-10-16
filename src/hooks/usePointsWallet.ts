import { useGame } from "@/lib/game";
import { useShop, walletBalance } from "@/lib/shop";
import { useProperties } from "@/lib/properties";
import { usePlan } from "@/hooks/usePlan";

/** One spendable balance for the header, games, and shop. */
export function usePointsWallet() {
  const game = useGame();
  const shop = useShop();
  const properties = useProperties();
  const { bonusPoints } = usePlan();
  return walletBalance(game.points + bonusPoints, shop, properties.spent + (game.hintsSpent ?? 0));
}