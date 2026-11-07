import { NextResponse } from "next/server";
import { API_CONFIG } from "@/app/lib/api-config";
import { AuthFailure, backendAuth, checkOrigin, normalizeTokens, saveTokens } from "@/app/lib/auth-server";
import type { SafeUserSession } from "@/app/types/auth";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ message: "بدنه درخواست معتبر نیست." }, { status: 400 }); }
    const input = body as { userName?: unknown; password?: unknown } | null;
    if (!input || typeof input.userName !== "string" || typeof input.password !== "string" || !input.userName.trim() || !input.password)
      return NextResponse.json({ message: "نام کاربری و رمز عبور را وارد کنید." }, { status: 400 });
    const response = await backendAuth(API_CONFIG.endpoints.login, { userName: input.userName, password: input.password });
    const data = await response.json().catch(() => null);
    console.log("LOGIN BACKEND RESPONSE:", data);
    if (!response.ok) {
      const message = response.status === 401 ? "نام کاربری یا رمز عبور صحیح نیست."
        : response.status === 403 ? "حساب کاربری شما غیرفعال است."
        : typeof data?.description === "string" ? data.description : "ورود به سامانه انجام نشد.";
      return NextResponse.json({ message, code: data?.code }, { status: response.status });
    }
    const tokens = normalizeTokens(data);
    await saveTokens(tokens);
    const session: SafeUserSession = {
      userName: input.userName, expiresAt: tokens.expiresAt,
      roles: Array.isArray(data.roles) ? data.roles : [],
      networkIds: Array.isArray(data.networkIds) ? data.networkIds : [],
      networkGroupId: data.networkGroupId ?? null,
    };
    return NextResponse.json(session, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ message: error instanceof AuthFailure ? error.message : "ارتباط با وب‌سرویس ورود برقرار نشد." },
      { status: error instanceof AuthFailure ? error.status : 503 });
  }
}
