"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { globalSearch } from "@/app/actions/search";

export function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Awaited<ReturnType<typeof globalSearch>> | null>(null);
  const [pending, startTransition] = useTransition();

  function runSearch(value: string) {
    setQ(value);
    if (value.trim().length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }
    startTransition(async () => {
      const data = await globalSearch(value);
      setResults(data);
      setOpen(true);
    });
  }

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <Input
        value={q}
        onChange={(e) => runSearch(e.target.value)}
        onFocus={() => q.length >= 2 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder="Поиск: клиент, телефон, № заказа..."
        className="pl-9 h-9 bg-white border-slate-200"
      />
      {open && results && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {pending && <p className="p-3 text-sm text-slate-500">Поиск...</p>}
          {!pending &&
            results.clients.length === 0 &&
            results.leads.length === 0 &&
            results.orders.length === 0 && (
              <p className="p-3 text-sm text-slate-500">Ничего не найдено</p>
            )}
          {results.orders.length > 0 && (
            <Section title="Заказы">
              {results.orders.map((r) => (
                <ResultRow
                  key={r.id}
                  title={r.title}
                  subtitle={r.subtitle}
                  onPick={() => {
                    router.push(r.href);
                    setOpen(false);
                  }}
                />
              ))}
            </Section>
          )}
          {results.leads.length > 0 && (
            <Section title="Заявки">
              {results.leads.map((r) => (
                <ResultRow
                  key={r.id}
                  title={r.title}
                  subtitle={r.subtitle}
                  onPick={() => {
                    router.push(r.href);
                    setOpen(false);
                  }}
                />
              ))}
            </Section>
          )}
          {results.clients.length > 0 && (
            <Section title="Клиенты">
              {results.clients.map((r) => (
                <ResultRow
                  key={r.id}
                  title={r.name}
                  subtitle={r.phone}
                  onPick={() => {
                    router.push(r.href);
                    setOpen(false);
                  }}
                />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 last:border-0">
      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase text-slate-400">{title}</div>
      {children}
    </div>
  );
}

function ResultRow({
  title,
  subtitle,
  onPick,
}: {
  title: string;
  subtitle: string;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPick}
    >
      <div className="text-sm font-medium text-slate-900">{title}</div>
      <div className="text-xs text-slate-500">{subtitle}</div>
    </button>
  );
}
