import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The mobile PWA must render true fullscreen: the viewport meta locks zoom on
// device width and exposes the notch, the Apple standalone tags are present,
// and the global stylesheet pins html/body to the device screen while page
// scrolling moves into each route's outer container.
const projectRoot = process.cwd();
const rootSource = readFileSync(join(projectRoot, "src/routes/__root.tsx"), "utf8");
const cssSource = readFileSync(join(projectRoot, "src/styles.css"), "utf8");

describe("fullscreen PWA layout", () => {
  it("locks the viewport meta to device width with zoom disabled and notch coverage", () => {
    expect(rootSource).toContain(
      'content: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"',
    );
  });

  it("keeps the Apple standalone and status-bar meta tags", () => {
    expect(rootSource).toContain('{ name: "apple-mobile-web-app-capable", content: "yes" }');
    expect(rootSource).toContain('{ name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" }');
  });

  it("pins html and body to the device screen and scrolls inside the route container", () => {
    expect(cssSource).toContain("height: -webkit-fill-available;");
    expect(cssSource).toMatch(/body \{[\s\S]*?position: fixed;[\s\S]*?overflow: hidden;/);
    expect(cssSource).toMatch(/body > div \{[\s\S]*?overflow-y: auto;/);
  });
});
