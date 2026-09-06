import {
  NextResponse,
} from "next/server";

import {
  cookies,
} from "next/headers";

import {
  API_CONFIG,
  API_ENDPOINTS,
} from "@/app/lib/api-config";

import type {
  ApiErrorResponse,
  ForecastReasonRequest,
} from "@/app/types/forecast";


interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}


export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    /*
     * دریافت شناسه Forecast از URL
     */
    const {
      id,
    } = await context.params;


    if (!id) {
      return NextResponse.json(
        {
          message:
            "شناسه موضوع معتبر نیست.",
        },
        {
          status: 400,
        }
      );
    }


    /*
     * دریافت Access Token
     * از HttpOnly Cookie
     */
    const cookieStore =
      await cookies();

    const accessToken =
      cookieStore.get(
        "access-token"
      )?.value;


    if (!accessToken) {
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
     * دریافت دلیل بازگشت
     * از Frontend
     */
    const requestData =
      await request.json() as
        ForecastReasonRequest;

    const reason =
      requestData.reason?.trim();


    if (!reason) {
      return NextResponse.json(
        {
          message:
            "وارد کردن دلیل بازگشت الزامی است.",
        },
        {
          status: 400,
        }
      );
    }


    /*
     * ساخت آدرس Backend
     */
    const backendUrl =
      `${API_CONFIG.baseUrl}` +
      `${API_ENDPOINTS.forecasts.returnForEdit(id)}`;


    /*
     * ارسال درخواست به Backend
     */
    const backendResponse =
      await fetch(
        backendUrl,
        {
          method: "POST",

          headers: {
            Accept:
              "application/json",

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${accessToken}`,
          },

          body:
            JSON.stringify({
              reason,
            }),

          cache:
            "no-store",
        }
      );


    /*
     * دریافت پاسخ به‌صورت Text
     *
     * ممکن است Backend پاسخ خالی
     * یا غیر JSON برگرداند.
     */
    const responseText =
      await backendResponse.text();

    const responseData =
      parseJsonResponse(
        responseText
      );


    /*
     * پاسخ ناموفق Backend
     */
    if (!backendResponse.ok) {
      const apiError =
        responseData as
          | ApiErrorResponse
          | null;


      return NextResponse.json(
        {
          message:
            apiError?.message ??
            apiError?.description ??
            "بازگشت موضوع برای اصلاح انجام نشد.",

          code:
            apiError?.code,

          errors:
            apiError?.errors,
        },
        {
          status:
            backendResponse.status,
        }
      );
    }


    /*
     * پاسخ موفق
     *
     * این قسمت باید بیرون از شرط
     * !backendResponse.ok باشد.
     */
    return NextResponse.json(
      {
        message:
          "موضوع برای اصلاح به ثبت‌کننده بازگردانده شد.",

        data:
          responseData,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Return forecast for edit error:",
      error
    );


    /*
     * بدنه درخواست JSON معتبر نبوده است.
     */
    if (
      error instanceof
      SyntaxError
    ) {
      return NextResponse.json(
        {
          message:
            "ساختار اطلاعات ارسال‌شده معتبر نیست.",
        },
        {
          status: 400,
        }
      );
    }


    /*
     * خطای ارتباط یا خطای پیش‌بینی‌نشده
     */
    return NextResponse.json(
      {
        message:
          "ارتباط با وب‌سرویس برقرار نشد.",
      },
      {
        status: 500,
      }
    );
  }
}


/*
 * تبدیل امن پاسخ Text به JSON
 */
function parseJsonResponse(
  responseText: string
): unknown | null {
  if (!responseText.trim()) {
    return null;
  }


  try {
    return JSON.parse(
      responseText
    ) as unknown;
  } catch {
    return null;
  }
}