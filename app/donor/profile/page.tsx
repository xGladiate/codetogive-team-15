import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {BadgesCarousel } from "@/components/badges-carousel";
import DonationHistory from "@/components/donation-history";
import gradientImg from "@/assets/gradient.png";

export default async function DonorProfilePage() {
  const supabase = await createClient();

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
      <div className="relative bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mx-auto max-w-6xl overflow-hidden">
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
                  <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                  <span className="text-yellow-600 font-semibold">{totalFundedDisplay}</span>
                  <span className="text-gray-500">Funded</span>
                </div>
              </div>
            </div>

            {/* Dashboard Button */}
            <Button className="w-full md:w-auto bg-green-700 hover:bg-green-800 text-white px-5 py-3">
              VIEW DONOR DASHBOARD
            </Button>
          </div>

          {/* Badges */}
          <section className="py-6">
            <BadgesCarousel />
          </section>

          {/* Donation History */}
          <section className="py-6">
            <DonationHistory />
          </section>
        </div>
      </div>
    </div>
  );
}
