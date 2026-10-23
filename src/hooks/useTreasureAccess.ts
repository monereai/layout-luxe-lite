import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { usePlan } from "./usePlan";
import { getTreasureAccess } from "@/lib/treasure.functions";
import { TREASURE_MAINTENANCE } from "@/lib/treasureGate";

export function useTreasureAccess() {
  const { user, ready } = usePlan();
  const check = useServerFn(getTreasureAccess);
  const query = useQuery({
    queryKey: ["treasure-access", user?.id ?? "guest"],
    queryFn: () => check(),
    enabled: TREASURE_MAINTENANCE && ready && !!user,
    staleTime: 60_000,
    retry: false,
  });
  const tester = ready && !!user && query.data?.tester === true && !query.isError;
  return { tester, allowed: !TREASURE_MAINTENANCE || tester, checking: !ready || (TREASURE_MAINTENANCE && !!user && query.isPending) };
}