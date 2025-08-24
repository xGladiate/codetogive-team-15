"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ReceiptButton({ donationId }: { donationId: number }) {
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    try {
      const p = fetch("/api/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donationId }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to send receipt");
        // try to extract a useful id to show in the toast
        const msgId =
          data?.result?.Messages?.[0]?.To?.[0]?.MessageID ??
          data?.result?.Messages?.[0]?.MessageID ??
          data?.result?.Messages?.[0]?.CustomID ??
          donationId;
        return { data, receiptRef: msgId };
      });

      await toast.promise(p, {
        loading: "Sending receipt…",
        success: ({ receiptRef }) => `Receipt sent 🎉  (ref: ${receiptRef})`,
        error: (err) => `Failed to send receipt: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-end items-center gap-2">
      <Button onClick={send} disabled={loading} aria-busy={loading}>
        {loading ? "Sending..." : "Receipt"}
      </Button>
    </div>
  );
}
