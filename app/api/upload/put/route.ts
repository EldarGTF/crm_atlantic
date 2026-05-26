import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-policy";
import { getS3PublicUrl, putObjectToS3, useServerS3Upload } from "@/lib/storage-server";

export async function POST(req: NextRequest) {
  if (!useServerS3Upload()) {
    return NextResponse.json({ error: "Not enabled" }, { status: 404 });
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

  const form = await req.formData();
  const file = form.get("file");
  const path = form.get("path");
  const contentType = (form.get("contentType") as string) || "application/octet-stream";

  if (!(file instanceof File) || typeof path !== "string" || !path) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Файл больше 20 МБ" }, { status: 400 });
  }

  if (!path.includes(user.id)) {
    return NextResponse.json({ error: "Недопустимый путь" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await putObjectToS3(path, buffer, contentType || file.type);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    publicUrl: getS3PublicUrl(path),
    path,
    size: file.size,
  });
}
