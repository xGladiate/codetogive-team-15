// components/donation-status-ssr.tsx
import { createClient } from "@/lib/supabase/server";

type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "cancelled";

const statusColors: Record<PaymentStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-blue-100 text-blue-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

type Props = {
  donationId: string | number;
  paymentMethod?: string | null;
};

export default async function DonationStatus({ donationId, paymentMethod }: Props) {
  if (paymentMethod?.toLowerCase() === "stripe") {
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors.paid}`}>
        {statusLabels.paid}
      </span>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("donations")
    .select("payment_status")
    .eq("id", donationId)
    .single();

  const status: PaymentStatus =
    (data?.payment_status as PaymentStatus | null) ?? "pending";

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
