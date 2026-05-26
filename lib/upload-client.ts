/**
 * Прямая загрузка в Supabase Storage (минуя лимит тела Vercel ~4.5 MB).
 */
export async function uploadFileToStorage(
  file: File,
  folder: string
): Promise<{ name: string; url: string; size: number }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("Supabase URL не настроен");
  }

  const signRes = await fetch("/api/upload/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      folder,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type || "",
    }),
  });

  const signData = await signRes.json().catch(() => ({}));
  if (!signRes.ok) {
    throw new Error(signData.error ?? "Не удалось подготовить загрузку");
  }

  const uploadUrl = `${supabaseUrl}/storage/v1/object/upload/sign/${signData.path}?token=${encodeURIComponent(signData.token)}`;

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": signData.contentType || file.type || "application/octet-stream",
      "cache-control": "3600",
      "x-upsert": "false",
    },
    body: file,
  });

  if (!putRes.ok) {
    const errText = await putRes.text().catch(() => "");
    throw new Error(errText || `Ошибка загрузки (${putRes.status})`);
  }

  return {
    name: signData.name ?? file.name,
    url: signData.publicUrl,
    size: signData.size ?? file.size,
  };
}
