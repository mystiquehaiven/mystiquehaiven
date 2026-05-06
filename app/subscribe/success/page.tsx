"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

export default function SubscribeSuccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"refreshing" | "done" | "error">("refreshing");

  useEffect(() => {
    async function refreshAndRedirect() {
      try {
        const user = auth.currentUser;
        if (!user) {
          router.replace("/signin");
          return;
        }

        // Force token refresh so the new custom claim is picked up.
        // The webhook may take a second or two — we retry a few times.
        let attempts = 0;
        const maxAttempts = 6;
        const delayMs = 2000;

        while (attempts < maxAttempts) {
          await new Promise((res) => setTimeout(res, delayMs));
          await user.getIdToken(true); // force refresh
          const idTokenResult = await user.getIdTokenResult();

          // If claim is set, we're good — head to content
          if (idTokenResult.claims.tier) {
            setStatus("done");
            router.replace("/content");
            return;
          }

          attempts++;
        }

        // Webhook may still be processing — send them to account page anyway
        setStatus("done");
        router.replace("/account");
      } catch (err) {
        console.error("Token refresh failed:", err);
        setStatus("error");
      }
    }

    refreshAndRedirect();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      {status === "refreshing" && (
        <>
          <h1 className="text-2xl font-semibold mb-2">Activating your access…</h1>
          <p className="text-muted-foreground">This takes just a moment.</p>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
          <p className="text-muted-foreground">
            Your payment went through — try refreshing or visiting your account page.
          </p>
        </>
      )}
    </div>
  );
}