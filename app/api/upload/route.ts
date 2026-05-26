import { NextResponse } from "next/server";

/** Файлы больше не проходят через Vercel — только /api/upload/sign + прямая загрузка в Supabase. */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Загрузка через сервер отключена. Обновите страницу (Ctrl+F5) — файлы отправляются напрямую в хранилище.",
    },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
