// app/api/receipt/route.ts
import { NextRequest, NextResponse } from "next/server";
import Mailjet from "node-mailjet";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";

const mailjet = Mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC!,
  process.env.MJ_APIKEY_PRIVATE!
);

const SIGNATURE1_URL = "https://cakeofcewflckuwvttgu.supabase.co/storage/v1/object/sign/assets/john_sign.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82NGE1MjRjYS03NjdiLTQ5MTItYjIxMy0xZDQ0YzliY2Q5OWQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhc3NldHMvam9obl9zaWduLnBuZyIsImlhdCI6MTc1NjAyMjAzMywiZXhwIjoyMDcxMzgyMDMzfQ.SPS-KrHF5K7Mq29fnpT6cIh4YJyUuXei3MfS-8SIhl4"
const SIGNATURE2_URL = "https://cakeofcewflckuwvttgu.supabase.co/storage/v1/object/sign/assets/jane_sign.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82NGE1MjRjYS03NjdiLTQ5MTItYjIxMy0xZDQ0YzliY2Q5OWQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhc3NldHMvamFuZV9zaWduLnBuZyIsImlhdCI6MTc1NjAyMjAyMCwiZXhwIjoyMDcxMzgyMDIwfQ.cohbiAwm7IPL10yHwKnHy-duqhgBZLZXFpzMfOxOVxU"

// Simple word-wrap
function wrapText(font: any, text: string, fontSize: number, maxWidth: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split(/\r?\n/);
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    if (words.length === 0) { lines.push(""); continue; }
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = font.widthOfTextAtSize(`${currentLine} ${word}`, fontSize);
      if (width <= maxWidth) currentLine = `${currentLine} ${word}`;
      else { lines.push(currentLine); currentLine = word; }
    }
    lines.push(currentLine);
  }
  return lines;
}

