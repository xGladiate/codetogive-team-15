export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: badges, error: badgesErr } = await supabase
    .from("badges")
    .select("id, name, description, rule_type, rule_config, icon_url")
    .order("id");
  if (badgesErr) return NextResponse.json({ error: badgesErr.message }, { status: 500 });

  const { data: awarded, error: awardedErr } = await supabase
    .from("user_badges")
    .select("badge_id, achieved_at")
    .eq("profile_id", user.id);
  if (awardedErr) return NextResponse.json({ error: awardedErr.message }, { status: 500 });

  const awardedMap = new Map<string, string | null>();
  for (const a of awarded ?? []) {
    awardedMap.set(a.badge_id, (a as any).achieved_at ?? null);
  }

  const payload = (badges ?? []).map((b) => {
    const achievedAt = awardedMap.get(b.id) ?? null;
    return {
      id: b.id,
      name: b.name,
      description: b.description,
      icon_url: b.icon_url ?? "",
      achieved: awardedMap.has(b.id),
      achievedDate: achievedAt, 
    };
  });

  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
}
