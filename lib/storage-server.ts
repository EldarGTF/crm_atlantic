import "server-only";

import { createClient } from "@supabase/supabase-js";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { UPLOAD_BUCKET } from "@/lib/upload-policy";

export type UploadSignResult = {
  provider: "s3" | "supabase";
  signedUrl: string;
  publicUrl: string;
  path: string;
  token?: string;
  contentType: string;
};

function useS3Storage(): boolean {
  return Boolean(
    process.env.S3_ENDPOINT &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY &&
      process.env.S3_PUBLIC_URL
  );
}

function getS3Client() {
  return new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });
}

export async function createUploadSignature(
  path: string,
  contentType: string
): Promise<UploadSignResult | { error: string }> {
  const bucket = process.env.S3_BUCKET ?? UPLOAD_BUCKET;

  if (useS3Storage()) {
    try {
      const client = getS3Client();
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: path,
        ContentType: contentType,
      });
      const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
      const publicBase = process.env.S3_PUBLIC_URL!.replace(/\/$/, "");
      return {
        provider: "s3",
        signedUrl,
        publicUrl: `${publicBase}/${path}`,
        path,
        contentType,
      };
    } catch (e) {
      console.error("[storage/s3]", e);
      return { error: "Не удалось подготовить загрузку (S3)" };
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return { error: "Хранилище не настроено" };
  }

  const supabase = createClient(url, serviceKey);
  const { data, error } = await supabase.storage.from(UPLOAD_BUCKET).createSignedUploadUrl(path);

  if (error || !data) {
    console.error("[storage/supabase]", error?.message);
    return { error: error?.message ?? "Не удалось подготовить загрузку" };
  }

  const { data: publicData } = supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(path);

  return {
    provider: "supabase",
    signedUrl: data.signedUrl,
    publicUrl: publicData.publicUrl,
    path: data.path,
    token: data.token,
    contentType,
  };
}
