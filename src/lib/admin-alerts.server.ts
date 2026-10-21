import { sendTemplateEmail } from "./email-templates/send-email";
import { ADMIN_ALERT_TO, type AccountAlert } from "./admin-alert-data";

export async function sendAccountAlert(data: AccountAlert, idempotencyKey: string) {
  return sendTemplateEmail("admin-account-alert", ADMIN_ALERT_TO, { templateData: data, idempotencyKey });
}