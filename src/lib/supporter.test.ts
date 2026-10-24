import { expect, it } from "vitest";
import { SUPPORTER_PAYMENT_URL } from "./supporter";

it("uses Carl's public Stripe supporter payment link", () => {
  expect(SUPPORTER_PAYMENT_URL).toBe("https://buy.stripe.com/eVq14p1xofTGge14kUaVa00");
});