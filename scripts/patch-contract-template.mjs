/**
 * Патч шаблона: цикл {#work_items} и склейка разорванных {placeholder}.
 * Запуск: node scripts/patch-contract-template.mjs
 */
import fs from "fs";
import path from "path";
import PizZip from "pizzip";

const templatePath = path.join(process.cwd(), "templates/contracts/atlantic-subcontract.docx");

function mergeBrokenPlaceholders(xml) {
  let prev = "";
  let out = xml;
  const re =
    /<w:t[^>]*>\{<\/w:t><\/w:r>(?:<w:proofErr[^/]*\/>)?(?:<w:r[^>]*>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?<w:t[^>]*>([^<]*)<\/w:t><\/w:r>)+(?:<w:proofErr[^/]*\/>)?<w:r[^>]*>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?<w:t[^>]*>\}<\/w:t>/g;
  while (out !== prev) {
    prev = out;
    out = out.replace(re, () => `<w:t>{PLACEHOLDER}</w:t>`);
  }
  // second pass with names - simpler iterative
  prev = "";
  while (out !== prev) {
    prev = out;
    out = out.replace(
      /<w:t>\{<\/w:t><\/w:r><w:proofErr w:type="spellStart"\/><w:r[^>]*><w:rPr>[\s\S]*?<\/w:rPr><w:t>([^<]+)<\/w:t><\/w:r><w:proofErr w:type="spellEnd"\/><w:r[^>]*><w:rPr>[\s\S]*?<\/w:rPr><w:t>\}<\/w:t>/g,
      "<w:t>{$1}</w:t>",
    );
  }
  return out;
}

function patch(xml) {
  let doc = mergeBrokenPlaceholders(xml);
  if (!doc.includes("{#work_items}")) {
    doc = doc.replace("{work_no}", "{#work_items}{work_no}");
    doc = doc.replace("{work_warranty}", "{work_warranty}{/work_items}");
  }
  return doc;
}

const buf = fs.readFileSync(templatePath);
const zip = new PizZip(buf);
const file = zip.file("word/document.xml");
if (!file) throw new Error("word/document.xml not found");
const xml = patch(file.asText());
zip.file("word/document.xml", xml);
fs.writeFileSync(templatePath, zip.generate({ type: "nodebuffer", compression: "DEFLATE" }));
console.log("Patched:", templatePath);
