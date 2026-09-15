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
  ForecastActionResponse,
  ForecastResponse,
  ForecastStatus,
} from "@/app/types/forecast";


interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}


/*
 * POST /api/forecasts/{id}/submit
 *
 * ارسال پیش‌بینی برای بررسی
 * مدیر گروه برنامه‌ساز
 *
 * طبق مستند این Endpoint
 * هیچ Body دریافت نمی‌کند.
 */
export async function POST(
  _request: Request,
  context: RouteContext
) {
  try {
    const {
      id: rawId,
    } = await context.params;


    const forecastId =
      rawId?.trim();


    if (!forecastId) {
      return jsonError(
        "شناسه پیش‌بینی معتبر نیست.",
        400
      );
    }


    const cookieStore =
      await cookies();


    const accessToken =
      cookieStore.get(
        "access-token"
      )?.value;


    if (!accessToken) {
      return jsonError(
        "نشست کاربری معتبر نیست.",
        401
      );
    }


    const backendUrl =
      joinUrl(
        API_CONFIG.baseUrl,

        API_ENDPOINTS
          .forecasts
          .submit(
            forecastId
          )
      );


    /*
     * این درخواست Body ندارد.
     * بنابراین Content-Type نیز
     * برای آن ارسال نمی‌شود.
     */
    const backendResponse =
      await fetch(
        backendUrl,
        {
          method:
            "POST",

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


    const responseData =
      parseJsonResponse(
        responseText
      );


    /*
     * خطای Backend با همان Status
     * به صفحه Frontend منتقل می‌شود.
     */
    if (!backendResponse.ok) {
      const backendCode =
        getErrorCode(
          responseData
        );


      return NextResponse.json(
        {
          message:
            getSubmitErrorMessage(
              backendResponse.status,
              backendCode,
              responseData
            ),

          code:
            backendCode,

          details:
            responseData ??
            (
              responseText.trim()
                ? responseText
                : null
            ),
        },
        {
          status:
            backendResponse.status,
        }
      );
    }


    /*
     * Backend ممکن است:
     *
     * 1. ForecastResponse برگرداند؛
     * 2. پاسخ را داخل data قرار دهد؛
     * 3. پاسخ خالی برگرداند.
     */
    const forecast =
      getForecastResponse(
        responseData
      );


    const result:
      ForecastActionResponse = {
      message:
        "پیش‌بینی با موفقیت برای مدیر گروه ارسال شد.",

      ...(forecast
        ? {
            forecast,
          }
        : {}),
    };


    return NextResponse.json(
      result,
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Submit forecast route error:",
      error
    );


    return jsonError(
      "ارتباط با وب‌سرویس ارسال پیش‌بینی برقرار نشد.",
      500
    );
  }
}


/*
 * استخراج ForecastResponse
 * از پاسخ‌های احتمالی Backend
 */
function getForecastResponse(
  value: unknown
): ForecastResponse | null {
  if (
    isForecastResponse(
      value
    )
  ) {
    return value;
  }


  if (!isRecord(value)) {
    return null;
  }


  const candidates = [
    value.forecast,
    value.data,
    value.result,
  ];


  for (
    const candidate of
    candidates
  ) {
    if (
      isForecastResponse(
        candidate
      )
    ) {
      return candidate;
    }
  }


  /*
   * پاسخ تو در تو:
   *
   * {
   *   data: {
   *     forecast: {...}
   *   }
   * }
   */
  if (isRecord(value.data)) {
    const nestedCandidates = [
      value.data.forecast,
      value.data.result,
    ];


    for (
      const candidate of
      nestedCandidates
    ) {
      if (
        isForecastResponse(
          candidate
        )
      ) {
        return candidate;
      }
    }
  }


  return null;
}


/*
 * اعتبارسنجی حداقلی Forecast
 *
 * عمداً فیلدهای غیرضروری بررسی
 * نمی‌شوند تا اضافه‌شدن فیلد جدید
 * پاسخ را نامعتبر نکند.
 */
function isForecastResponse(
  value: unknown
): value is ForecastResponse {
  return (
    isRecord(value) &&

    typeof value.id ===
      "string" &&

    Boolean(
      value.id.trim()
    ) &&

    typeof value.planId ===
      "number" &&

    typeof value.mainTopic ===
      "string" &&

    isForecastStatus(
      value.status
    )
  );
}


/*
 * وضعیت‌های معتبر طبق مستند
 */
function isForecastStatus(
  value: unknown
): value is ForecastStatus {
  return (
    value === "Draft" ||
    value ===
      "PendingReview" ||
    value === "Approved" ||
    value === "Rejected" ||
    value ===
      "ReturnedForEdit"
  );
}


/*
 * تولید پیام مناسب براساس
 * Status و Code خطای Backend
 */
function getSubmitErrorMessage(
  status: number,
  code: string | null,
  responseData: unknown
): string {
  if (
    code ===
    "Forecast.InvalidStatusForSubmit"
  ) {
    return "فقط پیش‌نویس یا موضوع بازگشت‌داده‌شده برای اصلاح، قابل ارسال است.";
  }


  if (status === 401) {
    return "نشست کاربری معتبر نیست یا منقضی شده است.";
  }


  if (status === 403) {
    return "کاربر فعلی مالک این پیش‌بینی نیست یا نقش Providers برای ارسال موضوع را ندارد.";
  }


  if (status === 404) {
    return "پیش‌بینی موردنظر پیدا نشد.";
  }


  if (status === 409) {
    return (
      getApiErrorMessage(
        responseData
      ) ??
      "به‌دلیل تداخل اطلاعات، ارسال پیش‌بینی انجام نشد."
    );
  }


  return (
    getApiErrorMessage(
      responseData
    ) ??
    (
      "ارسال پیش‌بینی برای مدیر گروه انجام نشد. " +
      `کد پاسخ Backend: ${status}`
    )
  );
}


/*
 * استخراج Code خطای Backend
 */
function getErrorCode(
  value: unknown
): string | null {
  if (!isRecord(value)) {
    return null;
  }


  const possibleValues = [
    value.code,
    value.Code,
  ];


  for (
    const possibleValue of
    possibleValues
  ) {
    if (
      typeof possibleValue ===
        "string" &&
      possibleValue.trim()
    ) {
      return possibleValue.trim();
    }
  }


  return null;
}


/*
 * استخراج پیام خطای Backend
 */
function getApiErrorMessage(
  value: unknown
): string | null {
  if (!isRecord(value)) {
    return null;
  }


  const possibleValues = [
    value.message,
    value.Message,
    value.description,
    value.Description,
    value.detail,
    value.Detail,
    value.title,
    value.Title,
  ];


  for (
    const possibleValue of
    possibleValues
  ) {
    if (
      typeof possibleValue ===
        "string" &&
      possibleValue.trim()
    ) {
      return possibleValue.trim();
    }
  }


  /*
   * ساختار خطای مستند:
   *
   * {
   *   errors: "..."
   * }
   */
  if (
    typeof value.errors ===
      "string" &&
    value.errors.trim()
  ) {
    return value.errors.trim();
  }


  /*
   * خطاهای Validation
   */
  if (isRecord(value.errors)) {
    const messages =
      Object.values(
        value.errors
      ).flatMap(
        (errorValue) => {
          if (
            typeof errorValue ===
              "string"
          ) {
            return [
              errorValue,
            ];
          }


          if (
            Array.isArray(
              errorValue
            )
          ) {
            return errorValue.filter(
              (
                message
              ): message is string =>
                typeof message ===
                "string"
            );
          }


          return [];
        }
      );


    if (messages.length > 0) {
      return messages.join(
        "، "
      );
    }
  }


  return null;
}


/*
 * تبدیل امن پاسخ به JSON
 */
function parseJsonResponse(
  value: string
): unknown | null {
  if (!value.trim()) {
    return null;
  }


  try {
    return JSON.parse(
      value
    ) as unknown;
  } catch {
    return null;
  }
}


/*
 * اتصال امن Base URL
 * به Endpoint
 */
function joinUrl(
  baseUrl: string,
  endpoint: string
): string {
  return (
    baseUrl.replace(
      /\/+$/,
      ""
    ) +
    "/" +
    endpoint.replace(
      /^\/+/,
      ""
    )
  );
}


/*
 * بررسی Object بودن مقدار
 */
function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}


/*
 * پاسخ خطای Route داخلی
 */
function jsonError(
  message: string,
  status: number
) {
  return NextResponse.json(
    {
      message,
    },
    {
      status,
    }
  );
}