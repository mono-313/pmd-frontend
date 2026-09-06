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
  UpdateForecastRequest,
} from "@/app/types/forecast";


interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}


/*
 * GET /api/forecasts/{id}
 *
 * دریافت اطلاعات یک Forecast
 */
export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const {
      id,
    } = await context.params;

    const forecastId =
      id?.trim();

    if (!forecastId) {
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
     * دریافت Access Token
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
     * ساخت آدرس Backend:
     * /api/forecasts/{id}
     */
    const backendUrl =
      `${API_CONFIG.baseUrl}` +
      `${API_ENDPOINTS.forecasts.byId(
        forecastId
      )}`;

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

    /*
     * پاسخ ابتدا به شکل Text خوانده می‌شود.
     */
    const responseText =
      await backendResponse.text();

    const responseData =
      parseJsonResponse(
        responseText
      );

    console.log(
      "GET FORECAST BY ID:",
      {
        id:
          forecastId,

        backendUrl,

        status:
          backendResponse.status,

        response:
          responseData ??
          responseText,
      }
    );

    /*
     * پاسخ ناموفق Backend
     */
    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message:
            getErrorMessage(
              responseData
            ) ??
            `دریافت اطلاعات پیش‌بینی انجام نشد. کد پاسخ Backend: ${backendResponse.status}`,

          /*
           * پاسخ اصلی فقط برای عیب‌یابی
           */
          details:
            responseData,
        },
        {
          status:
            backendResponse.status,
        }
      );
    }

    /*
     * پاسخ موفق اما خالی
     */
    if (!responseText.trim()) {
      return NextResponse.json(
        {
          message:
            "Backend برای این پیش‌بینی پاسخ خالی برگرداند.",
        },
        {
          status: 502,
        }
      );
    }

    /*
     * پاسخ موفق اما غیر JSON
     */
    if (responseData === null) {
      return NextResponse.json(
        {
          message:
            "پاسخ Backend از نوع JSON نیست.",

          details:
            responseText.slice(
              0,
              500
            ),
        },
        {
          status: 502,
        }
      );
    }

    /*
     * پاسخ موفق Backend بدون هیچ
     * اعتبارسنجی سخت‌گیرانه منتقل می‌شود.
     */
    return NextResponse.json(
      responseData,
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Get forecast by id route error:",
      error
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "ارتباط با وب‌سرویس پیش‌بینی برقرار نشد.",
      },
      {
        status: 500,
      }
    );
  }
}


/*
 * PUT /api/forecasts/{id}
 *
 * ویرایش Forecast
 */
