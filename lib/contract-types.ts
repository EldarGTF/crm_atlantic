import { z } from "zod";

export const ContractWorkItemSchema = z.object({
  work_name: z.string().min(1, "Укажите наименование"),
  work_unit: z.string().min(1, "Укажите ед. изм."),
  work_qty: z.string().min(1, "Укажите количество"),
  work_unit_price: z.string().min(1, "Укажите цену"),
  work_sum: z.string().optional(),
  work_deadline: z.string().min(1, "Укажите срок"),
  work_payment_terms: z.string().min(1, "Укажите условие оплаты"),
  work_warranty: z.string().min(1, "Укажите гарантию"),
});

export const ContractPayloadSchema = z.object({
  contract_date: z.string().optional(),
  client_name: z.string().min(2),
  client_iin: z.string().min(1, "Укажите ИИН"),
  client_residence_address: z.string().min(1, "Укажите адрес проживания"),
  installation_address: z.string().min(1, "Укажите адрес монтажа"),
  client_phone: z.string().min(6),
  work_items: z.array(ContractWorkItemSchema).min(1, "Добавьте хотя бы одну строку"),
});

export type ContractPayload = z.infer<typeof ContractPayloadSchema>;
export type ContractWorkItem = z.infer<typeof ContractWorkItemSchema>;

export const DEFAULT_WORK_ITEM: ContractWorkItem = {
  work_name: "",
  work_unit: "Шт",
  work_qty: "1",
  work_unit_price: "",
  work_sum: "",
  work_deadline: "От 10 до 30 рабочих дней",
  work_payment_terms:
    "100% оплата в течение 1 рабочего дня с момента подписания настоящего договора",
  work_warranty: "1 год",
};

export const CONTRACT_DRAFT_KEY = (orderId: string) => `crm-contract-draft-${orderId}`;
