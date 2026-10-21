import { Body, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { ADMIN_ALERT_SUBJECT, ADMIN_ALERT_TO, type AccountAlert } from "../admin-alert-data";

function AdminAccountAlert({ event = "Registration", username = "Not provided", email = "Not provided", signupAt = "Not available", eventAt = "Not available", source = "direct", tier = "Free" }: Partial<AccountAlert>) {
  return <Html lang="en"><Head /><Preview>New Monere AI {event.toLowerCase()}</Preview>
    <Body style={body}><Container style={container}>
      <Heading style={heading}>MonereAI · {event}</Heading>
      <Text>A user has completed {event === "Registration" ? "registration" : "a new subscription"}.</Text>
      <Section style={details}>
        <Text><strong>Username:</strong> {username}</Text>
        <Text><strong>Email:</strong> {email}</Text>
        <Text><strong>Sign-up timestamp (UTC):</strong> {signupAt}</Text>
        <Text><strong>Notification event (UTC):</strong> {eventAt}</Text>
        <Text><strong>Signup source:</strong> {source}</Text>
        <Text><strong>Subscription tier:</strong> {tier}</Text>
      </Section>
    </Container></Body>
  </Html>;
}
export const template = {
  component: AdminAccountAlert,
  subject: ADMIN_ALERT_SUBJECT,
  to: ADMIN_ALERT_TO,
  displayName: "Admin registration / subscription alert",
  previewData: { event: "Registration", username: "Example user", email: "example@example.com", signupAt: "2026-10-21T08:00:00Z", eventAt: "2026-10-21T08:00:00Z", source: "guest conversion", tier: "Free" },
} satisfies TemplateEntry;
const body = { backgroundColor: "#ffffff", color: "#0f172a", fontFamily: "Arial, sans-serif" };
const container = { maxWidth: "560px", padding: "32px 24px" };
const heading = { fontSize: "24px", color: "#0f172a" };
const details = { borderTop: "3px solid #f59e0b", paddingTop: "12px" };