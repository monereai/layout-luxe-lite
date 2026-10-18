import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/.lovable/oauth/consent")({
  staticData: { sitemap: false },
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({ authorization_id: typeof s["authorization_id"] === "string" ? s["authorization_id"] : "" }),
  head: () => ({ meta: [
    { title: "Connect your assistant — MonereAI" },
    { name: "description", content: "Review and approve an assistant connection to your MonereAI account." },
    { property: "og:title", content: "Connect your assistant — MonereAI" },
    { property: "og:description", content: "Securely review access to your MonereAI account." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("This connection link is missing its authorization request. Start the connection again.");
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error("Could not check your sign-in. Please try again.");
    if (!data.session) throw redirect({ to: "/auth", search: { next: location.pathname + location.searchStr + (location.hash ? `#${location.hash}` : "") } });
    return { accountEmail: data.session.user.email };
  },
  loader: async ({ location }) => {
    const id = new URLSearchParams(location.searchStr).get("authorization_id");
    if (!id) throw new Error("Start the assistant connection again.");
    const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(id);
    if (error || !data) throw new Error("This connection request is invalid or expired. Start the connection again.");
    if ("redirect_url" in data && data.redirect_url) throw redirect({ href: data.redirect_url });
    return data;
  },
  pendingComponent: () => <ConsentFrame><p>Loading connection request…</p></ConsentFrame>,
  errorComponent: ({ error }) => <ConsentFrame><h1 className="font-display text-2xl">Connection unavailable</h1><p className="mt-4 text-muted-foreground" role="alert">{error instanceof Error ? error.message : "Could not load this connection. Please start again."}</p></ConsentFrame>,
  component: Consent,
});
function ConsentFrame({ children }: { children: ReactNode }) {
  return <main className="min-h-screen bg-background px-5 py-12 text-foreground"><div className="mx-auto max-w-lg"><p className="mb-6 font-display text-3xl text-primary">MonereAI</p>{children}</div></main>;
}
function Consent() {
  const details = Route.useLoaderData();
  const { accountEmail } = Route.useRouteContext();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const name = "client" in details ? details.client.name : "your assistant";
  const scopes = "scope" in details ? details.scope.split(" ").filter(Boolean) : [];
  async function decide(approve: boolean) {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const result = approve ? await supabase.auth.oauth.approveAuthorization(authorization_id) : await supabase.auth.oauth.denyAuthorization(authorization_id);
      if (result.error) throw new Error("Your decision could not be saved. Please try again.");
      if (!result.data?.redirect_url) throw new Error("The connection did not return a destination. Start it again.");
      window.location.assign(result.data.redirect_url);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not complete the connection."); setBusy(false); }
  }
  return <ConsentFrame>
    <h1 className="font-display text-2xl font-semibold">Connect {name} to MonereAI</h1>
    <p className="mt-4 text-muted-foreground">Signed in as {accountEmail}</p>
    <Button variant="link" className="px-0" disabled={busy} onClick={async () => { const result = await supabase.auth.signOut(); if (result.error) { setError("Could not sign out. Try again."); return; } window.location.reload(); }}>Switch account</Button>
    <p className="mt-3">This lets {name} use this app as you.</p>
    {"client" in details && <p className="mt-3 break-all text-sm text-muted-foreground">Return address: {details.redirect_uri}</p>}
    <ul className="mt-5 list-disc space-y-2 pl-5">
      {scopes.map(scope => <li key={scope}>{scope === "email" ? "Share your email address" : scope === "profile" ? "Share your basic profile" : scope === "openid" ? "Confirm your account identity" : `Additional permission requested: ${scope}`}</li>)}
      <li>Read your saved energy, account points, and membership.</li><li>Read membership and point pack prices.</li>
    </ul>
    <p className="mt-5 text-sm text-muted-foreground">This does not bypass MonereAI permissions. It cannot purchase, spend points, claim rewards, or read your device-local journal.</p>
    {error && <p role="alert" className="mt-4 text-destructive">{error}</p>}
    <div className="mt-6 flex flex-wrap gap-3"><Button disabled={busy} onClick={() => void decide(true)}>Approve connection</Button><Button variant="outline" disabled={busy} onClick={() => void decide(false)}>Cancel connection</Button></div>
  </ConsentFrame>;
}
