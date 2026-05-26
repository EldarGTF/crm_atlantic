import "server-only";

export const UPLOAD_BUCKET = "crm-files";
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

const ALLOWED_ROOTS = new Set(["orders", "measurements", "acts", "misc"]);

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

function sanitizeSegment(segment: string): string {
  return segment.replace(/[^a-z0-9_-]/gi, "").slice(0, 64);
}

export function parseUploadFolder(folderRaw: string): { root: string; subpath: string } | null {
  const parts = folderRaw
    .toLowerCase()
    .split("/")
    .map((p) => sanitizeSegment(p))
    .filter(Boolean);

  if (parts.length === 0) return { root: "misc", subpath: "" };

  const root = parts[0];
  if (!ALLOWED_ROOTS.has(root)) return null;

  return { root, subpath: parts.slice(1).join("/") };
}

export function resolveUploadMime(
  fileName: string,
  contentType: string
): { mime: string; ext: string } | null {
  const nameExt = fileName.split(".").pop()?.toLowerCase() ?? "";
  const fromName = MIME_BY_EXT[nameExt];

  if (contentType && (EXT_BY_MIME[contentType] || contentType.startsWith("image/"))) {
    const ext = EXT_BY_MIME[contentType] ?? (nameExt || "bin");
    return { mime: contentType, ext };
  }

  if (fromName) {
    return { mime: fromName, ext: nameExt };
  }

  if (contentType === "application/octet-stream" && nameExt && MIME_BY_EXT[nameExt]) {
    return { mime: MIME_BY_EXT[nameExt], ext: nameExt };
  }

  return null;
}

export function buildUploadPath(
  userId: string,
  folderRaw: string,
  fileName: string,
  contentType: string
): { path: string; mime: string } | { error: string } {
  const parsed = parseUploadFolder(folderRaw);
  if (!parsed) return { error: "Недопустимая папка загрузки" };

  const resolved = resolveUploadMime(fileName, contentType);
  if (!resolved) {
    return {
      error: "Формат не поддерживается (jpg, png, webp, gif, heic, pdf, doc, docx)",
    };
  }

  const { root, subpath } = parsed;
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const pathParts = [root, userId, subpath, `${stamp}.${resolved.ext}`].filter(Boolean);

  return { path: pathParts.join("/"), mime: resolved.mime };
}
