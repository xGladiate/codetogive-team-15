import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type DonorInfo = {
  id: string;
  role: "donor" | "admin" | string;
  created_at: string;
  name: string | null;
  email: string | null;
};

export async function GET(_req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, role, created_at, name, email")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (profile.role !== "donor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { count: donationCount, error: countError } = await supabase
    .from("donations")
    .select("id", { count: "exact", head: true })
    .eq("donor_id", user.id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const { data: aggRows, error: aggError } = await supabase
    .from("donations")
    .select("amount_sum:amount.sum(), first:created_at.min(), last:created_at.max()")
    .eq("donor_id", user.id);

  if (aggError) {
    return NextResponse.json({ error: aggError.message }, { status: 500 });
  }

  const payload: DonorInfo = {
    id: profile.id,
    role: profile.role,
    created_at: profile.created_at,
    name: profile.name ?? null,
    email: profile.email ?? null
  };

  return NextResponse.json(payload);
}
