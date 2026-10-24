import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { sitemapXML, isSitemapRouteIncluded } from "@/lib/sitemap";
import type { AnyRoute } from "@tanstack/react-router";
import { Route as TreasureRoute } from "@/routes/treasure";

function routeDecision(file: string) {
  if (file === "treasure.tsx") return String(TreasureRoute.options.staticData?.sitemap);
  const source = readFileSync(resolve("src/routes", file), "utf8");
  const decision = source.match(/staticData:\s*\{\s*sitemap:\s*(true|false|"exclude-subtree")/);
  if (!decision) throw new Error(`Missing sitemap decision: ${file}`);
  return decision[1];
}

describe("MonereAI public sitemap", () => {
  it("excludes the adventure while it is closed to visitors", () => {
    expect(TreasureRoute.options.staticData?.sitemap).toBe(false);
    expect(isSitemapRouteIncluded(TreasureRoute as AnyRoute)).toBe(false);
  });
  it.each(["index.tsx", "daily.tsx", "shop.tsx"])("includes public page %s", file => {
    expect(routeDecision(file)).toBe("true");
  });
  it.each(["journal.tsx", "auth.tsx", "find.tsx", "jigsaw.tsx", "story.tsx", "reset-password.tsx", "[.]lovable.oauth.consent.tsx", "mcp.ts", "[.well-known]/oauth-protected-resource.ts", "api/story-image.ts", "api/public/payments/webhook.ts", "__root.tsx", "sitemap[.]xml.ts"])("excludes personal or non-content route %s", file => {
    expect(routeDecision(file)).toBe("false");
  });
  it("requires decisions on every existing route", () => {
    const files = readdirSync(resolve("src/routes"), { recursive: true }).filter(file => typeof file === "string" && /\.tsx?$/.test(file));
    for (const file of files) expect(routeDecision(String(file))).toBeDefined();
  });
  it("does not let children override a private section", () => {
    const parent = { options: { staticData: { sitemap: "exclude-subtree" } } };
    const child = { options: { staticData: { sitemap: true } }, parentRoute: parent } as unknown as AnyRoute;
    expect(isSitemapRouteIncluded(child)).toBe(false);
  });
  it("uses the canonical domain without invented modification dates", () => {
    const xml = sitemapXML("https://www.monereai.com", [{ path: "/" }, { path: "/shop" }]);
    expect(xml).toContain("<loc>https://www.monereai.com/</loc>");
    expect(xml).toContain("<loc>https://www.monereai.com/shop</loc>");
    expect(xml).not.toContain("lastmod");
  });
  it("rejects unsafe destinations", () => {
    expect(() => sitemapXML("https://www.monereai.com", [{ path: "//other.example/private" }])).toThrow();
  });
});