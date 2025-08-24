import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: (process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion) || "2025-07-30.basil",
});

export async function POST(req: Request) {
    try {
      const body = await req.json();
  
      const isOneTime = body.frequency === "one-time";
      const unitAmount = Math.round(Number(body.amount) * 100); // HKD cents
      if (unitAmount < 50) {
        return NextResponse.json(
          { error: "Min charge is HKD$2" },
          { status: 500 }
        );
      }

      const session = await stripe.checkout.sessions.create({
        mode: isOneTime ? "payment" : "subscription",
        payment_method_types: ["card"],
        line_items: [
          isOneTime
            ? {
                price_data: {
                  currency: "hkd",
                  unit_amount: unitAmount,
                  product_data: {
                    name: body.packageName,
                    description: body.remarks || undefined,
                  },
                },
                quantity: 1,
              }
            : {
                price_data: {
                  currency: "hkd",
                  unit_amount: unitAmount,
                  recurring: {
                    interval: body.frequency === "monthly" ? "month" : "year",
                  },
                  product_data: {
                    name: `${body.packageName} (${body.frequency})`,
                    description: body.remarks || undefined,
                  },
                },
                quantity: 1,
              },
        ],
        customer_email: body.email,
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/donor?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/donate?canceled=1`,
        client_reference_id: body.donationId, 
        metadata: { donation_id: String(body.donationId || "") },
      });
  
      return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error("Stripe error", err);
        return NextResponse.json(
          { error: "Stripe error", details: err.message },
          { status: 500 }
        );
    }
  }
