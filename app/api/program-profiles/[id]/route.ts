import "server-only";

import {
  cookies,
} from "next/headers";

import {
  NextResponse,
} from "next/server";

import {
  API_CONFIG,
} from "@/app/lib/api-config";


interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}


export async function GET(
  _request: Request,
  context: RouteContext
) {
  const {
    id,
  } = await context.params;

  const profileId =
    id?.trim();

  if (!profileId) {
    return NextResponse.json(
      {
        message:
          "شناسه شناسنامه معتبر نیست.",
      },
      {
        status: 400,
      }
    );
  }

  const cookieStore =
    await cookies();

  const accessToken =
    cookieStore.get(
      "access-token"
    )?.value;

  if (!accessToken) {
    console.warn(
      "PROGRAM PROFILE DETAILS AUTH ERROR:",
      {
        profileId,
        hasAccessToken: false,
      }
    );

    return NextResponse.json(
      {
        message:
          "نشست کاربری معتبر نیست.",
      },
      {
        status: 401,
      }
    );
  }

  /*
   * این تابع بررسی می‌کند که آیا
   * API_CONFIG.baseUrl از قبل به /api
   * ختم می‌شود یا خیر.
   */
  const backendUrl =
    buildProgramProfileDetailsUrl(
      API_CONFIG.baseUrl,
      profileId
    );

  const startedAt =
    Date.now();

  console.info(
    "PROGRAM PROFILE DETAILS REQUEST:",
    {
      profileId,
      configuredBaseUrl:
        API_CONFIG.baseUrl,
      backendUrl,
      hasAccessToken: true,
    }
  );

  try {
    const backendResponse =
      await fetch(
        backendUrl,
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",

            Authorization:
              `Bearer ${accessToken}`,
          },

          cache:
            "no-store",
        }
      );

    const responseText =
      await backendResponse.text();

    console.info(
      "PROGRAM PROFILE DETAILS RESPONSE:",
      {
        profileId,
        backendUrl,
        status:
          backendResponse.status,
        ok:
          backendResponse.ok,
        elapsedMs:
          Date.now() -
          startedAt,
        contentType:
          backendResponse.headers.get(
            "content-type"
          ),
        hasResponseBody:
          responseText.trim().length > 0,
      }
    );

    if (!backendResponse.ok) {
      console.error(
        "PROGRAM PROFILE DETAILS BACKEND ERROR:",
        {
          profileId,
          backendUrl,
          status:
            backendResponse.status,
          response:
            responseText.slice(
              0,
              2000
            ),
        }
      );
    }

    /*
     * برخی پاسخ‌های موفق Backend
     * ممکن است Body نداشته باشند.
     */
    if (!responseText.trim()) {
      return new NextResponse(
        null,
        {
          status:
            backendResponse.status,
        }
      );
    }

    /*
     * پاسخ Backend بدون تغییر
     * به صفحه برگردانده می‌شود.
     */
    return new NextResponse(
      responseText,
      {
        status:
          backendResponse.status,

        headers: {
          "Content-Type":
            backendResponse.headers.get(
              "content-type"
            ) ??
            "application/json; charset=utf-8",
        },
      }
    );
  } catch (error) {
    console.error(
      "PROGRAM PROFILE DETAILS CONNECTION ERROR:",
      {
        profileId,
        backendUrl,
        elapsedMs:
          Date.now() -
          startedAt,
        error:
          error instanceof Error
            ? {
                name:
                  error.name,
                message:
                  error.message,
                stack:
                  error.stack,
              }
            : error,
      }
    );

    return NextResponse.json(
      {
        message:
          "ارتباط با وب‌سرویس شناسنامه برقرار نشد.",
      },
      {
        status: 500,
      }
    );
  }
}


/*
 * اگر baseUrl چنین باشد:
 *
 * http://172.16.60.34:8000/api
 *
 * خروجی:
 *
 * http://172.16.60.34:8000/api/program-profiles/{id}
 *
 *
 * اگر baseUrl چنین باشد:
 *
 * http://172.16.60.34:8000
 *
 * باز هم خروجی صحیح ساخته می‌شود.
 */
function buildProgramProfileDetailsUrl(
  baseUrl: string,
  profileId: string
): string {
  const normalizedBaseUrl =
    baseUrl
      .trim()
      .replace(
        /\/+$/,
        ""
      );

  const apiBaseUrl =
    normalizedBaseUrl
      .toLowerCase()
      .endsWith("/api")
      ? normalizedBaseUrl
      : `${normalizedBaseUrl}/api`;

  return (
    `${apiBaseUrl}/program-profiles/` +
    encodeURIComponent(
      profileId
    )
  );
} 