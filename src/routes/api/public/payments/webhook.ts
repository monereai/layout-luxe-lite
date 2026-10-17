import { createFileRoute } from "@tanstack/react-router";
import { createStripeClient, type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { syncStripeSubscription } from "@/lib/stripe-sync.server";

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") return Response.json({ received: true, ignored: "invalid env" });
        const env: StripeEnv = rawEnv;
        try {
          const event = await verifyWebhook(request, env);
          const obj = event.data.object;
          let subId: string | undefined;
          if (event.type.startsWith("customer.subscription.")) subId = obj.id;
          else if (event.type === "invoice.paid") subId = obj.subscription ?? obj.parent?.subscription_details?.subscription;
          if (subId) await syncStripeSubscription(createStripeClient(env), subId, env);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
