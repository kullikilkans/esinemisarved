import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, degrees, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatDate } from "@/lib/dates";
import { formatEur, formatRate } from "@/lib/money";

// Everything the PDF needs, taken from the invoice row and its snapshot fields
export type InvoicePdfData = {
  number: string;
  invoiceDate: string;
  dueDate: string;
  performanceDate: string;
  description: string;
  amountNet: string;
  vatRate: string;
  vatAmount: string;
  amountTotal: string;
  seller: {
    name: string;
    regCode: string;
    vatNumber: string | null;
    address: string;
    iban: string;
    bank: string;
    email: string;
  };
  buyer: { name: string; regCode: string | null; address: string | null; email: string | null };
};

// Inter covers Estonian letters (õ ä ö ü š ž); the standard PDF fonts do not.
let fontBytes: Promise<[Buffer, Buffer]> | null = null;
function loadFonts() {
  const dir = path.join(process.cwd(), "assets", "fonts");
  fontBytes ??= Promise.all([
    readFile(path.join(dir, "Inter_400Regular.ttf")),
    readFile(path.join(dir, "Inter_600SemiBold.ttf")),
  ]);
  return fontBytes;
}

const INK = rgb(0.06, 0.09, 0.16); // slate-900
const MUTED = rgb(0.39, 0.45, 0.55); // slate-500
const LINE = rgb(0.89, 0.91, 0.94); // slate-200
const TEAL = rgb(0.06, 0.46, 0.43); // teal-700

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 50;
const CONTENT_W = PAGE_W - 2 * MARGIN;

// Intl uses narrow no-break spaces; plain spaces measure predictably
function clean(text: string): string {
  return text.replace(/[  ]/g, " ");
}

function money(value: string): string {
  return clean(formatEur(value));
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of clean(text).split(/\r?\n/)) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !line) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

