const clientToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"] as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="relative z-50 w-full border-b border-destructive/40 bg-destructive/15 px-4 py-2 text-center text-xs text-foreground">
        Payments aren't set up for live use yet. Complete go-live to accept real payments.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="relative z-50 w-full border-b border-primary/30 bg-primary/15 px-4 py-2 text-center text-xs text-foreground">
        All payments made in the preview are in test mode.{" "}
        <a href="https://docs.lovable.dev/features/payments#test-and-live-environments" target="_blank" rel="noopener noreferrer" className="font-medium underline">Read more</a>
      </div>
    );
  }
  return null;
}
