import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Donation } from "@/types/database"
import { Button } from "./ui/button";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const badgeColor: Record<Donation["type"], string> = {
  one_off: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  recurring: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
};

const pmLabel = (pm: Donation["payment_method"] | null) => (pm ? pm.toUpperCase() : "—");

type Props = { page?: string; pageSize?: string };

export default async function DonationHistory({ page = "1", pageSize = "10" }: Props) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const pageNum = Math.max(1, Number(page));
  const pageSizeNum = Math.max(1, Number(pageSize));

  const from = (pageNum - 1) * pageSizeNum;
  const to = from + pageSizeNum - 1;

  const { data, error, count } = await supabase
    .from("donations")
    .select(
      "id, amount, donor_id, school_id, package_id, remarks, type, payment_method, created_at",
      { count: "exact" }
    )
    .eq("donor_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("donations fetch error:", error.message);
    return <div className="text-sm text-red-600">Failed to load donations.</div>;
  }

  const donations: Donation[] = (data ?? []).map((d: any) => ({
    ...d,
    id: String(d.id),
  }));

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSizeNum));

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground pt-4">Donation History</h2>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead className="bg-gray-50 text-left text-sm text-gray-600">
              <tr>
                <th className="w-[170px] px-4 py-3">Date</th>
                <th className="w-[140px] px-4 py-3">Amount (HKD)</th>
                <th className="w-[120px] px-4 py-3">Type</th>
                <th className="w-[140px] px-4 py-3">Payment Method</th>
                <th className="w-[140px] px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {donations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                    No donations yet.
                  </td>
                </tr>
              ) : (
                donations.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50/40">
                    <td className="px-4 py-3">{formatDate(d.created_at)}</td>
                    <td className="px-4 py-3 font-medium">${d.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${badgeColor[d.type]}`}>
                        {d.type === "one_off" ? "One‑off" : "Recurring"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{pmLabel(d.payment_method)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Button>Receipt</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
          <div>
            Page <span className="font-medium">{pageNum}</span> / {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`?page=${Math.max(1, pageNum - 1)}&pageSize=${pageSizeNum}`}
              className={`rounded-lg border border-gray-200 bg-white px-3 py-1.5 hover:bg-gray-50 ${pageNum <= 1 ? "pointer-events-none opacity-50" : ""}`}
            >
              Prev
            </Link>
            <Link
              href={`?page=${Math.min(totalPages, pageNum + 1)}&pageSize=${pageSizeNum}`}
              className={`rounded-lg border border-gray-200 bg-white px-3 py-1.5 hover:bg-gray-50 ${pageNum >= totalPages ? "pointer-events-none opacity-50" : ""}`}
            >
              Next
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

