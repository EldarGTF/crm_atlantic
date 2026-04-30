import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

const PUBLIC_ROUTES = ["/login"];

const ROUTE_ROLES: Record<string, string[]> = {
  "/staff":        ["ADMIN"],
  "/leads":        ["ADMIN", "MANAGER", "ECONOMIST"],
  "/clients":      ["ADMIN", "MANAGER", "ECONOMIST"],
  "/orders":       ["ADMIN", "MANAGER", "ECONOMIST", "PRODUCTION", "PRODUCTION_GLASS", "PRODUCTION_PVC", "PRODUCTION_ALUMINUM"],
  "/production":   ["ADMIN", "MANAGER", "ECONOMIST", "PRODUCTION", "PRODUCTION_GLASS", "PRODUCTION_PVC", "PRODUCTION_ALUMINUM"],
  "/archive":      ["ADMIN", "MANAGER", "ECONOMIST"],
  "/measurements": ["ADMIN", "MANAGER", "ECONOMIST", "MEASURER"],
  "/installation": ["ADMIN", "MANAGER", "ECONOMIST", "INSTALLER"],
  "/tasks":        ["ADMIN", "MANAGER", "ECONOMIST", "MEASURER", "INSTALLER", "PRODUCTION", "PRODUCTION_GLASS", "PRODUCTION_PVC", "PRODUCTION_ALUMINUM"],
  "/dashboard":    ["ADMIN", "MANAGER", "ECONOMIST"],
  "/analytics":    ["ADMIN", "MANAGER", "ECONOMIST"],
  "/today":        ["ADMIN", "MANAGER", "ECONOMIST", "MEASURER", "INSTALLER", "PRODUCTION", "PRODUCTION_GLASS", "PRODUCTION_PVC", "PRODUCTION_ALUMINUM"],
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
  ECONOMIST:           "/dashboard",
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