export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    /*
     * شناسه Forecast از URL
     */
    const {
      id,
    } = await context.params;

    const forecastId =
      id?.trim();

    if (!forecastId) {
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
     * دریافت Access Token
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
     * دریافت بدنه ارسالی از
     * EditFinalReviewStep
     */
    const requestData =
      await request.json() as
        unknown;

    if (!isRecord(requestData)) {
      return NextResponse.json(
        {
          message:
            "ساختار اطلاعات ویرایش معتبر نیست.",
        },
        {
          status: 400,
        }
      );
    }

    const broadcastDate =
      typeof requestData
        .broadcastDate ===
        "string"
        ? normalizeDigits(
            requestData
              .broadcastDate
              .trim()
          )
        : "";

    const mainTopic =
      typeof requestData
        .mainTopic ===
        "string"
        ? requestData
            .mainTopic
            .trim()
        : "";

    const hasExpert =
      requestData.hasExpert;

    const topicAxes =
      Array.isArray(
        requestData.topicAxes
      )
        ? requestData.topicAxes
            .filter(
              (
                topic
              ): topic is string =>
                typeof topic ===
                  "string"
            )
            .map(
              (topic) =>
                topic.trim()
            )
            .filter(Boolean)
        : [];

    const expertIds =
      Array.isArray(
        requestData.expertIds
      )
        ? requestData.expertIds
            .filter(
              (
                expertId
              ): expertId is string =>
                typeof expertId ===
                  "string"
            )
            .map(
              (expertId) =>
                expertId.trim()
            )
            .filter(Boolean)
        : [];

    /*
     * اعتبارسنجی فیلدهای ضروری
     */
    if (!broadcastDate) {
      return NextResponse.json(
        {
          message:
            "تاریخ پخش الزامی است.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      Number.isNaN(
        Date.parse(
          broadcastDate
        )
      )
    ) {
      return NextResponse.json(
        {
          message:
            "فرمت تاریخ پخش معتبر نیست.",
        },
        {
          status: 400,
        }
      );
    }

    if (!mainTopic) {
      return NextResponse.json(
        {
          message:
            "موضوع اصلی الزامی است.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof hasExpert !==
        "boolean"
    ) {
      return NextResponse.json(
        {
          message:
            "وضعیت کارشناس معتبر نیست.",
        },
        {
          status: 400,
        }
      );
    }

    if (topicAxes.length === 0) {
      return NextResponse.json(
        {
          message:
            "حداقل یک محور موضوعی الزامی است.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      hasExpert &&
      expertIds.length === 0
    ) {
      return NextResponse.json(
        {
          message:
            "برای برنامه دارای کارشناس، حداقل یک کارشناس انتخاب کنید.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * بدنه دقیق مطابق مستند Backend
     *
     * planId، networkId، networkGroupId
     * و episodeNumber ارسال نمی‌شوند.
     */
    const backendBody:
      UpdateForecastRequest = {
      id:
        forecastId,

      broadcastDate,

      mainTopic,

      hasExpert,

      topicAxes,

      expertIds:
        hasExpert
          ? expertIds
          : [],
    };

    const backendUrl =
      `${API_CONFIG.baseUrl}` +
      `${API_ENDPOINTS.forecasts.byId(
        forecastId
      )}`;

    console.log(
      "UPDATE FORECAST REQUEST:",
      {
        backendUrl,
        backendBody,
      }
    );

    /*
     * ارسال PUT به Backend
     */
    const backendResponse =
      await fetch(
        backendUrl,
        {
          method: "PUT",

          headers: {
            Accept:
              "application/json",

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${accessToken}`,
          },

          body:
            JSON.stringify(
              backendBody
            ),

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

    console.log(
      "UPDATE FORECAST RESPONSE:",
      {
        status:
          backendResponse.status,

        response:
          responseData ??
          responseText,
      }
    );

    /*
     * پاسخ ناموفق Backend
     */
    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message:
            getErrorMessage(
              responseData
            ) ??
              `ویرایش پیش‌بینی انجام نشد. کد پاسخ Backend: ${backendResponse.status}`,

          details:
            responseData,
        },
        {
          status:
            backendResponse.status,
        }
      );
    }

    /*
     * در پاسخ موفق سخت‌گیری نمی‌کنیم.
     * ممکن است Backend پاسخ کامل،
     * ناقص یا حتی خالی برگرداند.
     */
    return NextResponse.json(
      {
        message:
          "ویرایش پیش‌بینی با موفقیت انجام شد.",

        forecast:
          responseData,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Update forecast route error:",
      error
    );

    if (
      error instanceof
        SyntaxError
    ) {
      return NextResponse.json(
        {
          message:
            "بدنه درخواست JSON معتبر نیست.",
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "ارتباط با وب‌سرویس ویرایش برقرار نشد.",
      },
      {
        status: 500,
      }
    );
  }
}



export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } =
      await context.params;

    if (!id?.trim()) {
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

    const backendUrl =
      `${API_CONFIG.baseUrl}` +
      `${API_ENDPOINTS.forecasts.byId(id)}`;

    const backendResponse =
      await fetch(
        backendUrl,
        {
          method: "DELETE",

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

    /*
     * DELETE ممکن است پاسخ خالی با کد 204 برگرداند.
     */
    const responseText =
      await backendResponse.text();

    const responseData =
      parseJsonResponse(
        responseText
      );

    if (!backendResponse.ok) {
      const fallbackMessage =
        "حذف پیش‌بینی انجام نشد. کد پاسخ Backend: " +
        backendResponse.status;

      return NextResponse.json(
        {
          message:
            getErrorMessage(
              responseData
            ) ??
            fallbackMessage,

          details:
            responseData,
        },
        {
          status:
            backendResponse.status,
        }
      );
    }

    return NextResponse.json(
      {
        message:
          "پیش‌بینی با موفقیت حذف شد.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Delete forecast route error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "ارتباط با وب‌سرویس حذف پیش‌بینی برقرار نشد.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * تبدیل امن Text به JSON
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


/*
 * استخراج پیام خطا
 */
function getErrorMessage(
  value: unknown
): string | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.message ===
      "string"
  ) {
    return value.message;
  }

  if (
    typeof value.description ===
      "string"
  ) {
    return value.description;
  }

  if (
    typeof value.errors ===
      "string"
  ) {
    return value.errors;
  }

  if (
    typeof value.title ===
      "string"
  ) {
    return value.title;
  }

  return null;
}


function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}



function normalizeDigits(
  value: string
): string {
  const persianDigits =
    "۰۱۲۳۴۵۶۷۸۹";

  const arabicDigits =
    "٠١٢٣٤٥٦٧٨٩";

  return value
    .replace(
      /[۰-۹]/g,
      (digit) =>
        String(
          persianDigits.indexOf(
            digit
          )
        )
    )
    .replace(
      /[٠-٩]/g,
      (digit) =>
        String(
          arabicDigits.indexOf(
            digit
          )
        )
    );
}
