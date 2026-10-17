import { describe, expect, it } from "vitest";
import { paymentReturnUrl } from "@/lib/payment-return";

describe("Payment return routing", () => {
  it("returns live payments to monereai.com home with success and a verifiable session", () => {
    expect(paymentReturnUrl("https://monereai.com", "live")).toBe("https://monereai.com/?payment=success&session_id={CHECKOUT_SESSION_ID}");
  });
  it("rejects cross-origin live returns rather than losing the active session", () => {
    expect(() => paymentReturnUrl("https://www.monereai.com", "live")).toThrow("sign in there");
    expect(() => paymentReturnUrl("http://localhost:8080", "live")).toThrow("sign in there");
  });
  it("keeps test payments on the preview origin", () => {
    expect(paymentReturnUrl("http://localhost:8080", "sandbox")).toBe("http://localhost:8080/?payment=success&session_id={CHECKOUT_SESSION_ID}");
  });
});