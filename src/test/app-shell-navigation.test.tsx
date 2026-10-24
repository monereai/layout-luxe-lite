import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...rest }: { children: React.ReactNode; to: string }) => <a href={to} {...rest}>{children}</a>,
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/" }),
}));
vi.mock("@/hooks/usePlan", () => ({ usePlan: () => ({ user: null, premium: false, signOut: vi.fn(), tier: "free" }) }));
vi.mock("@/hooks/useCare", () => ({ useCare: () => ({ data: { energy: 50 } }) }));
vi.mock("@/hooks/usePointsWallet", () => ({ usePointsWallet: () => 0 }));
vi.mock("@/hooks/useTreasureAccess", () => ({ useTreasureAccess: () => ({ tester: false }) }));
vi.mock("@/lib/game", () => ({ useGame: () => ({ detective: false }) }));
vi.mock("use-webmcp-tool", () => ({ useWebMCP: vi.fn() }));
vi.mock("@/components/QaPanel", () => ({ QaPanel: () => null }));
vi.mock("@/components/GuestSignupModal", () => ({ GuestRewardHost: () => null, GuestPointsTransfer: () => null }));
vi.mock("@/components/CrisisDialog", () => ({ CrisisDialog: () => null }));
vi.mock("@/components/PassCodeDialog", () => ({ PassCodeLink: () => null }));

import { AppShell } from "@/components/AppShell";

afterEach(cleanup);

it("keeps Treasure Hunt out of every main menu", () => {
  render(<AppShell><p>page</p></AppShell>);
  const menus = screen.getAllByRole("navigation");
  expect(menus.length).toBeGreaterThan(1);
  for (const menu of menus) expect(menu.textContent).not.toContain("Treasure Hunt");
});

it("offers the adventure as its own link, between the Points Shop and the Pet Shop", () => {
  render(<AppShell><p>page</p></AppShell>);
  const aside = document.querySelector('aside[aria-label="Points Shop"]');
  expect(aside).not.toBeNull();
  const hrefs = Array.from(aside!.querySelectorAll("a")).map(a => a.getAttribute("href"));
  expect(hrefs.indexOf("/treasure")).toBeGreaterThan(hrefs.indexOf("/shop"));
  expect(hrefs.indexOf("/treasure")).toBeLessThan(hrefs.indexOf("/pet-shop"));
  const griffin = screen.getAllByRole("link", { name: "The Golden Griffin · Chapter 1" });
  expect(griffin.length).toBeGreaterThan(0);
  expect(griffin[0]?.getAttribute("href")).toBe("/treasure");
});
