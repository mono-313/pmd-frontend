import {
  NextResponse,
} from "next/server";


interface RouteContext {
  params: Promise<{
    planId: string;
  }>;
}


/*
 * آدرس وب‌سرویس اطلاعات پایه
 *
 * اگر BASE_INFO_API_URL در env وجود
 * داشته باشد از آن استفاده می‌شود.
 */
const BASE_INFO_API_URL =
  process.env.BASE_INFO_API_URL ??
  "http://172.16.60.34/api/v1/baseinfo";


/*
 * GET /api/base-info/plans/{planId}/detail
 *
 * دریافت جزئیات یک برنامه
 */
export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    /*
     * دریافت شناسه برنامه از URL
     */
    const {
      planId,
    } = await context.params;


    const normalizedPlanId =
      normalizeDigits(
        planId?.trim() ?? ""
      );


    /*
     * تبدیل شناسه به عدد
     */
    const numericPlanId =
      Number(
        normalizedPlanId
      );


    if (
      !Number.isInteger(
        numericPlanId
      ) ||
      numericPlanId <= 0
    ) {
      return NextResponse.json(
        {
          message:
            "شناسه برنامه معتبر نیست.",
        },
        {
          status: 400,
        }
      );
    }


    /*
     * دریافت کلید وب‌سرویس
     * از متغیر محیطی
     */
    const apiKey =
      process.env
        .BASE_INFO_API_KEY;


    if (!apiKey?.trim()) {
      return NextResponse.json(
        {
          message:
            "کلید وب‌سرویس اطلاعات پایه تنظیم نشده است.",
        },
        {
          status: 500,
        }
      );
    }


    /*
     * ساخت آدرس صحیح Backend
     *
     * planId باید داخل Path باشد،
     * نه Query String.
     */
    const backendUrl =
      `${removeTrailingSlash(
        BASE_INFO_API_URL
      )}` +
      `/planDetail/${numericPlanId}`;


    const backendResponse =
      await fetch(
        backendUrl,
        {
          method:
            "GET",

          headers: {
            Accept:
              "application/json",

            "X-API-KEY":
              apiKey.trim(),
          },

          cache:
            "no-store",
        }
      );


    /*
     * دریافت پاسخ به صورت Text
     * برای مدیریت پاسخ خالی یا غیر JSON
     */
    const responseText =
      await backendResponse.text();


    const responseData =
      parseJsonResponse(
        responseText
      );


    /*
     * فقط در محیط توسعه برای
     * عیب‌یابی نمایش داده می‌شود.
     */
    if (
      process.env.NODE_ENV ===
        "development"
    ) {
      console.log(
        "PLAN DETAIL RESPONSE:",
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


    /*
     * پاسخ ناموفق وب‌سرویس
     */
    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message:
            getErrorMessage(
              responseData
            ) ??
            (
              "دریافت جزئیات برنامه انجام نشد. " +
              "کد پاسخ وب‌سرویس: " +
              backendResponse.status
            ),

          details:
            responseData ??
            responseText.slice(
              0,
              500
            ),
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
            "وب‌سرویس جزئیات برنامه پاسخ خالی برگرداند.",
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
            "پاسخ وب‌سرویس جزئیات برنامه JSON معتبر نیست.",

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
     * پاسخ را بدون اعتبارسنجی
     * سخت‌گیرانه به صفحه می‌فرستیم.
     *
     * تبدیل نام فیلدهای سرویس اطلاعات
     * پایه در مرحله ساخت Dialog انجام می‌شود.
     */
    return NextResponse.json(
      {
        data:
          responseData,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Plan detail route error:",
      error
    );


    return NextResponse.json(
      {
        message:
          "ارتباط با وب‌سرویس جزئیات برنامه برقرار نشد.",
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


/*
 * استخراج پیام خطا از پاسخ
 * وب‌سرویس اطلاعات پایه
 */
function getErrorMessage(
  value: unknown
): string | null {
  if (!isRecord(value)) {
    return null;
  }


  const possibleFields = [
    "message",
    "Message",
    "description",
    "Description",
    "detail",
    "MessageDetail",
  ];


  for (
    const fieldName of
    possibleFields
  ) {
    const fieldValue =
      value[fieldName];


    if (
      typeof fieldValue ===
        "string" &&
      fieldValue.trim()
    ) {
      return fieldValue;
    }
  }


  return null;
}


/*
 * حذف / انتهای Base URL
 */
function removeTrailingSlash(
  value: string
): string {
  return value.replace(
    /\/+$/,
    ""
  );
}


/*
 * تبدیل عدد فارسی و عربی
 * به عدد انگلیسی
 */
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