export async function buildInvoicePdf(inv: InvoicePdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`Arve ${inv.number}`);
  doc.setAuthor(inv.seller.name);
  doc.setLanguage("et-EE");

  const [regularBytes, boldBytes] = await loadFonts();
  const regular = await doc.embedFont(regularBytes, { subset: false });
  const bold = await doc.embedFont(boldBytes, { subset: false });
  const page = doc.addPage([PAGE_W, PAGE_H]);

  const text = (
    p: PDFPage,
    value: string,
    x: number,
    y: number,
    opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; align?: "left" | "right" } = {},
  ) => {
    const font = opts.font ?? regular;
    const size = opts.size ?? 10;
    const v = clean(value);
    const dx = opts.align === "right" ? font.widthOfTextAtSize(v, size) : 0;
    p.drawText(v, { x: x - dx, y, size, font, color: opts.color ?? INK });
  };

  drawWatermark(page, bold);

  // Header: seller name on the left, invoice title and number on the right
  let y = PAGE_H - MARGIN - 10;
  text(page, inv.seller.name, MARGIN, y, { font: bold, size: 16 });
  text(page, "ARVE", PAGE_W - MARGIN, y, { font: bold, size: 22, color: TEAL, align: "right" });
  y -= 22;
  text(page, `Nr ${inv.number}`, PAGE_W - MARGIN, y, { font: bold, size: 12, align: "right" });

  // Seller details
  const sellerLines = [
    `Registrikood ${inv.seller.regCode}`,
    inv.seller.vatNumber ? `KMKR nr ${inv.seller.vatNumber}` : null,
    inv.seller.address,
    inv.seller.email,
  ].filter((l): l is string => !!l);
  for (const line of sellerLines) {
    text(page, line, MARGIN, y, { size: 9.5, color: MUTED });
    y -= 13;
  }

  y -= 20;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: LINE });
  y -= 24;

  // Buyer on the left, dates on the right
  const colRight = MARGIN + CONTENT_W * 0.58;
  const blockTop = y;
  text(page, "MAKSJA", MARGIN, y, { font: bold, size: 8.5, color: MUTED });
  y -= 16;
  text(page, inv.buyer.name, MARGIN, y, { font: bold, size: 11 });
  y -= 15;
  const buyerLines = [
    inv.buyer.regCode ? `Registrikood ${inv.buyer.regCode}` : null,
    inv.buyer.address,
    inv.buyer.email,
  ].filter((l): l is string => !!l);
  for (const line of buyerLines) {
    for (const wrapped of wrap(line, regular, 9.5, colRight - MARGIN - 20)) {
      text(page, wrapped, MARGIN, y, { size: 9.5, color: MUTED });
      y -= 13;
    }
  }

  let ry = blockTop;
  const metaRows: [string, string][] = [
    ["Arve number", inv.number],
    ["Arve kuupäev", formatDate(inv.invoiceDate)],
    ["Maksetähtaeg", formatDate(inv.dueDate)],
    ["Esinemise kuupäev", formatDate(inv.performanceDate)],
  ];
  for (const [label, value] of metaRows) {
    text(page, label, colRight, ry, { size: 9.5, color: MUTED });
    text(page, value, PAGE_W - MARGIN, ry, { font: bold, size: 9.5, align: "right" });
    ry -= 16;
  }

  y = Math.min(y, ry) - 30;

  // Line item table
  const amountX = PAGE_W - MARGIN;
  page.drawRectangle({ x: MARGIN, y: y - 8, width: CONTENT_W, height: 24, color: rgb(0.97, 0.98, 0.99) });
  text(page, "Kirjeldus", MARGIN + 10, y, { font: bold, size: 9.5, color: MUTED });
  text(page, "Summa (km-ta)", amountX - 10, y, { font: bold, size: 9.5, color: MUTED, align: "right" });
  y -= 30;
  const descLines = wrap(inv.description, regular, 10.5, CONTENT_W * 0.7);
  text(page, money(inv.amountNet), amountX - 10, y, { size: 10.5, align: "right" });
  for (const line of descLines) {
    text(page, line, MARGIN + 10, y, { size: 10.5 });
    y -= 15;
  }
  y -= 8;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: LINE });
  y -= 22;

  // Totals
  const vatRegistered = Number(inv.vatRate) > 0;
  const labelX = MARGIN + CONTENT_W * 0.5;
  const totals: [string, string][] = [
    ["Summa käibemaksuta", money(inv.amountNet)],
    [`Käibemaks ${formatRate(inv.vatRate)}`, money(inv.vatAmount)],
  ];
  for (const [label, value] of totals) {
    text(page, label, labelX, y, { size: 10, color: MUTED });
    text(page, value, amountX - 10, y, { size: 10, align: "right" });
    y -= 18;
  }
  y -= 4;
  page.drawRectangle({ x: labelX - 10, y: y - 10, width: amountX - labelX + 10, height: 30, color: rgb(0.94, 0.99, 0.98) });
  text(page, "Tasuda kokku", labelX, y, { font: bold, size: 12 });
  text(page, money(inv.amountTotal), amountX - 10, y, { font: bold, size: 12, color: TEAL, align: "right" });
  y -= 32;

  if (!vatRegistered) {
    text(page, "Arve väljastaja ei ole käibemaksukohustuslane.", amountX - 10, y, {
      size: 9,
      color: MUTED,
      align: "right",
    });
    y -= 16;
  }

  // Payment instructions
  y -= 24;
  text(page, "MAKSEJUHEND", MARGIN, y, { font: bold, size: 8.5, color: MUTED });
  y -= 16;
  const instruction =
    `Palume tasuda ${money(inv.amountTotal)} hiljemalt ${formatDate(inv.dueDate)} ` +
    `arveldusarvele ${inv.seller.iban} (${inv.seller.bank}), saaja ${inv.seller.name}. ` +
    `Märkige makse selgitusse arve number ${inv.number}.`;
  for (const line of wrap(instruction, regular, 10, CONTENT_W)) {
    text(page, line, MARGIN, y, { size: 10 });
    y -= 14;
  }
  y -= 6;
  const payRows: [string, string][] = [
    ["Saaja", inv.seller.name],
    ["IBAN", inv.seller.iban],
    ["Pank", inv.seller.bank],
    ["Selgitus", inv.number],
  ];
  for (const [label, value] of payRows) {
    text(page, label, MARGIN, y, { size: 9.5, color: MUTED });
    text(page, value, MARGIN + 70, y, { font: bold, size: 9.5 });
    y -= 14;
  }

  // Footer
  page.drawLine({
    start: { x: MARGIN, y: MARGIN + 18 },
    end: { x: PAGE_W - MARGIN, y: MARGIN + 18 },
    thickness: 0.75,
    color: LINE,
  });
  const footer = [inv.seller.name, `Reg. kood ${inv.seller.regCode}`, inv.seller.iban, inv.seller.email].join("  ·  ");
  const footerSize = 8;
  text(page, footer, PAGE_W / 2 + regular.widthOfTextAtSize(clean(footer), footerSize) / 2, MARGIN, {
    size: footerSize,
    color: MUTED,
    align: "right",
  });

  return doc.save();
}

// Light diagonal "NÄIDISARVE" across the page (all data is fictional)
function drawWatermark(page: PDFPage, font: PDFFont) {
  const label = "NÄIDISARVE";
  const size = 96;
  const angle = 35;
  const width = font.widthOfTextAtSize(label, size);
  const rad = (angle * Math.PI) / 180;
  // Start point chosen so the text's centre lands on the page centre
  const x = PAGE_W / 2 - (Math.cos(rad) * width) / 2 + (Math.sin(rad) * size * 0.35);
  const y = PAGE_H / 2 - (Math.sin(rad) * width) / 2 - (Math.cos(rad) * size * 0.35);
  page.drawText(label, {
    x,
    y,
    size,
    font,
    color: rgb(0.06, 0.46, 0.43),
    opacity: 0.07,
    rotate: degrees(angle),
  });
}
