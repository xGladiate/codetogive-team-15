import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ImagesCarousel } from "@/components/user-stories-carousel";
import gradientImg from "@/public/assets/gradient.png";
import * as React from "react";

type UIImage = {
  id: string;
  title: string;
  poster_url: string;
  created_at: string;
};

export const dynamic = "force-dynamic";

type SP = { page?: string; pageSize?: string };

export default async function DonorDashboardPage({
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

  const { data: images, error: imagesErr } = await supabase
    .from("stories")
    .select("id, title, poster_url, created_at")
    .order("created_at", { ascending: false });

  if (imagesErr) {
    console.error("images fetch error:", imagesErr.message);
  }

  const initialImages: UIImage[] =
    (images ?? []).map((img) => ({
      id: img.id,
      title: img.title,
      poster_url: img.poster_url ?? "",
      created_at: img.created_at,
    })) ?? [];

  return (
    <div className="relative w-full">
      {/* Card */}
      <div className="relative bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mx-auto overflow-hidden">
        {/* top gradient bar */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-2">
          <Image src={gradientImg} alt="" fill className="object-cover" priority />
        </div>
        <div className="divide-y divide-gray-200">
          {/* Image Carousel Section */}
          <section className="py-2">
            <ImagesCarousel initialImages={initialImages} />
          </section>
        </div>
      </div>
    </div>
  );
}
