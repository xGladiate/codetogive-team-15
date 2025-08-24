import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {BadgesCarousel } from "@/components/badges-carousel";
import DonationHistory from "@/components/donation-history";
import gradientImg from "@/public/assets/gradient.png";
import { Badge } from "@/types/database"
import { recomputeAndPersistUserBadges } from "@/lib/badges/evaluator";

type UIBadge = {
  id: string;
  name: string;
  description: string | null;
  icon_url: string;
  achieved: boolean;
  achievedDate: string | null;
};

export const dynamic = "force-dynamic";

type SP = { page?: string; pageSize?: string };

export default async function DonorProfilePage({
  searchParams,
}: {
  searchParams: Promise<SP>; 
}) {
  const supabase = await createClient();
  const sp = await searchParams;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) redirect("/auth/login");

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, role, created_at, name, email")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) redirect("/auth/login");
  if (profile.role !== "donor") redirect("/");

  await recomputeAndPersistUserBadges(user.id);

  // 2) Fetch all badges (catalog) including rule fields
  const { data: badges, error: badgesErr } = await supabase
    .from("badges")
    .select("id, name, description, icon_url, rule_type, rule_config")
    .order("id", { ascending: true });
  
  if (badgesErr) {
    console.error("badges fetch error:", badgesErr.message);
  }

  // 3) Fetch user's awarded rows
  const { data: awardedRows, error: awardedErr } = await supabase
    .from("user_badges")
    .select("badge_id, achieved_at")
    .eq("user_id", user.id);

  if (awardedErr) {
    console.error("user_badges fetch error:", awardedErr.message);
  }

  const achievedMap = new Map<string, string | null>();
  for (const r of awardedRows ?? []) {
    achievedMap.set(r.badge_id as string, (r as any).achieved_at ?? null);
  }

  const initialBadges: UIBadge[] = (badges as Badge[] ?? []).map((b) => {
    const date = achievedMap.get(b.id) ?? null;
    return {
      id: b.id,
      name: b.name,
      description: b.description,
      icon_url: b.icon_url ?? "",
      achieved: achievedMap.has(b.id),
      achievedDate: date,
    };
  });

  const { data: sumRows, error: sumError } = await supabase
    .from("donations")
    .select("total:amount.sum()")
    .eq("donor_id", user.id);

  if (sumError) {
    console.error("sum error", sumError.message);
  }

  const totalFunded = Number(sumRows?.[0]?.total ?? 0); 
  const totalFundedDisplay = totalFunded.toLocaleString();

  return (
    <div className="relative w-full">
      {/* Card */}
      <div className="relative bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mx-auto overflow-hidden">
        {/* top gradient bar */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-2">
          <Image src={gradientImg} alt="" fill className="object-cover" priority />
        </div>

        <div className="divide-y divide-gray-200">
          {/* User info */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-8 mb-6">
            {/* avatar + name + stats */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl sm:text-2xl font-bold text-blue-600">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : "D"}
                </span>
              </div>

              {/* Name + Stats */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                  {profile.name || "Donor"}
                </h1>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-gray-600 text-sm sm:text-base">
                  <span className="text-gray-500">Donated</span>
                  <span className="text-yellow-600 font-semibold">${totalFundedDisplay}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Badges */}
          <section className="py-2">
            <BadgesCarousel initialBadges={initialBadges} />
          </section>

          {/* Donation History */}
          <section className="py-2">
            <DonationHistory page={sp.page} pageSize={sp.pageSize}  />
          </section>
        </div>
      </div>
    </div>
  );
}
