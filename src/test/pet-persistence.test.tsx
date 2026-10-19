import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  account: { user: { id: "qa-a" } as { id: string } | null, ready: true },
  active: "puppy" as string | null,
  rpc: vi.fn(),
}));
vi.mock("@/hooks/usePlan", () => ({ usePlan: () => mocks.account }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  auth: { getUser: async () => ({ data: { user: mocks.account.user } }) },
  from: (table: string) => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({
    data: table === "profiles" ? { equipped_pet_id: mocks.active } : { owned_pets: ["puppy", "kitten"] }, error: null,
  }) }) }) }),
  rpc: mocks.rpc,
} }));
import { petAction, usePets } from "@/lib/pets";

beforeEach(() => {
  mocks.account.user = { id: "qa-a" };
  mocks.active = "puppy";
  mocks.rpc.mockReset();
});

it("restores the saved equipped companion on mount", async () => {
  const hook = renderHook(() => usePets());
  await waitFor(() => expect(hook.result.current.active).toBe("puppy"));
  expect(hook.result.current.owned).toEqual(["puppy", "kitten"]);
});

it("swaps the equipped pet using the authenticated inventory action", async () => {
  const hook = renderHook(() => usePets());
  await waitFor(() => expect(hook.result.current.active).toBe("puppy"));
  mocks.rpc.mockResolvedValue({ data: { owned: ["puppy", "kitten"], active: "kitten" }, error: null });
  await act(() => petAction("equip", "kitten"));
  expect(mocks.rpc).toHaveBeenCalledWith("pet_action", { p_action: "equip", p_id: "kitten" });
  expect(hook.result.current).toEqual({ owned: ["puppy", "kitten"], active: "kitten" });
});

it("clears the active companion on successful unequip", async () => {
  const hook = renderHook(() => usePets());
  await waitFor(() => expect(hook.result.current.active).toBe("puppy"));
  mocks.rpc.mockResolvedValue({ data: { owned: ["puppy", "kitten"], active: null }, error: null });
  await act(() => petAction("unequip", "puppy"));
  expect(hook.result.current.active).toBeNull();
  expect(hook.result.current.owned).toEqual(["puppy", "kitten"]);
});

it("does not retain a companion after signing out", async () => {
  const hook = renderHook(() => usePets());
  await waitFor(() => expect(hook.result.current.active).toBe("puppy"));
  mocks.account.user = null;
  hook.rerender();
  expect(hook.result.current).toEqual({ owned: [], active: null });
});