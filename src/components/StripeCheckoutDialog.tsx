import { useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession } from "@/lib/payments.functions";

export function StripeCheckoutDialog({ item, onClose }: { item: { priceId: string; title: string } | null; onClose: () => void }) {
  const create = useServerFn(createCheckoutSession);
  const priceId = item?.priceId;
  const fetchClientSecret = useCallback(async () => {
    const r = await create({ data: { priceId: priceId!, environment: getStripeEnvironment(), returnUrl: `${window.location.origin}/shop?session_id={CHECKOUT_SESSION_ID}` } });
    if ("error" in r) throw new Error(r.error);
    return r.clientSecret;
  }, [create, priceId]);

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item?.title}</DialogTitle>
          <DialogDescription>Pay securely with Stripe by card. Under 18? Ask a parent or guardian.</DialogDescription>
        </DialogHeader>
        {item && (
          <EmbeddedCheckoutProvider key={item.priceId} stripe={getStripe()} options={{ fetchClientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        )}
      </DialogContent>
    </Dialog>
  );
}
