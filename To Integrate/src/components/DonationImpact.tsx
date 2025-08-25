import { useState, type ChangeEvent } from "react";
import { useMemo} from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ---- Types ----
type Costs = {
  k3_month: number;
  textbook_set: number;
  meal: number;
};

type LiteracyPoint = {
  age: number;
  "Baseline (underserved)": number;
  "Average child": number;
  "With donation": number;
};

type ImpactScrollerProps = {
  defaultMonthly?: number;
  defaultMonths?: number;
  /** Hidden backend knob: donors per child in the co-funding pool */
  defaultDonorsPerChild?: number;
  costs?: Costs;
};

// --- tweak these to your program costs (HKD, example values) ---
const DEFAULT_COSTS: Costs = {
  k3_month: 2800, // HK$ per month of K3 tuition
  textbook_set: 400, // HK$ per set of textbooks
  meal: 25, // HK$ per school meal
};

const currencyFmt = new Intl.NumberFormat("en-HK", {
  style: "currency",
  currency: "HKD",
  maximumFractionDigits: 0,
});
const currency = (n: number) => currencyFmt.format(n);

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minWidth: 340,
        maxWidth: 420,
        flex: "0 0 auto",
        background: "white",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 4px 14px rgba(0,0,0,.12)",
      }}
    >
      {children}
    </div>
  );
}

