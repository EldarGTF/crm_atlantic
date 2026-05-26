import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  UPLOAD_BUCKET,
  MAX_UPLOAD_BYTES,
  buildUploadPath,
} from "@/lib/upload-policy";

const SignSchema = z.object({
  folder: z.string().min(1),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  contentType: z.string().max(128).optional().default(""),
});

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Хранилище не настроено (Supabase)" }, { status: 503 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, active: true },
  });
  if (!user?.active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = SignSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные данные файла" }, { status: 400 });
  }

  const { folder, fileName, fileSize, contentType } = parsed.data;

  if (fileSize > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Файл больше 20 МБ" }, { status: 400 });
  }

  const built = buildUploadPath(user.id, folder, fileName, contentType);
  if ("error" in built) {
    return NextResponse.json({ error: built.error }, { status: 400 });
  }

  const supabase = createClient(url, serviceKey);
  const { data, error } = await supabase.storage
    .from(UPLOAD_BUCKET)
    .createSignedUploadUrl(built.path);

  if (error || !data) {
    console.error("[upload/sign]", error?.message);
    return NextResponse.json({ error: error?.message ?? "Не удалось подготовить загрузку" }, { status: 500 });
  }

  const { data: publicData } = supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(built.path);

  return NextResponse.json({
    path: data.path,
    token: data.token,
    signedUrl: data.signedUrl,
    publicUrl: publicData.publicUrl,
    contentType: built.mime,
    name: fileName,
    size: fileSize,
  });
}
