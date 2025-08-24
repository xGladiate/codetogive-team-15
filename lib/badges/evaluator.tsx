import { createClient } from "@/lib/supabase/server";
import { Badge, Donation } from "@/types/database";

export type RuleType = "donation_count" | "distinct_schools" | "streak_days" | "total_amount";

export interface AchievedResult {
  badge_id: string;
  achieved_at: string; 
}

/**
 * Public entrypoint:
 * - Computes which badges are achieved for `userId`
 * - Writes new rows to user_badges (user_id, badge_id, achieved_at) with ON CONFLICT DO NOTHING
 * - Returns the list of badge ids newly inserted
 */
export async function recomputeAndPersistUserBadges(userId: string): Promise<AchievedResult[]> {
  const supabase = await createClient();

  // 1) Load badge rules
  const { data: badges, error: badgesErr } = await supabase
    .from("badges")
    .select("id, name, description, icon_url, rule_type, rule_config")
    .order("id", { ascending: true });

  if (badgesErr) throw new Error(`Failed to load badges: ${badgesErr.message}`);
  const rules: Badge[] = (badges ?? []) as unknown as Badge[];
  if (rules.length === 0) return [];

  // 2) Load this user's donations (minimal fields)
  const { data: donations, error: donationsErr } = await supabase
    .from("donations")
    .select("id, amount, school_id, created_at")
    .eq("donor_id", userId)
    .order("created_at", { ascending: true });

  if (donationsErr) throw new Error(`Failed to load donations: ${donationsErr.message}`);
  const ds: Pick<Donation, "id" | "amount" | "school_id" | "created_at">[] = donations ?? [];

  // 3) Compute metrics once
  const metrics = computeDonationMetrics(ds);

  // 4) Decide which badges should be achieved
  const achieved = decideAchievements(rules, metrics);

  if (achieved.length === 0) return [];

  // 5) Persist only the ones not yet in user_badges
  //    Use ON CONFLICT (user_id, badge_id) DO NOTHING
  const nowIso = new Date().toISOString();
  const rows = achieved.map<{
    user_id: string;
    badge_id: string;
    achieved_at: string;
  }>((a) => ({
    user_id: userId,
    badge_id: a.badge_id,
    achieved_at: nowIso,
  }));

  const { error: insertErr } = await supabase
    .from("user_badges")
    .upsert(rows, {
      onConflict: "user_id,badge_id",
      ignoreDuplicates: true,
    });

  if (insertErr) throw new Error(`Failed to upsert user_badges: ${insertErr.message}`);

  // Return the set we *intended* to insert (some may already exist; that's fine)
  return rows.map(r => ({ badge_id: r.badge_id, achieved_at: r.achieved_at }));
}

/** In-memory donation metrics we need to evaluate rules */
export interface DonationMetrics {
  donation_count: number;
  distinct_schools: number;
  best_streak_days: number;
  total_amount: number;
}

/**
 * Compute once, reuse everywhere.
 *
 * Streak definition (simple and predictable):
 * - Count the length of the **longest run of consecutive calendar days**
 *   with >= 1 donation per day (UTC).
 * - If you prefer local timezone streaks, replace the UTC date extraction below
 *   with a locale-aware one.
 */
export function computeDonationMetrics(donations: Pick<Donation, "amount" | "school_id" | "created_at">[]): DonationMetrics {
  // donation_count
  const donation_count = donations.length;

  // distinct_schools
  const schoolSet = new Set<number | string>();
  for (const d of donations) {
    if (d.school_id !== null && d.school_id !== undefined) {
      schoolSet.add(d.school_id);
    }
  }
  const distinct_schools = schoolSet.size;

  // total_amount
  const total_amount = donations.reduce((acc, d) => acc + Number(d.amount ?? 0), 0);

  // best_streak_days (UTC day buckets)
  const daySet = new Set<string>();
  for (const d of donations) {
    const dt = new Date(d.created_at);
    // bucket by UTC date; change to local if you prefer:
    const key = `${dt.getUTCFullYear()}-${dt.getUTCMonth() + 1}-${dt.getUTCDate()}`;
    daySet.add(key);
  }
  const best_streak_days = longestConsecutiveDayStreak(daySet);

  return { donation_count, distinct_schools, best_streak_days, total_amount };
}

/** Utility: compute longest consecutive day streak given a set of "YYYY-M-D" UTC day keys */
function longestConsecutiveDayStreak(dayKeys: Set<string>): number {
  if (dayKeys.size === 0) return 0;

  // Turn keys into epoch days (integer days since epoch), then find longest run
  const days = Array.from(dayKeys).map(k => {
    const [y, m, d] = k.split("-").map(Number);
    const time = Date.UTC(y, (m - 1), d, 0, 0, 0, 0);
    return Math.floor(time / 86_400_000); // ms in a day
  }).sort((a, b) => a - b);

  let best = 1;
  let cur = 1;

  for (let i = 1; i < days.length; i++) {
    if (days[i] === days[i - 1]) continue;           // same day (shouldn't happen due to set)
    if (days[i] === days[i - 1] + 1) cur += 1;       // consecutive
    else cur = 1;                                     // break
    if (cur > best) best = cur;
  }
  return best;
}

/**
 * Evaluate all rules against metrics.
 *
 * Rule semantics:
 * - donation_count: metrics.donation_count >= threshold
 * - distinct_schools: metrics.distinct_schools >= threshold
 * - streak_days: metrics.best_streak_days >= threshold
 * - total_amount: metrics.total_amount >= threshold
 */
export function decideAchievements(badges: Badge[], metrics: DonationMetrics): AchievedResult[] {
  const out: AchievedResult[] = [];
  const now = new Date().toISOString();

  for (const b of badges) {
    const threshold = Number(b.rule_config?.threshold ?? NaN);
    if (!Number.isFinite(threshold)) continue; // ignore misconfigured rules

    let pass = false;
    switch (b.rule_type) {
      case "donation_count":
        pass = metrics.donation_count >= threshold;
        break;
      case "distinct_schools":
        pass = metrics.distinct_schools >= threshold;
        break;
      case "streak_days":
        pass = metrics.best_streak_days >= threshold;
        break;
      case "total_amount":
        pass = metrics.total_amount >= threshold;
        break;
      default:
        // unknown rule_type -> ignore
        pass = false;
    }

    if (pass) {
      out.push({ badge_id: b.id, achieved_at: now });
    }
  }

  return out;
}
