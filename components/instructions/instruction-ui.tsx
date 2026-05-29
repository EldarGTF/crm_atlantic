import Link from "next/link";
import type { ReactNode } from "react";

export function InstructionPage({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-[1.375rem] font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      <div className="space-y-6 text-sm text-slate-700 leading-relaxed">{children}</div>
    </div>
  );
}

export function InstructionSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card p-5 space-y-3">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export function InstructionSteps({ steps }: { steps: string[] }) {
  return (
    <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
      {steps.map((s) => (
        <li key={s}>{s}</li>
      ))}
    </ol>
  );
}

export function InstructionTip({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs bg-blue-50 border border-blue-100 text-blue-800 rounded-lg px-3 py-2">{children}</p>
  );
}

export function InstructionLinks({ links }: { links: { href: string; label: string }[] }) {
  return (
    <ul className="space-y-1">
      {links.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className="text-blue-600 hover:underline font-medium">
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
