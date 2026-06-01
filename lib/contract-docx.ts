import "server-only";

import fs from "fs";
import path from "path";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import {
  calcWorkSum,
  formatContractDateLong,
  formatContractDateShort,
  formatContractNo,
  formatMoneyDisplay,
} from "@/lib/contract-format";
import type { ContractPayload } from "@/lib/contract-types";

const TEMPLATE_PATH = path.join(process.cwd(), "templates/contracts/atlantic-subcontract.docx");

function mergeBrokenPlaceholders(xml: string): string {
  let prev = "";
  let out = xml;
  const re =
    /<w:t[^>]*>\{<\/w:t><\/w:r>(?:<w:proofErr[^/]*\/>)?(?:<w:r[^>]*>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?<w:t[^>]*>([^<]*)<\/w:t><\/w:r>)+(?:<w:proofErr[^/]*\/>)?<w:r[^>]*>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?<w:t[^>]*>\}<\/w:t>/g;
  while (out !== prev) {
    prev = out;
    out = out.replace(re, (_m, name) => `<w:t>{${name}}</w:t>`);
  }
  return out;
}

function ensureWorkItemsLoop(xml: string): string {
  if (xml.includes("{#work_items}")) return xml;
  return xml
    .replace("{work_no}", "{#work_items}{work_no}")
    .replace("{work_warranty}", "{work_warranty}{/work_items}");
}

function loadTemplateZip(): PizZip {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(`Шаблон договора не найден: ${TEMPLATE_PATH}`);
  }
  const buf = fs.readFileSync(TEMPLATE_PATH);
  const zip = new PizZip(buf);
  const docFile = zip.file("word/document.xml");
  if (!docFile) throw new Error("Повреждённый шаблон: нет word/document.xml");
  let xml = docFile.asText();
  xml = mergeBrokenPlaceholders(ensureWorkItemsLoop(xml));
  zip.file("word/document.xml", xml);
  return zip;
}

export function buildContractTemplateData(
  orderNumber: number,
  payload: ContractPayload,
): Record<string, unknown> {
  const date = payload.contract_date ? new Date(payload.contract_date) : new Date();
  const work_items = payload.work_items.map((row, index) => {
    const sum = row.work_sum?.trim() || calcWorkSum(row.work_qty, row.work_unit_price);
    return {
      work_no: String(index + 1),
      work_name: row.work_name,
      work_unit: row.work_unit,
      work_qty: row.work_qty,
      work_unit_price: formatMoneyDisplay(row.work_unit_price),
      work_sum: sum ? formatMoneyDisplay(sum) : "",
      work_deadline: row.work_deadline,
      work_payment_terms: row.work_payment_terms,
      work_warranty: row.work_warranty,
    };
  });

  return {
    contract_no: formatContractNo(orderNumber),
    contract_date: formatContractDateLong(date),
    contract_date_short: formatContractDateShort(date),
    client_name: payload.client_name,
    client_iin: payload.client_iin,
    client_residence_address: payload.client_residence_address,
    installation_address: payload.installation_address,
    client_phone: payload.client_phone,
    work_items,
  };
}

export function renderContractDocx(orderNumber: number, payload: ContractPayload): Buffer {
  const zip = loadTemplateZip();
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
  });

  doc.render(buildContractTemplateData(orderNumber, payload));

  return doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  }) as Buffer;
}
