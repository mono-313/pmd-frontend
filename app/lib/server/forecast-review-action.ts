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

import type {
  ForecastActionResponse,
  ForecastResponse,
} from "@/app/types/forecast";


type ReviewAction =
  | "approve"
  | "reject"
  | "return-for-edit";


interface ExecuteReviewActionOptions {
  forecastId:
    string;

  action:
    ReviewAction;

  reason?:
    string;
}


/*
 * اجرای عملیات بررسی Forecast
 *
 * این تابع فقط در Route Handlerهای
 * سمت سرور استفاده می‌شود.
 */
export async function executeForecastReviewAction({
  forecastId,
  action,
  reason,
}: ExecuteReviewActionOptions) {
  const normalizedForecastId =
    forecastId.trim();

  if (!normalizedForecastId) {
    return NextResponse.json(
      {
        message:
          "شناسه پیش‌بینی معتبر نیست.",
      },
      {
        status: 400,
      }
    );
  }


  /*
   * دریافت Token نشست جاری
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
   * طبق مستند جدید:
   *
   * POST /api/forecasts/{id}/approve
   * POST /api/forecasts/{id}/reject
   * POST /api/forecasts/{id}/return-for-edit
   */
 const backendUrl =
  buildForecastReviewUrl(
    API_CONFIG.baseUrl,
    normalizedForecastId,
    action
  );


  /*
   * approve فاقد Body است.
   *
   * reject و return-for-edit
   * می‌توانند reason دریافت کنند.
   */
  const normalizedReason =
  reason?.trim() ?? "";

const requiresReason =
  action === "reject" ||
  action === "return-for-edit";

if (
  requiresReason &&
  !normalizedReason
) {
  return NextResponse.json(
    {
      message:
        "وارد کردن دلیل برای رد یا بازگشت پیش‌بینی الزامی است.",
    },
    {
      status: 400,
    }
  );
}

const requestBody =
  requiresReason
    ? JSON.stringify({
        reason:
          normalizedReason,
      })
    : undefined;

console.log(
  "FORECAST REVIEW BODY:",
  {
    forecastId:
      normalizedForecastId,

    action,

    reasonLength:
      normalizedReason.length,

    requestBody,
  }
);

  try {
    if (
  process.env.NODE_ENV ===
  "development"
) {
  console.log(
    "FORECAST REVIEW REQUEST:",
    {
      backendUrl,
      forecastId:
        normalizedForecastId,
      action
    }
  );
}


    const backendResponse =
      await fetch(
        backendUrl,
        {
          method: "POST",

          headers: {
  Accept:
    "application/json",

  Authorization:
    `Bearer ${accessToken}`,

  ...(requiresReason
    ? {
        "Content-Type":
          "application/json",
      }
    : {}),
},

body:
  requestBody,

          cache:
            "no-store",
        }
      );


    const responseText =
      await backendResponse .text();

    const responseData =
      parseJsonResponse(
        responseText
      );


      if (
  process.env.NODE_ENV ===
  "development"
) {
  console.log(
    "FORECAST REVIEW RESPONSE:",
    {
      backendUrl,
      status:
        backendResponse.status,
      response:
        responseData ??
        responseText,
    }
  );
}

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message:
            getReviewErrorMessage(
              responseData,
              backendResponse.status
            ),

          /*
           * برای عیب‌یابی، پاسخ اصلی Backend
           * نیز نگهداری می‌شود.
           */
          details:
            responseData ??
            responseText.slice(
              0,
              1000
            ),
        },
        {
          status:
            backendResponse.status,
        }
      );
    }


    /*
     * پاسخ Backend ممکن است:
     *
     * 1. خالی باشد
     * 2. مستقیماً Forecast باشد
     * 3. داخل data یا forecast باشد
     */
    const forecast =
      extractForecastResponse(
        responseData
      );

    const result:
      ForecastActionResponse = {
      message:
        getSuccessMessage(
          action
        ),

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
      `Forecast ${action} route error:`,
      error
    );

    return NextResponse.json(
      {
        message:
          "ارتباط با وب‌سرویس عملیات بررسی برقرار نشد.",
      },
      {
        status: 500,
      }
    );
  }
}


function getSuccessMessage(
  action: ReviewAction
): string {
  switch (action) {
    case "approve":
      return "پیش‌بینی با موفقیت تأیید شد.";

    case "reject":
      return "پیش‌بینی رد شد.";

    case "return-for-edit":
      return "پیش‌بینی برای اصلاح بازگردانده شد.";
  }
}


