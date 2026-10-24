import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AuthFailure, checkOrigin, rotateTokens, saveTokens } 
from "@/app/lib/auth-server";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const jar = 
    await cookies();
    const accessToken = 
    jar.get("access-token")?.value;
    const refreshToken = 
    jar.get("refresh-token")?.value;
    if (!accessToken || !refreshToken) 
      throw new 
    AuthFailure(401, "نشست پایان یافته است؛ دوباره وارد شوید.");
    const tokens = 
    await 
        rotateTokens(accessToken, refreshToken);
    await   
        saveTokens(tokens);
    // No token is exposed to browser JavaScript.
    return NextResponse.json
    ({ expiresAt: tokens.expiresAt },
       { headers: 
        { "Cache-Control": "no-store" } });
  } 
  catch (error) {
    // Do not erase cookies on a failed refresh response: a concurrent success may have rotated them.
    return NextResponse.json(
      { message:
         error instanceof AuthFailure ?
          error.message : 
          "ارتباط برای تمدید نشست برقرار نشد." },
      { status:
         error instanceof AuthFailure ?
          error.status : 503, 
          headers: { "Cache-Control": "no-store" } 
        });
  }
}
