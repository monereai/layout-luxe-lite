import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PayPalButton } from "@/components/PayPalButton";

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, "paypal_subs");
});

describe("PayPal button lifecycle", () => {
  it("ties a new subscription to the signed-in account", async () => {
    const create = vi.fn((_options: Record<string, unknown>) => ({ render: async () => {}, close: async () => {} }));
    Object.assign(window, { paypal_subs: { Buttons: create } });
    render(<PayPalButton mode="subscription" planId="plus-monthly" accountId="account-123" onApprove={async () => {}} />);
    await waitFor(() => expect(create).toHaveBeenCalled());
    const options = create.mock.calls[0]?.[0] as any;
    expect(options.createSubscription({}, { subscription: { create: (value: unknown) => value } })).toEqual({ plan_id: "plus-monthly", custom_id: "account-123" });
  });
  it("isolates a new billing plan from an unfinished previous render", async () => {
    let finishFirst: (() => void) | undefined;
    const hosts: HTMLElement[] = [];
    const create = vi.fn()
      .mockReturnValueOnce({ render: (host: HTMLElement) => { hosts.push(host); return new Promise<void>((resolve) => { finishFirst = resolve; }); }, close: vi.fn().mockResolvedValue(undefined) })
      .mockReturnValueOnce({ render: async (host: HTMLElement) => { hosts.push(host); }, close: vi.fn().mockResolvedValue(undefined) });
    Object.assign(window, { paypal_subs: { Buttons: create } });
    const approved = vi.fn().mockResolvedValue(undefined);
    const view = render(<PayPalButton mode="subscription" planId="monthly" onApprove={approved} />);
    await waitFor(() => expect(hosts).toHaveLength(1));
    view.rerender(<PayPalButton mode="subscription" planId="yearly" onApprove={approved} />);
    await waitFor(() => expect(hosts).toHaveLength(2));
    expect(hosts[0]?.isConnected).toBe(false);
    expect(hosts[1]?.isConnected).toBe(true);
    const secondOptions = create.mock.calls[1]?.[0];
    expect(secondOptions?.createSubscription({}, { subscription: { create: (input: unknown) => input } })).toEqual({ plan_id: "yearly" });
    await act(async () => finishFirst?.());
    expect(hosts[1]?.isConnected).toBe(true);
  });

  it("retries a rejected render rather than leaving checkout empty", async () => {
    const renderButton = vi.fn().mockRejectedValueOnce(new Error("render failed")).mockResolvedValueOnce(undefined);
    const create = vi.fn(() => ({ render: renderButton, close: vi.fn().mockResolvedValue(undefined) }));
    Object.assign(window, { paypal_subs: { Buttons: create } });
    const view = render(<PayPalButton mode="subscription" planId="monthly" onApprove={async () => {}} />);
    const retry = await view.findByRole("button", { name: "Retry PayPal" });
    await act(async () => retry.click());
    await waitFor(() => expect(renderButton).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(view.queryByRole("alert")).toBeNull());
  });
});