function getReviewErrorMessage(
  value: unknown,
  status: number
): string {
  const apiMessage =
    getApiErrorMessage(
      value
    );

  if (apiMessage) {
    return apiMessage;
  }

  if (status === 401) {
    return "نشست کاربری معتبر نیست.";
  }

  if (status === 403) {
    return (
      "شما مجوز انجام این عملیات را ندارید. " +
      "عملیات بررسی فقط برای نقش مدیر گروه شبکه یا مدیر سامانه مجاز است."
    );
  }

  if (status === 404) {
    return "پیش‌بینی موردنظر پیدا نشد.";
  }

  if (status === 409) {
    return (
      "وضعیت پیش‌بینی تغییر کرده است. " +
      "صفحه را به‌روزرسانی و دوباره تلاش کنید."
    );
  }

  return (
    "عملیات بررسی پیش‌بینی انجام نشد. " +
    `کد پاسخ Backend: ${status}`
  );
}


function getApiErrorMessage(
  value: unknown
): string | null {
  if (!isRecord(value)) {
    return null;
  }

  const code =
    getString(
      value.code
    );

  if (
    code ===
    "Forecast.InvalidStatusForReview"
  ) {
    return (
      "این پیش‌بینی در وضعیت قابل بررسی قرار ندارد. " +
      "فقط موارد در انتظار بررسی قابل تأیید، رد یا بازگشت هستند."
    );
  }

  if (
    code ===
    "Forecast.Forbidden"
  ) {
    return (
      "شما مجوز بررسی این پیش‌بینی را ندارید."
    );
  }

  /*
   * Backend ممکن است errors
   * را مستقیماً به‌صورت string برگرداند.
   */
  const stringErrors =
    getString(
      value.errors
    );

  if (stringErrors) {
    return stringErrors;
  }

  /*
   * errors ممکن است آرایه باشد.
   */
  if (
    Array.isArray(
      value.errors
    )
  ) {
    const firstError =
      value.errors.find(
        (item) =>
          typeof item ===
            "string" &&
          item.trim()
      );

    if (
      typeof firstError ===
      "string"
    ) {
      return firstError.trim();
    }
  }

  /*
   * ساختار استاندارد ValidationProblemDetails
   */
  if (
    isRecord(
      value.errors
    )
  ) {
    for (
      const errorValue of
      Object.values(
        value.errors
      )
    ) {
      if (
        typeof errorValue ===
          "string" &&
        errorValue.trim()
      ) {
        return errorValue.trim();
      }

      if (
        Array.isArray(
          errorValue
        )
      ) {
        const firstError =
          errorValue.find(
            (item) =>
              typeof item ===
                "string" &&
              item.trim()
          );

        if (
          typeof firstError ===
          "string"
        ) {
          return firstError.trim();
        }
      }
    }
  }

  /*
   * بعد از errors سراغ
   * پیام‌های عمومی می‌رویم.
   */
  return (
    getString(
      value.message
    ) ??
    getString(
      value.description
    ) ??
    getString(
      value.detail
    ) ??
    getString(
      value.title
    )
  );
}

function extractForecastResponse(
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

  const possibleValues = [
    value.forecast,
    value.data,
    value.result,
  ];

  for (
    const possibleValue of
    possibleValues
  ) {
    if (
      isForecastResponse(
        possibleValue
      )
    ) {
      return possibleValue;
    }

    if (
      isRecord(
        possibleValue
      )
    ) {
      if (
        isForecastResponse(
          possibleValue.forecast
        )
      ) {
        return possibleValue.forecast;
      }

      if (
        isForecastResponse(
          possibleValue.data
        )
      ) {
        return possibleValue.data;
      }
    }
  }

  return null;
}


/*
 * این بررسی عمداً غیرسخت‌گیرانه است؛
 * چون بعضی Endpointهای Backend
 * پاسخ کامل Forecast را برنمی‌گردانند.
 */
function isForecastResponse(
  value: unknown
): value is ForecastResponse {
  return (
    isRecord(value) &&
    typeof value.id ===
      "string" &&
    typeof value.mainTopic ===
      "string"
  );
}


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


function getString(
  value: unknown
): string | null {
  return (
    typeof value ===
      "string" &&
    value.trim()
  )
    ? value.trim()
    : null;
}

function buildForecastReviewUrl(
  baseUrl: string,
  forecastId: string,
  action: ReviewAction
): string {
  const normalizedBaseUrl =
    baseUrl
      .trim()
      .replace(
        /\/+$/,
        ""
      );

  /*
   * اگر baseUrl خودش به /api ختم شود،
   * دوباره /api اضافه نمی‌کنیم.
   */
  const apiBaseUrl =
    normalizedBaseUrl
      .toLowerCase()
      .endsWith("/api")
      ? normalizedBaseUrl
      : `${normalizedBaseUrl}/api`;

  return (
    `${apiBaseUrl}/forecasts/` +
    `${encodeURIComponent(forecastId)}/` +
    action
  );
}

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