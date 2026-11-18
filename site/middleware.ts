import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_ISSUER = "hms-enterprise";

function getMiddlewareSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === "") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FATAL: JWT_SECRET environment variable is missing in production.");
    }
    return new TextEncoder().encode("dronagiri-dev-jwt-secret-do-not-use-in-production-min32bytes!");
  }
  return new TextEncoder().encode(secret.trim());
}

// Public endpoints that must bypass edge authentication
const PUBLIC_API_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only intercept /api/* routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Allow public authentication endpoints
  if (PUBLIC_API_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"))) {
    return NextResponse.next();
  }

  // Extract token from Authorization header or hms_token cookie
  let token: string | undefined;
  const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  } else if (authHeader) {
    token = authHeader.trim();
  } else {
    token = request.cookies.get("hms_token")?.value;
  }

  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Edge Authentication: Valid token required to access API" },
      { status: 401 }
    );
  }

  try {
    const secret = getMiddlewareSecret();
    const { payload } = await jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      algorithms: ["HS256"],
    });

    // Attach verified user identity claims to request headers for downstream handlers
    const requestHeaders = new Headers(request.headers);
    if (payload.sub) requestHeaders.set("x-auth-user-id", String(payload.sub));
    if (payload.role) requestHeaders.set("x-auth-user-role", String(payload.role));
    if (payload.email) requestHeaders.set("x-auth-user-email", String(payload.email));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unauthorized", message: "Edge Authentication: Token is invalid or expired" },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: [
    "/api/:path*",
  ],
};
