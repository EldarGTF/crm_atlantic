import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { SessionPayload } from "./definitions";

let encodedKey: Uint8Array | null = null;

function getEncodedSecret(): Uint8Array {
  if (encodedKey) return encodedKey;

  const secretKey = process.env.SESSION_SECRET;
  if (secretKey && secretKey.length >= 32) {
    encodedKey = new TextEncoder().encode(secretKey);
    return encodedKey;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set and at least 32 characters");
  }
  encodedKey = new TextEncoder().encode("dev-insecure-session-secret-min-32-chars!");
  return encodedKey;
}
const COOKIE_NAME = "crm_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 дней

export async function encrypt(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getEncodedSecret());
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getEncodedSecret(), {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(payload: Omit<SessionPayload, "expiresAt">) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  const token = await encrypt({ ...payload, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decrypt(token);
}
