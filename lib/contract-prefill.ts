import type { ContractPayload } from "@/lib/contract-types";
import { DEFAULT_WORK_ITEM } from "@/lib/contract-types";

type OrderForContract = {
  number: number;
  lead: {
    client: {
      name: string;
      phone: string;
      address: string | null;
    };
    measurements: { address: string }[];
  };
  installation: { address: string } | null;
};

export function getInstallationAddress(order: OrderForContract): string {
  return (
    order.installation?.address ??
    order.lead.measurements[0]?.address ??
    order.lead.client.address ??
    ""
  );
}

export function buildContractPrefill(order: OrderForContract): ContractPayload {
  const residence = order.lead.client.address ?? "";
  return {
    contract_date: new Date().toISOString().slice(0, 10),
    client_name: order.lead.client.name,
    client_iin: "",
    client_residence_address: residence,
    installation_address: getInstallationAddress(order),
    client_phone: order.lead.client.phone,
    work_items: [{ ...DEFAULT_WORK_ITEM }],
  };
}
