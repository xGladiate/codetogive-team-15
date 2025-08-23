"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "cancelled"
  | "loading";

type Props = {
  donationId: string | number;
  paymentMethod?: "Stripe" | "Bank"
};

const defaultStatusFor = (pm?: string | null): PaymentStatus =>
  pm?.toLowerCase() === "stripe" ? "paid" : "pending";

export default function DonationStatus({ donationId, paymentMethod }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [status, setStatus] = useState<PaymentStatus>(
    paymentMethod ? defaultStatusFor(paymentMethod) : "loading"
  );

  useEffect(() => {
    let active = true;

    (async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("payment_status, payment_method")
        .eq("id", donationId)
        .single();

      if (!active) return;

      if (error) {
        console.error("Failed to fetch donation status:", error.message);
        if (status === "loading")
          setStatus(defaultStatusFor(paymentMethod));
        return;
      }

      const dbStatus = (data?.payment_status as PaymentStatus | null) ?? null;
      if (dbStatus) {
        setStatus(dbStatus);
      } else {
        setStatus(defaultStatusFor(paymentMethod ?? data?.payment_method));
      }
    })();

    const channel = supabase
      .channel(`donation:${donationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "donations",
          filter: `id=eq.${donationId}`,
        },
        (payload) => {
          const next = (payload.new as { payment_status?: PaymentStatus })
            ?.payment_status;
          if (next) setStatus(next);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [donationId, paymentMethod, supabase]);

  const statusColors: Record<PaymentStatus, string> = {
    loading: "bg-gray-100 text-gray-600",
    pending: "bg-amber-100 text-amber-800",
    paid: "bg-emerald-100 text-emerald-800",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-blue-100 text-blue-800",
    cancelled: "bg-gray-100 text-gray-800",
  };

  const statusLabels: Record<PaymentStatus, string> = {
    loading: "Loading",
    pending: "Pending",
    paid: "Paid",
    failed: "Failed",
    refunded: "Refunded",
    cancelled: "Cancelled",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
