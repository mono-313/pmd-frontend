import {
  NextResponse,
} from "next/server";


interface RouteContext {
  params: Promise<{
    planId: string;
  }>;
}


const BASE_INFO_API_URL =
  process.env.BASE_INFO_API_URL ??
  "http://172.16.60.34/api/v1/baseinfo";


/*
 * GET
 * /api/base-info/plans/{planId}/items
 *
 * دریافت آیتم‌های یک برنامه
 */
export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    /*
     * دریافت شناسه برنامه
     */
    const {
      planId,
    } = await context.params;


    const normalizedPlanId =
      normalizeDigits(
        planId?.trim() ?? ""
      );


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
     * کلید وب‌سرویس
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
     * آدرس صحیح Backend
     *
     * planId داخل Path قرار می‌گیرد.
     */
    const backendUrl =
      `${removeTrailingSlash(
        BASE_INFO_API_URL
      )}` +
      `/planItems/${numericPlanId}`;


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


    const responseText =
      await backendResponse.text();


    const responseData =
      parseJsonResponse(
        responseText
      );


    if (
      process.env.NODE_ENV ===
        "development"
    ) {
      console.log(
        "PLAN ITEMS RESPONSE:",
        {
          planId:
            numericPlanId,

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
              "دریافت آیتم‌های برنامه انجام نشد. " +
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
     * خالی بودن پاسخ به معنی
     * نداشتن آیتم در نظر گرفته می‌شود.
     */
    if (!responseText.trim()) {
      return NextResponse.json(
        {
          items: [],
        },
        {
          status: 200,
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
            "پاسخ وب‌سرویس آیتم‌های برنامه JSON معتبر نیست.",

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
     * استخراج آرایه آیتم‌ها بدون
     * اعتبارسنجی سخت‌گیرانه
     */
    const programItems =
      extractArray(
        responseData
      );


    if (programItems === null) {
      console.error(
        "Invalid plan items response:",
        responseData
      );


      return NextResponse.json(
        {
          message:
            "فهرست آیتم‌ها در پاسخ وب‌سرویس پیدا نشد.",

          details:
            responseData,
        },
        {
          status: 502,
        }
      );
    }


    /*
     * پاسخ یکپارچه برای Frontend
     */
    return NextResponse.json(
      {
        items:
          programItems,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Plan items route error:",
      error
    );


    return NextResponse.json(
      {
        message:
          "ارتباط با وب‌سرویس آیتم‌های برنامه برقرار نشد.",
      },
      {
        status: 500,
      }
    );
  }
}


/*
 * استخراج آرایه از حالت‌های مختلف پاسخ:
 *
 * [...]
 *
 * {
 *   items: [...]
 * }
 *
 * {
 *   data: [...]
 * }
 */
function extractArray(
  value: unknown
): unknown[] | null {
  if (Array.isArray(value)) {
    return value;
  }


  if (!isRecord(value)) {
    return null;
  }


  const possibleFields = [
    "items",
    "Items",

    "data",
    "Data",

    "result",
    "Result",

    "planItems",
    "PlanItems",
  ];


  for (
    const fieldName of
    possibleFields
  ) {
    const fieldValue =
      value[fieldName];


    if (Array.isArray(fieldValue)) {
      return fieldValue;
    }


    if (isRecord(fieldValue)) {
      const nestedItems =
        fieldValue.items ??
        fieldValue.Items ??
        fieldValue.planItems ??
        fieldValue.PlanItems;


      if (
        Array.isArray(
          nestedItems
        )
      ) {
        return nestedItems;
      }
    }
  }


  return null;
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
 * استخراج پیام خطا
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
 * حذف Slash انتهای Base URL
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
 * به انگلیسی
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