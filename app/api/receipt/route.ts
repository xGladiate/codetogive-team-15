// app/api/receipt/route.ts
import { NextRequest, NextResponse } from "next/server";
import Mailjet from "node-mailjet";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs"; // ensure Node runtime for pdf-lib & Mailjet

const mailjet = Mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC!,
  process.env.MJ_APIKEY_PRIVATE!
);

// ---- Signature config ----
// Prefer a storage path like "signature.png" in bucket "assets".
// You can also set SIGNATURE_URL to a full (public/signed) URL if you don't want to read from storage.
const SIG_BUCKET = "assets";
const SIG_PATH = "signature.png";
const SIG_URL = ""; // optional override
const SIGNER_NAME = "Project REACH";

// --------- utils ----------
function formatCurrency(amount: number, currency = "HKD") {
  try {
    return new Intl.NumberFormat("en-HK", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

async function embedSignatureBytes(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : any
): Promise<Uint8Array | null> {
  try {
    // Use URL if provided
    if (SIG_URL && /^https?:\/\//i.test(SIG_URL)) {
      const res = await fetch(SIG_URL);
      if (!res.ok) return null;
      return new Uint8Array(await res.arrayBuffer());
    }
    // Fall back to storage path
    const { data: blob, error } = await (await supabase).storage.from(SIG_BUCKET).download(SIG_PATH);
    if (error || !blob) return null;
    return new Uint8Array(await blob.arrayBuffer());
  } catch {
    return null;
  }
}

// --------- handler ---------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const donationId: number | undefined = body.donationId;
    if (!donationId) {
      return NextResponse.json({ error: "Missing donationId" }, { status: 400 });
    }

    const supabase = createClient();

    // Pull donation row
    const { data: donation, error: donationErr } = await (await supabase)
      .from("donations")
      .select(`
        id,
        donor_id,
        amount,
        created_at,
        type,
        payment_method,
        currency,
        provider_txn
      `)
      .eq("id", donationId)
      .single();

    if (donationErr || !donation) {
      return NextResponse.json({ error: donationErr?.message || "Donation not found" }, { status: 404 });
    }

    // Pull donor email/name
    const { data: user, error: userErr } = await (await supabase)
      .from("users")
      .select("email, name")
      .eq("id", donation.donor_id)
      .single();

    if (userErr || !user?.email) {
      return NextResponse.json({ error: userErr?.message || "Donor email not found" }, { status: 404 });
    }

    // Map fields
    const id = String(donation.id);
    const email = user.email as string;
    const donorName = user.name || "Donor";
    const amount = Number(donation.amount);
    const created_at: string = donation.created_at;
    const currency = donation.currency ?? "HKD";
    const providerTxn: string | undefined = donation.provider_txn ?? null;

    if (!id || !email || Number.isNaN(amount) || !created_at) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // --- PDF creation ---
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const fontSize = 11;
    const lineHeight = 16;
    const leftMargin = 50;

    const dateStr = new Date(created_at).toLocaleDateString("en-HK", {
      year: "numeric", month: "long", day: "2-digit",
    });

    // Header
    let y = 800;
    page.drawText("Race for Education Accessibilities for Every Child Limited (1704213)", { x: leftMargin, y, size: 10, font: timesFont });
    y -= lineHeight;
    page.drawText("902, 168 Queen’s Road Central, Central, Hong Kong", { x: leftMargin, y, size: 10, font: timesFont });
    y -= lineHeight;
    page.drawText("T: 3100-0135   F: 3100-0134   E: committee@reach.org.hk", { x: leftMargin, y, size: 10, font: timesFont });

    // Title
    page.drawText("Receipt", { x: 270, y: 720, size: 14, font: boldFont });

    // Details
    y = 690;
    page.drawText(`Date: ${dateStr}`, { x: leftMargin, y, size: fontSize, font: timesFont });
    page.drawText(`Receipt number: ${id}`, { x: 350, y, size: fontSize, font: timesFont });
    y -= lineHeight;
    page.drawText(`Donation received from: ${donorName} <${email}>`, { x: leftMargin, y, size: fontSize, font: timesFont });
    y -= lineHeight;
    page.drawText(`Amount received: ${formatCurrency(amount, currency)}`, { x: leftMargin, y, size: fontSize, font: timesFont });
    page.drawText(`Payment method: ${donation.payment_method ?? (providerTxn ? "Online" : "N/A")}`, { x: 350, y, size: fontSize, font: timesFont });

    // --- Authorized Signature box (replaces Remarks box) ---
    // We reuse the same area where the remarks box used to be.
    y -= 50;
    const boxX = leftMargin;
    const boxTopY = y;
    const boxWidth = 500;
    const boxHeight = 110; // slightly taller to fit image comfortably
    const boxPadding = 8;

    // Box border
    page.drawRectangle({
      x: boxX, y: boxTopY - boxHeight, width: boxWidth, height: boxHeight,
      borderColor: rgb(0, 0, 0), borderWidth: 1,
    });

    // Box title
    page.drawText("Authorized Signature", { x: boxX + 5, y: boxTopY - 12, size: fontSize, font: boldFont });

    // Signature line, centered horizontally inside the box
    const innerY = boxTopY - 70; // line position inside the box
    const boxCenterX = boxX + boxWidth / 2;
    const lineWidth = 220;
    const lineStartX = Math.round(boxCenterX - lineWidth / 2);
    const lineEndX = lineStartX + lineWidth;

    page.drawLine({
      start: { x: lineStartX, y: innerY },
      end: { x: lineEndX, y: innerY },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });

    // Try to render signature image above the line
    let usedImage = false;
    try {
      const arr = await embedSignatureBytes(supabase);
      if (arr) {
        const isPng = (SIG_URL || SIG_PATH).toLowerCase().endsWith(".png");
        const img = isPng ? await pdfDoc.embedPng(arr) : await pdfDoc.embedJpg(arr);
        const targetW = 160;
        const targetH = (img.height / img.width) * targetW;
        const imgX = Math.round(boxCenterX - targetW / 2);
        // place image a bit above the line
        page.drawImage(img, { x: imgX, y: innerY + 10, width: targetW, height: targetH });
        usedImage = true;
      }
    } catch {
      usedImage = false;
    }

    // Fallback typed signature if image isn’t available
    if (!usedImage) {
      const fallbackText = "/s/ " + SIGNER_NAME;
      const w = timesFont.widthOfTextAtSize(fallbackText, 10);
      page.drawText(fallbackText, {
        x: Math.round(boxCenterX - w / 2),
        y: innerY + 10,
        size: 10,
        font: timesFont,
      });
    }

    // Name label below line
    const nameW = boldFont.widthOfTextAtSize(SIGNER_NAME, 11);
    page.drawText(SIGNER_NAME, {
      x: Math.round(boxCenterX - nameW / 2),
      y: innerY - 18,
      size: 11,
      font: boldFont,
    });

    // Disclaimer (unchanged)
    const englishDisclaimer =
      "RACE FOR EDUCATION ACCESSIBILITIES FOR EVERY CHILD LIMITED is a registered charity institution in Hong Kong which is exempt from tax under Section 88 of the Hong Kong Inland Revenue Ordinance. Donations of HK$100 or above are tax deductible.";
    const disclaimerY = 120;
    page.drawText(englishDisclaimer, { x: leftMargin, y: disclaimerY - 20, size: 9, font: timesFont, maxWidth: 500 });

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const base64PDF = Buffer.from(pdfBytes).toString("base64");

    // --- Email (remarks removed) ---
    const prettyAmount = formatCurrency(amount, currency);
    const emailHtml = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#111; line-height:1.5;">
        <p>Dear ${donorName},</p>
        <p>Thank you for your generous donation to <strong>Race for Education Accessibilities</strong>. Your official receipt is attached to this email for your records.</p>

        <table style="border-collapse:collapse;margin:16px 0;">
          <tr>
            <td style="padding:6px 12px;border:1px solid #e5e7eb;"><strong>Receipt ID</strong></td>
            <td style="padding:6px 12px;border:1px solid #e5e7eb;">${id}</td>
          </tr>
          <tr>
            <td style="padding:6px 12px;border:1px solid #e5e7eb;"><strong>Date</strong></td>
            <td style="padding:6px 12px;border:1px solid #e5e7eb;">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding:6px 12px;border:1px solid #e5e7eb;"><strong>Amount</strong></td>
            <td style="padding:6px 12px;border:1px solid #e5e7eb;">${prettyAmount}</td>
          </tr>
          ${providerTxn ? `
          <tr>
            <td style="padding:6px 12px;border:1px solid #e5e7eb;"><strong>Transaction Ref</strong></td>
            <td style="padding:6px 12px;border:1px solid #e5e7eb;">${providerTxn}</td>
          </tr>` : ``}
        </table>

        <p style="color:#374151;font-size:13px;margin-top:16px;">${englishDisclaimer}</p>

        <p style="margin-top:20px;">With gratitude,<br/>Race for Education Accessibilities</p>
      </div>
    `;

    const emailText =
`Dear ${donorName},

Thank you for your generous donation to Race for Education Accessibilities.
Your official receipt is attached.

Receipt ID: ${id}
Date: ${dateStr}
Amount: ${prettyAmount}
${providerTxn ? `Transaction Ref: ${providerTxn}\n` : ``}

${englishDisclaimer}

With gratitude,
Race for Education Accessibilities`;

    const request = mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: { Email: "feliciahmq.work@gmail.com", Name: "Race for Education Accessibilities" },
          To: [{ Email: email }],
          Subject: `Your Donation Receipt — ${id}`,
          HTMLPart: emailHtml,
          TextPart: emailText,
          Attachments: [{
            ContentType: "application/pdf",
            Filename: `Receipt-${id}.pdf`,
            Base64Content: base64PDF
          }],
        },
      ],
    });

    const result = await request;
    return NextResponse.json({ message: "Receipt PDF sent", result: result?.body ?? null });
  } catch (err: any) {
    console.error("Route error:", err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
