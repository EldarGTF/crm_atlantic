import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

const PUBLIC_ROUTES = ["/login"];

const ROUTE_ROLES: Record<string, string[]> = {
  "/staff":        ["ADMIN"],
  "/leads":        ["ADMIN", "MANAGER"],
  "/clients":      ["ADMIN", "MANAGER"],
  "/orders":       ["ADMIN", "MANAGER", "PRODUCTION", "PRODUCTION_GLASS", "PRODUCTION_PVC", "PRODUCTION_ALUMINUM"],
  "/production":   ["ADMIN", "MANAGER", "PRODUCTION", "PRODUCTION_GLASS", "PRODUCTION_PVC", "PRODUCTION_ALUMINUM"],
  "/archive":      ["ADMIN", "MANAGER"],
  "/measurements": ["ADMIN", "MANAGER", "MEASURER"],
  "/installation": ["ADMIN", "MANAGER", "INSTALLER"],
  "/tasks":        ["ADMIN", "MANAGER", "MEASURER", "INSTALLER", "PRODUCTION", "PRODUCTION_GLASS", "PRODUCTION_PVC", "PRODUCTION_ALUMINUM"],
  "/dashboard":    ["ADMIN", "MANAGER"],
};

const HOME_BY_ROLE: Record<string, string> = {
  ADMIN:      "/dashboard",
  MANAGER:    "/dashboard",
  MEASURER:   "/measurements",
  INSTALLER:  "/installation",
  PRODUCTION:          "/production",
  PRODUCTION_GLASS:    "/production",
  PRODUCTION_PVC:      "/production",
  PRODUCTION_ALUMINUM: "/production",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const token = request.cookies.get("crm_session")?.value;
  const session = token ? await decrypt(token) : null;

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && isPublic) {
    const home = HOME_BY_ROLE[session.role] ?? "/dashboard";
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (session) {
    const matchedRoute = Object.keys(ROUTE_ROLES).find(
      (route) => pathname === route || pathname.startsWith(route + "/")
    );
    if (matchedRoute && !ROUTE_ROLES[matchedRoute].includes(session.role)) {
      const home = HOME_BY_ROLE[session.role] ?? "/dashboard";
      return NextResponse.redirect(new URL(home, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
