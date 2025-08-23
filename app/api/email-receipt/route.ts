// app/api/receipt/route.ts
import { NextRequest, NextResponse } from "next/server";
import Mailjet from "node-mailjet";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const mailjet = Mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC!,
  process.env.MJ_APIKEY_PRIVATE!
);

/**
 * Simple word-wrap helper: splits `text` into lines so each line's width <= maxWidth.
 */
function wrapText(font: any, text: string, fontSize: number, maxWidth: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split(/\r?\n/);
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = font.widthOfTextAtSize(`${currentLine} ${word}`, fontSize);
      if (width <= maxWidth) {
        currentLine = `${currentLine} ${word}`;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
  }
  return lines;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Required fields
    const id: string | undefined = body.id;
    const email: string | undefined = body.email;
    const amount: number | undefined = body.amount;
    const created_at: string | undefined = body.created_at;

    // Optional fields
    const currency: string = body.currency ?? "HKD";
    const providerTxn: string | undefined = body.providerTxn ?? null;
    const remarks: string = (body.remarks ?? "").toString();

    // SIGNER NAMES ARE DEFAULTS (NOT INPUTS)
    const signer1Name = "Vivian Chung Ming Wai";
    const signer2Name = "Tse Hiu Fung Quincy";

    if (!id || !email || amount === undefined || !created_at) {
      return NextResponse.json({ error: "Missing required fields. Required: receiptId, email, amountCents, dateIso" }, { status: 400 });
    }

    // --- PDF creation ---
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const fontSize = 11;
    const lineHeight = 16;
    const leftMargin = 50;

    const dateStr = new Date(created_at).toLocaleDateString();

    // Header block
    let y = 800;
    page.drawText("Race for Education Accessibilities for Every Child Limited (1704213)", {
      x: leftMargin,
      y,
      size: 10,
      font: timesFont,
    });
    y -= lineHeight;
    page.drawText("902, 168 Queen’s Road Central, Central, Hong Kong", { x: leftMargin, y, size: 10, font: timesFont });
    y -= lineHeight;
    page.drawText("T: 3100-0135   F: 3100-0134   E: committee@reach.org.hk", { x: leftMargin, y, size: 10, font: timesFont });

    // Title centered
    page.drawText("Receipt", { x: 270, y: 720, size: 14, font: boldFont });

    // Details two columns
    y = 690;
    page.drawText(`Date: ${dateStr}`, { x: leftMargin, y, size: fontSize, font: timesFont });
    page.drawText(`Receipt number: ${id}`, { x: 350, y, size: fontSize, font: timesFont });
    y -= lineHeight;
    page.drawText(`Donation received from: ${email}`, { x: leftMargin, y, size: fontSize, font: timesFont });
    y -= lineHeight;
    page.drawText(`Amount received: ${amount} ${currency}`, { x: leftMargin, y, size: fontSize, font: timesFont });
    page.drawText(`Payment method: ${providerTxn ? "Online" : "N/A"}`, { x: 350, y, size: fontSize, font: timesFont });

    // Remarks box
    y -= 50;
    const boxX = leftMargin;
    const boxTopY = y;
    const boxWidth = 500;
    const boxHeight = 80;
    const boxPadding = 8;
    page.drawRectangle({
      x: boxX,
      y: boxTopY - boxHeight,
      width: boxWidth,
      height: boxHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });
    page.drawText("Remarks:", { x: boxX + 5, y: boxTopY - 12, size: fontSize, font: timesFont });

    if (remarks && remarks.trim().length > 0) {
      const remarksFontSize = 10;
      const remarksMaxWidth = boxWidth - boxPadding * 2;
      const wrapped = wrapText(timesFont, remarks, remarksFontSize, remarksMaxWidth);
      let ry = boxTopY - 24; // start under label
      for (const line of wrapped) {
        if (ry < boxTopY - boxHeight + boxPadding) break;
        page.drawText(line, { x: boxX + boxPadding, y: ry, size: remarksFontSize, font: timesFont });
        ry -= remarksFontSize + 3;
      }
    }

    // Signatures (names are defaults)
    const sigStartY = boxTopY - boxHeight - 80;
    page.drawText("Signature:", { x: leftMargin, y: sigStartY, size: fontSize, font: timesFont });

    const sigY = sigStartY - 40;
    // left signature
    const leftSigStartX = leftMargin;
    const leftSigEndX = 200;
    page.drawLine({ start: { x: leftSigStartX, y: sigY }, end: { x: leftSigEndX, y: sigY }, thickness: 0.5, color: rgb(0, 0, 0) });
    page.drawText(signer1Name, { x: leftSigStartX, y: sigY - 18, size: 11, font: boldFont });

    // right signature
    const rightSigStartX = 380;
    const rightSigEndX = 530;
    page.drawLine({ start: { x: rightSigStartX, y: sigY }, end: { x: rightSigEndX, y: sigY }, thickness: 0.5, color: rgb(0, 0, 0) });
    page.drawText(signer2Name, { x: rightSigStartX, y: sigY - 18, size: 11, font: boldFont });

    // English disclaimer
    const englishDisclaimer =
      "RACE FOR EDUCATION ACCESSIBILITIES FOR EVERY CHILD LIMITED is a registered charity institution in Hong Kong which is exempt from tax under Section 88 of the Hong Kong Inland Revenue Ordinance. Donations of HK$100 or above are tax deductible.";
    const disclaimerY = 120;
    page.drawText(englishDisclaimer, { x: leftMargin, y: disclaimerY - 20, size: 9, font: timesFont, maxWidth: 500 });

    // Save PDF & send email
    const pdfBytes = await pdfDoc.save();
    const base64PDF = Buffer.from(pdfBytes).toString("base64");

    const htmlParts: string[] = [
      `<p>Dear donor,</p>`,
      `<p>Thank you for your donation. Your receipt is attached.</p>`
    ];
    if (remarks && remarks.trim().length > 0) {
      htmlParts.push(`<p><strong>Remarks:</strong> ${remarks}</p>`);
    }
    htmlParts.push(`<p>${englishDisclaimer}</p>`);
    htmlParts.push(`<p>Receipt ID: ${id}</p>`);

    const request = mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: { Email: "klown.kat01@gmail.com", Name: "Race for Education Accessibilities" },
          To: [{ Email: email }],
          Subject: `Your Donation Receipt: ${id}`,
          HTMLPart: htmlParts.join("\n"),
          TextPart: `Thank you for your donation! Receipt: ${id}\n\n${englishDisclaimer}`,
          Attachments: [{ ContentType: "application/pdf", Filename: `Receipt-${id}.pdf`, Base64Content: base64PDF }],
        },
      ],
    });

    const result = await request;
    return NextResponse.json({
      message: "Receipt PDF sent",
      result: result?.body ?? null,
    });
  } catch (err: any) {
    console.error("Route error:", err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