export default function ImpactScroller({
  defaultMonthly = 50,
  defaultMonths = 12,
  defaultDonorsPerChild = 5, // Adjust based on Donor to recipient ratio
  costs = DEFAULT_COSTS,
}: ImpactScrollerProps) {
  const [monthly, setMonthly] = useState<number>(defaultMonthly);
  const [months, setMonths] = useState<number>(defaultMonths);

  // Hidden donors-per-child (no UI control)
  const donorsPerChild = Math.max(1, Math.round(Number(defaultDonorsPerChild) || 1));

  // Visible user budget vs pooled (co-funded) budget
  const userBudget = monthly * months; // this donor only
  const pooledBudget = userBudget * donorsPerChild; // assumes all co-funders mirror

  // Impact math based on pooled budget for ONE child
  const k3MonthsFunded = Math.floor(pooledBudget / costs.k3_month);
  const textbookSets = Math.floor(pooledBudget / costs.textbook_set);
  const meals = Math.floor(pooledBudget / costs.meal);
  const k3YearCoverage = Math.min(
    100,
    Math.round((pooledBudget / (costs.k3_month * 12)) * 100)
  );

  // ---- Reading level (grade-equivalent) helpers ----
  const hkGradeFromAge = (age: number): number =>
    Math.max(0, Math.min(12, age - 5));
  const gradeLabel = (g: number): string =>
    g === 0 ? "K3" : g <= 6 ? `P${g}` : `S${g - 6}`;

  // --- knobs you can tune ---
  const GAP_START = 0.6; // ~0.6 grade behind at K3
  const GAP_END = 1.2; // widens to ~1.2 by S6 (try 1.3–1.4 for more spread)
  const MAX_EFFECT_PRIMARY = 0.7; // share of gap closed in P1–P6
  const MAX_EFFECT_SECONDARY = 0.4; // share of gap closed in S1–S6

  // widening gap with age (smooth “Matthew effect”)
  const gapAtAge = (age: number): number => {
    const t = (age - 10) / 2; // center ~P5/S1
    const s = 1 / (1 + Math.exp(-t)); // 0..1
    return GAP_START + (GAP_END - GAP_START) * s;
  };

  // funding effect (diminishing returns) using pooled share of a K3 year
  const effectFromFunding = (): number => {
    const yearShare = Math.max(0, pooledBudget / (costs.k3_month * 12)); // 0..1+
    return Math.min(1, Math.sqrt(yearShare)); // softer ramp
  };

  const stageWeight = (age: number): number =>
    age <= 12 ? MAX_EFFECT_PRIMARY : MAX_EFFECT_SECONDARY;

  const trajLiteracyData: LiteracyPoint[] = useMemo(() => {
    const ages = Array.from({ length: 14 }, (_, i) => 5 + i); // 5..18
    const eff = effectFromFunding(); // 0..1

    return ages.map((age) => {
      const avg = hkGradeFromAge(age); // “Average child” (at-grade)
      const gap = gapAtAge(age); // 0.6 → ~1.2
      const underserved = Math.max(0, avg - gap); // no help
      const reduction = eff * stageWeight(age); // fraction of gap closed
      const withDonation = Math.min(12, avg - gap * (1 - reduction));
      return {
        age,
        "Baseline (underserved)": underserved,
        "Average child": avg,
        "With donation": withDonation,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pooledBudget, costs.k3_month]);

  // Recharts tooltip formatters (loose typing for Recharts' any signatures)
  const tooltipValueFormatter = (value: number) => [
    `${Number(value).toFixed(1)} GE (${gradeLabel(Math.round(value))})`,
    "",
  ] as [string, string];
  const tooltipLabelFormatter = (age: number) => `Age ${age}`;

  return (
    <div style={{ marginTop: 20 }}>
      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <strong>See your impact!</strong>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          Monthly (HK$){" "}
          <input
            type="number"
            min={5}
            step={5}
            value={monthly}
            onChange={(e) =>
              setMonthly(Math.max(0, Number(e.target.value) || 0))
            }
            style={{ width: 110 }}
          />
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          Months{" "}
          <input
            type="number"
            min={1}
            max={36}
            value={months}
            onChange={(e) =>
              setMonths(Math.min(36, Math.max(1, Number(e.target.value) || 1)))
            }
            style={{ width: 70 }}
          />
        </label>

        {/* No donors control shown */}
        <div style={{ marginLeft: "auto", fontWeight: 600 }}>
          Your pledge: {currency(userBudget)}
        </div>
      </div>

      {/* Horizontal scroller */}
      <div
        style={{
          display: "flex",
          gap: 16,
          overflowX: "auto",
          paddingBottom: 8,
          scrollSnapType: "x mandatory",
        }}
      >
        {/* Card 1: Overview */}
        <Card>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
            At a glance
          </div>
          <div style={{ color: "#6b7280", marginBottom: 12 }}>
            With {currency(monthly)} / month for {months} months:
          </div>
          <ul style={{ lineHeight: 1.7 }}>
            <li>
              <b>{k3MonthsFunded}</b> months of K3 tuition funded (co-funded
              model)
            </li>
            <li>
              <b>{textbookSets}</b> textbook sets provided
            </li>
            <li>
              <b>{meals.toLocaleString()}</b> nutritious meals covered
            </li>
          </ul>
          <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
            Assumed full K3 monthly tuition:{" "}
            <b>{currency(costs.k3_month)}</b>.
          </div>
        </Card>

        {/* Card 2: K3 coverage gauge */}
        <Card>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
            K3 tuition coverage
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
            Based on a pooled co-funding model (hidden ratio).
          </div>
          <div style={{ height: 14, background: "#f3f4f6", borderRadius: 999 }}>
            <div
              style={{
                width: `${k3YearCoverage}%`,
                background: k3YearCoverage >= 100 ? "#059669" : "#10b981",
                height: "100%",
                borderRadius: 999,
                transition: "width .25s",
              }}
            />
          </div>
          <div style={{ marginTop: 8, fontWeight: 700, fontSize: 20 }}>
            {k3YearCoverage}% of a full year
          </div>
          <div style={{ color: "#6b7280", fontSize: 12, marginTop: 6 }}>
            = {k3MonthsFunded} months of tuition covered (pooled)
          </div>
        </Card>

        {/* Card 3: Reading level (grade-equivalent) */}
        <Card>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Reading level (grade-equivalent)
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
            Illustrative trajectory from age 5–18
          </div>
          <div style={{ width: 360, height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trajLiteracyData}
                margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
              >
                <XAxis dataKey="age" tick={{ fontSize: 12 }} />
                <YAxis
                  domain={[0, 12]}
                  ticks={[0, 1, 3, 6, 9, 12]}
                  tickFormatter={(v: number) => gradeLabel(v)}
                  label={{
                    value: "Reading level (K3 → S6)",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "#6b7280", fontSize: 12 },
                  }}
                />
                <Tooltip
                  labelFormatter={tooltipLabelFormatter as any}
                  formatter={tooltipValueFormatter as any}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Baseline (underserved)"
                  stroke="#9ca3af"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Average child"
                  stroke="#3b82f6"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="With donation"
                  stroke="#ef4444"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Disclaimer */}
          <div
            style={{
              color: "#6b7280",
              fontSize: 12,
              marginTop: 6,
              lineHeight: 1.5,
            }}
          >
            Scale: <b>0 = K3</b>; <b>1–6 = Primary 1–6 (P1–P6)</b>;{" "}
            <b>7–12 = Secondary 1–6 (S1–S6)</b>. An average child reaches S6 by
            age 18. Underserved children often fall behind, but with your
            donation they can move significantly closer to grade level!
            (Illustrative.)
          </div>
        </Card>

        {/* Card 4: Dollar Impacts */}
        <Card>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Dollar Impacts
          </div>
          <ul style={{ lineHeight: 1.8 }}>
            <li>
              Every <b>{currency(costs.k3_month)}</b> → funds <b>1 month</b> of
              K3 tuition
            </li>
            <li>
              Every <b>{currency(costs.textbook_set)}</b> → buys{" "}
              <b>1 textbook set</b>
            </li>
            <li>
              Every <b>{currency(costs.meal)}</b> → provides <b>1 meal</b>
            </li>
          </ul>
          <div style={{ marginTop: 10, color: "#6b7280", fontSize: 12 }}>
            Your pledge of {currency(userBudget)} is pooled with co-funders to
            achieve the totals shown.
          </div>
        </Card>
      </div>
    </div>
  );
}
