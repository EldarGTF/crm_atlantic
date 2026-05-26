/**
 * Прямая загрузка в Supabase Storage (минуя лимит тела Vercel ~4.5 MB).
 */
export async function uploadFileToStorage(
  file: File,
  folder: string
): Promise<{ name: string; url: string; size: number }> {
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

  if (!signData.signedUrl) {
    throw new Error("Некорректный ответ сервера загрузки");
  }

  // Supabase signed upload ожидает multipart FormData (как в @supabase/storage-js)
  const body = new FormData();
  body.append("cacheControl", "3600");
  body.append("", file);

  const putRes = await fetch(signData.signedUrl, {
    method: "PUT",
    headers: {
      "x-upsert": "false",
    },
    body,
  });

  if (!putRes.ok) {
    let message = `Ошибка загрузки (${putRes.status})`;
    try {
      const errJson = await putRes.json();
      message = errJson.message ?? errJson.error ?? message;
    } catch {
      const errText = await putRes.text().catch(() => "");
      if (errText) message = errText;
    }
    throw new Error(message);
  }

  return {
    name: signData.name ?? file.name,
    url: signData.publicUrl,
    size: signData.size ?? file.size,
  };
}
