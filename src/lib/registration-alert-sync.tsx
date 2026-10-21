import { useEffect, useRef } from "react";
import { usePlan } from "@/hooks/usePlan";
import { eligibleRegistration } from "./admin-alert-data";
import { guestCompleted, guestPoints } from "./guest-preview";
import { notifyRegistration } from "./registration-alert.functions";

export function RegistrationAlertSync() {
  const { user, ready } = usePlan();
  const done = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || !user || !eligibleRegistration(user)) return;
    const accountId = user.id;
    const notify = () => {
      if (done.current === accountId) return;
      done.current = accountId;
      const source = guestCompleted() || guestPoints() > 0 || localStorage.getItem("monere-signup-source") === "guest conversion" ? "guest conversion" : "direct";
      void notifyRegistration({ data: { source } }).then(() => {
        localStorage.removeItem("monere-signup-source");
      }).catch(() => {
        done.current = null; // retry on focus, not a background polling loop
        console.warn("Registration alert pending; will retry on next visit or focus.");
      });
    };
    notify();
    window.addEventListener("focus", notify);
    return () => window.removeEventListener("focus", notify);
  }, [ready, user]);
  return null;
}