function formatCurrency(amount: number, currency = "HKD") {
  try {
    return new Intl.NumberFormat("en-HK", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const remarksOverride: string | undefined = body.remarks;
    const donationId: number | undefined = body.donationId;
    if (!donationId) {
      return NextResponse.json({ error: "Missing donationId" }, { status: 400 });
    }

    const supabase = await createClient();

    // Pull donation row
    const { data: donation, error: donationErr } = await supabase
      .from("donations")
      .select(`
        id,
        donor_id,
        amount,
        created_at,
        remarks,
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
    const { data: user, error: userErr } = await supabase
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
    const remarks: string = (remarksOverride ?? donation.remarks ?? "").toString();

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

    // Header block
    let y = 800;
    page.drawText("Race for Education Accessibilities for Every Child Limited (1704213)", {
      x: leftMargin, y, size: 10, font: timesFont,
    });
    y -= lineHeight;
    page.drawText("902, 168 Queen’s Road Central, Central, Hong Kong", { x: leftMargin, y, size: 10, font: timesFont });
    y -= lineHeight;
    page.drawText("T: 3100-0135   F: 3100-0134   E: committee@reach.org.hk", { x: leftMargin, y, size: 10, font: timesFont });

    // Title centered
    page.drawText("Receipt", { x: 270, y: 720, size: 14, font: boldFont });

    // Details
    y = 690;
    page.drawText(`Date: ${dateStr}`, { x: leftMargin, y, size: fontSize, font: timesFont });
    page.drawText(`Receipt number: ${id}`, { x: 350, y, size: fontSize, font: timesFont });
    y -= lineHeight;
    page.drawText(`Donation received from: ${donorName} <${email}>`, { x: leftMargin, y, size: fontSize, font: timesFont });
    y -= lineHeight;
    page.drawText(`Amount received: ${formatCurrency(amount, currency)}`, { x: leftMargin, y, size: fontSize, font: timesFont });
    page.drawText(`Payment method: ${donation.payment_method ?? (providerTxn ? "Online" : "N/A")}`, {
      x: 350, y, size: fontSize, font: timesFont
    });

    // Remarks box
    y -= 50;
    const boxX = leftMargin;
    const boxTopY = y;
    const boxWidth = 500;
    const boxHeight = 80;
    const boxPadding = 8;
    page.drawRectangle({
      x: boxX, y: boxTopY - boxHeight, width: boxWidth, height: boxHeight,
      borderColor: rgb(0, 0, 0), borderWidth: 1,
    });
    page.drawText("Remarks:", { x: boxX + 5, y: boxTopY - 12, size: fontSize, font: timesFont });

    if (remarks && remarks.trim().length > 0) {
      const remarksFontSize = 10;
      const remarksMaxWidth = boxWidth - boxPadding * 2;
      const wrapped = wrapText(timesFont, remarks, remarksFontSize, remarksMaxWidth);
      let ry = boxTopY - 24;
      for (const line of wrapped) {
        if (ry < boxTopY - boxHeight + boxPadding) break;
        page.drawText(line, { x: boxX + boxPadding, y: ry, size: remarksFontSize, font: timesFont });
        ry -= remarksFontSize + 3;
      }
    }

    // --- Signatures (with optional images) ---
    const signer1Name = "John Doe";
    const signer2Name = "Jane Doe";
    const sigStartY = boxTopY - boxHeight - 90;

    page.drawText("Signature:", { x: leftMargin, y: sigStartY + 30, size: fontSize, font: timesFont });

    const leftSigLineY = sigStartY;
    const rightSigLineY = sigStartY;

    // Draw lines
    page.drawLine({ start: { x: leftMargin, y: leftSigLineY }, end: { x: 240, y: leftSigLineY }, thickness: 0.5, color: rgb(0, 0, 0) });
    page.drawLine({ start: { x: 355, y: rightSigLineY }, end: { x: 530, y: rightSigLineY }, thickness: 0.5, color: rgb(0, 0, 0) });

    // Try embedding images above the lines
    let usedLeftImage = false;
    let usedRightImage = false;

    try {
      if (SIGNATURE1_URL) {
        const res = await fetch(SIGNATURE1_URL);
        if (res.ok) {
          const arr = new Uint8Array(await res.arrayBuffer());
          const isPng = SIGNATURE1_URL.toLowerCase().endsWith(".png");
          const sig1 = isPng ? await pdfDoc.embedPng(arr) : await pdfDoc.embedJpg(arr);
          const w = 140, h = (sig1.height / sig1.width) * w;
          page.drawImage(sig1, { x: leftMargin, y: leftSigLineY + 8, width: w, height: h });
          usedLeftImage = true;
        }
      }
    } catch {}

    try {
      if (SIGNATURE2_URL) {
        const res = await fetch(SIGNATURE2_URL);
        if (res.ok) {
          const arr = new Uint8Array(await res.arrayBuffer());
          const isPng = SIGNATURE2_URL.toLowerCase().endsWith(".png");
          const sig2 = isPng ? await pdfDoc.embedPng(arr) : await pdfDoc.embedJpg(arr);
          const w = 140, h = (sig2.height / sig2.width) * w;
          page.drawImage(sig2, { x: 355, y: rightSigLineY + 8, width: w, height: h });
          usedRightImage = true;
        }
      }
    } catch {}

    // Names under lines
    page.drawText(signer1Name, { x: leftMargin, y: leftSigLineY - 18, size: 11, font: boldFont });
    page.drawText(signer2Name, { x: 355, y: rightSigLineY - 18, size: 11, font: boldFont });

    // If images not available, show "/s/ Name" above the lines to mimic a signed mark
    if (!usedLeftImage) {
      page.drawText("/s/ " + signer1Name, { x: leftMargin, y: leftSigLineY + 8, size: 10, font: timesFont });
    }
    if (!usedRightImage) {
      page.drawText("/s/ " + signer2Name, { x: 355, y: rightSigLineY + 8, size: 10, font: timesFont });
    }

    // Disclaimer
    const englishDisclaimer =
      "RACE FOR EDUCATION ACCESSIBILITIES FOR EVERY CHILD LIMITED is a registered charity institution in Hong Kong which is exempt from tax under Section 88 of the Hong Kong Inland Revenue Ordinance. Donations of HK$100 or above are tax deductible.";
    const disclaimerY = 120;
    page.drawText(englishDisclaimer, { x: leftMargin, y: disclaimerY - 20, size: 9, font: timesFont, maxWidth: 500 });

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const base64PDF = Buffer.from(pdfBytes).toString("base64");

    // --- Email (improved HTML) ---
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

        ${remarks?.trim() ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ""}

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
${remarks?.trim() ? `Remarks: ${remarks}\n` : ``}

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
