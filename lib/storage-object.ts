import "server-only";

import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { UPLOAD_BUCKET } from "@/lib/upload-policy";

function useS3Storage(): boolean {
  return Boolean(
    process.env.S3_ENDPOINT &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY &&
      process.env.S3_PUBLIC_URL
  );
}

/** Ключ объекта в bucket из публичного URL (/files/...). */
export function objectKeyFromPublicUrl(url: string): string | null {
  const base = process.env.S3_PUBLIC_URL?.replace(/\/$/, "");
  if (!base || !url.startsWith(`${base}/`)) return null;
  return url.slice(base.length + 1);
}

async function deleteFromS3(key: string): Promise<void> {
  const { S3Client } = await import("@aws-sdk/client-s3");
  const client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });
  const bucket = process.env.S3_BUCKET ?? UPLOAD_BUCKET;
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

async function deleteFromSupabase(path: string): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  const supabase = createClient(url, key);
  await supabase.storage.from(UPLOAD_BUCKET).remove([path]);
}

/** Удалить файл из хранилища по URL (игнорирует ошибки, если объект уже удалён). */
export async function deleteStoredFileByUrl(fileUrl: string): Promise<void> {
  try {
    const s3Key = objectKeyFromPublicUrl(fileUrl);
    if (s3Key && useS3Storage()) {
      await deleteFromS3(s3Key);
      return;
    }
    const supabaseBase = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseBase && fileUrl.includes("/storage/v1/object/public/")) {
      const marker = `/storage/v1/object/public/${UPLOAD_BUCKET}/`;
      const idx = fileUrl.indexOf(marker);
      if (idx >= 0) {
        const path = fileUrl.slice(idx + marker.length);
        await deleteFromSupabase(path);
      }
    }
  } catch (e) {
    console.error("[storage/delete]", e);
  }
}
