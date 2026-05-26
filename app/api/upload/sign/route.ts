import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MAX_UPLOAD_BYTES, buildUploadPath } from "@/lib/upload-policy";
import { createUploadSignature } from "@/lib/storage-server";

const SignSchema = z.object({
  folder: z.string().min(1),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  contentType: z.string().max(128).optional().default(""),
});

export async function POST(req: NextRequest) {
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

  const signed = await createUploadSignature(built.path, built.mime);
  if ("error" in signed) {
    return NextResponse.json({ error: signed.error }, { status: 500 });
  }

  return NextResponse.json({
    provider: signed.provider,
    path: signed.path,
    token: signed.token,
    signedUrl: signed.signedUrl,
    publicUrl: signed.publicUrl,
    contentType: signed.contentType,
    name: fileName,
    size: fileSize,
  });
}
