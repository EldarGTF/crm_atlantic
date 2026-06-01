/**
 * Восстанавливает метки после ошибочного патча {PLACEHOLDER}.
 * node scripts/repair-contract-template.mjs
 */
import fs from "fs";
import path from "path";
import PizZip from "pizzip";

const templatePath = path.join(process.cwd(), "templates/contracts/atlantic-subcontract.docx");

const PLACEHOLDER_ORDER = [
  "contract_no",
  "client_name",
  "client_iin",
  "client_residence_address",
  "installation_address",
  "client_name",
  "client_iin",
  "client_residence_address",
  "client_phone",
  "contract_no",
  "contract_date_short",
  "work_no",
  "work_name",
  "work_unit",
  "work_qty",
  "work_unit_price",
  "work_sum",
  "work_deadline",
  "work_payment_terms",
  "work_warranty",
];

function mergeSplitTags(xml) {
  let prev = "";
  let out = xml;
  const re =
    /<w:t>\{<\/w:t><\/w:r>(?:<w:proofErr[^/]*\/>)?<w:r[^>]*>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?<w:t>([^<]+)<\/w:t><\/w:r>(?:<w:proofErr[^/]*\/>)?<w:r[^>]*>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?<w:t>\}<\/w:t>/g;
  while (out !== prev) {
    prev = out;
    out = out.replace(re, "<w:t>{$1}</w:t>");
  }
  return out;
}

function restorePlaceholders(xml) {
  let doc = xml;
  for (const tag of PLACEHOLDER_ORDER) {
    if (!doc.includes("{PLACEHOLDER}")) break;
    doc = doc.replace("{PLACEHOLDER}", `{${tag}}`);
  }
  if (doc.includes("{PLACEHOLDER}")) {
    console.warn("Остались {PLACEHOLDER}:", (doc.match(/\{PLACEHOLDER\}/g) || []).length);
  }
  if (!doc.includes("{#work_items}")) {
    doc = doc.replace("{work_no}", "{#work_items}{work_no}");
    doc = doc.replace("{work_warranty}", "{work_warranty}{/work_items}");
  }
  return doc;
}

const buf = fs.readFileSync(templatePath);
const zip = new PizZip(buf);
let xml = zip.file("word/document.xml").asText();
xml = mergeSplitTags(xml);
xml = restorePlaceholders(xml);
zip.file("word/document.xml", xml);
fs.writeFileSync(templatePath, zip.generate({ type: "nodebuffer", compression: "DEFLATE" }));

const text = xml.replace(/<[^>]+>/g, "");
const tags = [...text.matchAll(/\{[^}]+\}/g)].map((m) => m[0]);
console.log("OK:", templatePath);
console.log([...new Set(tags)].sort().join(", "));
