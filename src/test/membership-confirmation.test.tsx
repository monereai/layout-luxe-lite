import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MonereStore } from "@/components/MonereStore";

const mocks = vi.hoisted(() => ({ confirm: vi.fn(), refresh: vi.fn() }));
vi.mock("@/hooks/usePlan", () => ({ usePlan: () => ({ user: { id: "isolated-test-user" }, tier: "free", ready: true, refresh: mocks.refresh }) }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: () => mocks.confirm }));
vi.mock("@/lib/payments.functions", () => ({ confirmCheckout: vi.fn() }));
vi.mock("@/lib/stripe", () => ({ getStripeEnvironment: () => "sandbox" }));
vi.mock("@/components/StripeCheckoutDialog", () => ({ StripeCheckoutDialog: ({ item }: { item: { priceId: string } | null }) => item ? <output aria-label="Selected checkout">{item.priceId}</output> : null }));

afterEach(() => { cleanup(); vi.clearAllMocks(); window.history.replaceState(null, "", "/"); });

function openStore() {
  render(<QueryClientProvider client={new QueryClient()}><MonereStore /></QueryClientProvider>);
}

describe("Paid membership confirmation", () => {
  it("cancelling Plus never opens checkout or grants benefits", () => {
    openStore();
    fireEvent.click(screen.getByRole("button", { name: "Subscribe – £2.99/mo" }));
    expect(screen.queryByLabelText("Selected checkout")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Cancel$/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Selected checkout")).not.toBeInTheDocument();
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it.each([
    ["Subscribe – £2.99/mo", "plus_monthly"],
    ["Join – £4.99/mo", "club_monthly"],
  ])("%s waits for confirmation then opens %s without granting benefits", (button, priceId) => {
    openStore();
    fireEvent.click(screen.getByRole("button", { name: button }));
    expect(screen.queryByLabelText("Selected checkout")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm and pay" }));
    expect(screen.getByLabelText("Selected checkout")).toHaveTextContent(priceId);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("keeps yearly billing selected through confirmation", () => {
    openStore();
    fireEvent.click(screen.getByRole("button", { name: "yearly" }));
    fireEvent.click(screen.getByRole("button", { name: "Join – £44.99/yr" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm and pay" }));
    expect(screen.getByLabelText("Selected checkout")).toHaveTextContent("club_yearly");
  });

  it("refreshes account balances and care after verified payment without reloading", async () => {
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    mocks.confirm.mockResolvedValueOnce({ ok: true, kind: "membership", tier: "plus" });
    mocks.refresh.mockResolvedValueOnce(true);
    window.history.replaceState(null, "", "/shop?session_id=cs_test_isolated");
    render(<QueryClientProvider client={client}><MonereStore /></QueryClientProvider>);
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledTimes(1));
    expect(mocks.confirm).toHaveBeenCalledWith({ data: { sessionId: "cs_test_isolated", environment: "sandbox" } });
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ["monere-care", "isolated-test-user"] }));
    expect(window.location.pathname).toBe("/shop");
    expect(window.location.search).toBe("");
  });
});