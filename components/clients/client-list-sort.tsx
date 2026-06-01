"use client";

import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import {
  CLIENT_LIST_SORT_LABELS,
  CLIENT_LIST_SORTS,
  clientsListHref,
  type ClientListSort,
} from "@/lib/client-constants";

type Props = {
  sort: ClientListSort;
  q?: string;
  temperature?: string;
};

export function ClientListSortSelect({ sort, q, temperature }: Props) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="client-sort" className="text-sm text-slate-600 shrink-0">
        Сортировка
      </Label>
      <select
        id="client-sort"
        value={sort}
        onChange={(e) => {
          const next = e.target.value as ClientListSort;
          router.push(
            clientsListHref({
              q,
              temperature,
              sort: next === "created_desc" ? undefined : next,
            }),
          );
        }}
        className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-700"
      >
        {CLIENT_LIST_SORTS.map((value) => (
          <option key={value} value={value}>
            {CLIENT_LIST_SORT_LABELS[value]}
          </option>
        ))}
      </select>
    </div>
  );
}
