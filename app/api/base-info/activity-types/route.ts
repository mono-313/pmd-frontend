import {
  NextResponse,
} from "next/server";


const BASE_INFO_API_URL =
  process.env.BASE_INFO_API_URL ??
  "http://172.16.60.34/api/v1/baseinfo";


/*
 * GET /api/base-info/activity-types
 *
 * دریافت انواع فعالیت از
 * وب‌سرویس اطلاعات پایه
 */
export async function GET() {
  try {
    /*
     * کلید وب‌سرویس اطلاعات پایه
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
     * ساخت آدرس Backend
     */
    const backendUrl =
      `${removeTrailingSlash(
        BASE_INFO_API_URL
      )}` +
      "/activityTypes";


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
        "ACTIVITY TYPES RESPONSE:",
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
     * پاسخ ناموفق سرویس
     */
    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message:
            getErrorMessage(
              responseData
            ) ??
            (
              "دریافت انواع فعالیت انجام نشد. " +
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
     * پاسخ خالی
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
     * پاسخ غیر JSON
     */
    if (responseData === null) {
      return NextResponse.json(
        {
          message:
            "پاسخ وب‌سرویس انواع فعالیت JSON معتبر نیست.",

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
     * استخراج آرایه از پاسخ
     */
    const rawItems =
      extractArray(
        responseData
      );


    if (rawItems === null) {
      console.error(
        "Invalid activity types response:",
        responseData
      );


      return NextResponse.json(
        {
          message:
            "فهرست انواع فعالیت در پاسخ وب‌سرویس پیدا نشد.",

          details:
            responseData,
        },
        {
          status: 502,
        }
      );
    }


    /*
     * تبدیل پاسخ سرویس به:
     *
     * {
     *   id: number,
     *   name: string
     * }
     */
    const activityTypes =
      rawItems
        .map(
          normalizeActivityOption
        )
        .filter(
          (
            item
          ): item is {
            id: number;
            name: string;
          } =>
            item !== null
        );


    return NextResponse.json(
      {
        items:
          activityTypes,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Activity types route error:",
      error
    );


    return NextResponse.json(
      {
        message:
          "ارتباط با وب‌سرویس انواع فعالیت برقرار نشد.",
      },
      {
        status: 500,
      }
    );
  }
}


/*
 * تبدیل ساختارهای مختلف پاسخ
 * به مدل یکپارچه Frontend
 */
function normalizeActivityOption(
  value: unknown
): {
  id: number;
  name: string;
} | null {
  if (!isRecord(value)) {
    return null;
  }


  const id =
    getFirstPositiveInteger(
      value,
      [
        "id",
        "Id",

        "value",
        "Value",

        "activityTypeId",
        "ActivityTypeId",
      ]
    );


  const name =
    getFirstString(
      value,
      [
        "name",
        "Name",

        "text",
        "Text",

        "title",
        "Title",

        "activityTypeName",
        "ActivityTypeName",
      ]
    );


  if (
    id === null ||
    !name
  ) {
    return null;
  }


  return {
    id,
    name,
  };
}


/*
 * پاسخ سرویس ممکن است مستقیماً
 * آرایه یا داخل یک Property باشد.
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

    "activityTypes",
    "ActivityTypes",
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
        fieldValue.activityTypes ??
        fieldValue.ActivityTypes;


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
 * دریافت اولین شناسه معتبر
 */
function getFirstPositiveInteger(
  value: Record<
    string,
    unknown
  >,
  propertyNames:
    string[]
): number | null {
  for (
    const propertyName of
    propertyNames
  ) {
    const propertyValue =
      value[propertyName];


    const numericValue =
      typeof propertyValue ===
        "number"
        ? propertyValue
        : typeof propertyValue ===
              "string" &&
            propertyValue.trim()
          ? Number(
              normalizeDigits(
                propertyValue
              )
            )
          : Number.NaN;


    if (
      Number.isInteger(
        numericValue
      ) &&
      numericValue > 0
    ) {
      return numericValue;
    }
  }


  return null;
}


/*
 * دریافت اولین عنوان معتبر
 */
function getFirstString(
  value: Record<
    string,
    unknown
  >,
  propertyNames:
    string[]
): string {
  for (
    const propertyName of
    propertyNames
  ) {
    const propertyValue =
      value[propertyName];


    if (
      typeof propertyValue ===
        "string" &&
      propertyValue.trim()
    ) {
      return propertyValue.trim();
    }
  }


  return "";
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
 * تبدیل اعداد فارسی و عربی
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