"use client";

import { usePathname } from "next/navigation";
import { GlobalSearch } from "@/components/global-search";

/** Страницы со своим полем поиска в списке — без дубля сверху. */
const HIDE_GLOBAL_SEARCH = new Set(["/orders", "/clients", "/leads", "/archive"]);

export function ConditionalGlobalSearch() {
  const pathname = usePathname();
  if (HIDE_GLOBAL_SEARCH.has(pathname)) return null;

  return (
    <div className="hidden md:block">
      <GlobalSearch />
    </div>
  );
}
