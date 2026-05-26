/**
 * Прямая загрузка в хранилище (S3/MinIO или Supabase), без прокси через Node.
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

  let putRes: Response;

  if (signData.provider === "s3") {
    try {
      putRes = await fetch(signData.signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": signData.contentType || file.type || "application/octet-stream",
        },
        body: file,
      });
    } catch {
      throw new Error(
        "Не удалось отправить файл на сервер. Проверьте S3_SIGN_ENDPOINT в .env (http://IP/s3)."
      );
    }
  } else {
    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", file);
    putRes = await fetch(signData.signedUrl, {
      method: "PUT",
      headers: { "x-upsert": "false" },
      body,
    });
  }

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
