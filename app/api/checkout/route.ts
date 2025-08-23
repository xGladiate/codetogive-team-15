// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: (process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion) || "2024-06-20",
});

function getBaseUrl(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && /^https?:\/\//i.test(origin)) return origin;

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "http";
  if (host) return `${proto}://${host}`;

  const fromEnv =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (fromEnv && /^https?:\/\//i.test(fromEnv)) return fromEnv;

  return "http://localhost:3000";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, email, packageName, remarks, frequency, userId, schoolId, packageId } = body;

    const supabase = await createClient();

    const { data: donation, error } = await supabase
      .from("donations")
      .insert({
        amount,
        donor_id: userId,
        school_id: schoolId ?? null,
        package_id: packageId,
        remarks,
        type: frequency === "one-time" ? "one_off" : "recurring",
        payment_method: "Stripe",
        payment_status: "pending",
        email,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error || !donation) {
      console.error("Failed to insert donation:", error);
      return NextResponse.json({ error: "Failed to create donation" }, { status: 500 });
    }

    const unitAmount = Math.round(Number(amount) * 100);
    const isOneTime = frequency === "one-time";

    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = isOneTime
      ? {
          price_data: {
            currency: "hkd",
            unit_amount: unitAmount,
            product_data: { name: packageName, description: remarks || undefined },
          },
          quantity: 1,
        }
      : {
          price_data: {
            currency: "hkd",
            unit_amount: unitAmount,
            recurring: { interval: frequency === "monthly" ? "month" : "year" },
            product_data: { name: `${packageName} (${frequency})`, description: remarks || undefined },
          },
          quantity: 1,
        };

    const baseUrl = getBaseUrl(req);
    const successUrl = new URL(`/donor?success=true&donationId=${donation.id}`, baseUrl).toString();
    const cancelUrl = new URL(`/donate?canceled=1&donationId=${donation.id}`, baseUrl).toString();

    const session = await stripe.checkout.sessions.create({
      mode: isOneTime ? "payment" : "subscription",
      line_items: [lineItem],
      payment_method_types: ["card"],
      customer_email: email,
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: String(donation.id),
      metadata: { donation_id: String(donation.id) },
    });

    return NextResponse.json({ url: session.url, donationId: donation.id });
  } catch (err: any) {
    console.error("Stripe /checkout error:", err);
    return NextResponse.json({ error: err?.message ?? "Stripe error" }, { status: 500 });
  }
}
