import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_CONFIG } from "@/app/lib/api-config";
import { AuthFailure, backendAuth, checkOrigin, clearTokens, rotateTokens } from "@/app/lib/auth-server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try { checkOrigin(request); }
  catch (error) { return NextResponse.json({ message: "مبدأ درخواست معتبر نیست." }, { status: error instanceof AuthFailure ? error.status : 403 }); }
  let revoked = false;
  try {
    const jar = await cookies();
    let accessToken = jar.get("access-token")?.value;
    let refreshToken = jar.get("refresh-token")?.value;
    if (accessToken && refreshToken) {
      let response = await backendAuth(API_CONFIG.endpoints.revoke, { refreshToken }, accessToken);
      if (response.status === 401) {
        const updated = await rotateTokens(accessToken, refreshToken);
        accessToken = updated.accessToken;
        refreshToken = updated.refreshToken;
        response = await backendAuth(API_CONFIG.endpoints.revoke, { refreshToken }, accessToken);
      }
      revoked = response.ok;
    }
  } catch { /* Local logout must still complete when backend is unavailable. */ }
  await clearTokens();
  return NextResponse.json({ success: true, revoked }, { headers: { "Cache-Control": "no-store" } });
}
