import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_CONFIG } from "@/app/lib/api-config";


import type {
  ApiErrorResponse,
  LoginApiResponse,
  LoginRequest,
  SafeUserSession,
} from "@/app/types/auth";



export async function POST(request: Request) {
  try {
    const requestBody = (await request.json()) as LoginRequest;

    const backendResponse = await fetch(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.login}`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify({
          userName: requestBody.userName,
          password: requestBody.password,
        }),

        cache: "no-store",
      }
    );

    const responseData = await backendResponse.json();

    if (!backendResponse.ok) {
      const apiError = responseData as ApiErrorResponse;

      return NextResponse.json(
        {
          message: getLoginErrorMessage(
            backendResponse.status,
            apiError
          ),

          code: apiError.code,
        },
        {
          status: backendResponse.status,
        }
      );
    }

    const loginResult = responseData as LoginApiResponse;

    //ACCESS TOKEN
    if (!loginResult.accessToken) {
      return NextResponse.json(
        {
          message: "توکن ورود از وب‌سرویس دریافت نشد.",
        },
        {
          status: 502,
        }
      );
    }

    /*
     * Cookie Store
     */
    const cookieStore = await cookies();

    /*
     * Access Token داخل HttpOnly Cookie ذخیره می‌شود.
     */
    cookieStore.set({
      name: "access-token",
      value: loginResult.accessToken,

      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",

      path: "/",

      /*
       * فعلاً ۱۵ دقیقه.
       بعدا expiresAt
       */
      maxAge: 15 * 60,
    });

    /*
     * Refresh Token نیز داخل کوکی جداگانه نگهداری می‌شود.
     */
    cookieStore.set({
      name: "refresh-token",
      value: loginResult.refreshToken,

      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",

      /*
       * فقط Routeهای مربوط به Auth به این Cookie نیاز دارند.
       */
      path: "/api/auth",

      /*
       * فعلاً هفت روز.
       */
      maxAge: 7 * 24 * 60 * 60,
    });

    /*
     * فقط اطلاعات غیرحساس به صفحه Login برگردانده می‌شوند.
     */
    const safeSession: SafeUserSession = {
      userName: requestBody.userName,
      expiresAt: loginResult.expiresAt,
      roles: loginResult.roles ?? [],
      networkIds: loginResult.networkIds ?? [],
      networkGroupId:
        loginResult.networkGroupId ?? null,
    };

    return NextResponse.json(safeSession, {
      status: 200,
    });
  } catch (error) {
    console.error("Login route error:", error);

    return NextResponse.json(
      {
        message:
          "ارتباط با وب‌سرویس ورود برقرار نشد.",
      },
      {
        status: 500,
      }
    );
  }
}

function getLoginErrorMessage(
  status: number,
  error: ApiErrorResponse
) {
  /*
   * 401 → Auth.InvalidCredentials
   * 403 → Auth.AccountInactive
   */

  if (
    status === 401 ||
    error.code === "Auth.InvalidCredentials"
  ) {
    return "نام کاربری یا رمز عبور صحیح نیست.";
  }

  if (
    status === 403 ||
    error.code === "Auth.AccountInactive"
  ) {
    return "حساب کاربری شما غیرفعال است.";
  }

  return (
    error.description ||
    error.errors ||
    error.title ||
    "ورود به سامانه انجام نشد."
  );
}