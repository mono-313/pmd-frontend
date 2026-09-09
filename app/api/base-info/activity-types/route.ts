import {
  NextResponse,
} from "next/server";


/*
 * آدرس وب‌سرویس اطلاعات پایه
 *
 * مقدار داخل .env.local در اولویت است.
 */
const BASE_INFO_API_URL =
  process.env.BASE_INFO_API_URL ??
  "http://172.16.60.34/api/v1/baseinfo";



//   آدرس Backend:
//  GET /activityTypes/{jobId}
 
export async function GET(
  request: Request
) {
  try {
    /*
     * دریافت jobId از Query String
     */
    const requestUrl =
      new URL(request.url);

    const jobIdParameter =
      requestUrl.searchParams.get(
        "jobId"
      );

    const jobId =
      parsePositiveInteger(
        jobIdParameter
      );


    if (jobId === null) {
      return NextResponse.json(
        {
          message:
            "شناسه شغل برای دریافت انواع فعالیت الزامی و باید یک عدد مثبت باشد.",
        },
        {
          status: 400,
        }
      );
    }


    /*
     * دریافت کلید وب‌سرویس اطلاعات پایه
     */
    const apiKey =
      process.env
        .BASE_INFO_API_KEY
        ?.trim();


    if (!apiKey) {
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


   
    const backendUrl =
      `${removeTrailingSlash(
        BASE_INFO_API_URL
      )}/activityTypes/${encodeURIComponent(
        String(jobId)
      )}`;


    const backendResponse =
      await fetch(
        backendUrl,
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",

            "X-API-KEY":
              apiKey,
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
     * نمایش جزئیات فقط در محیط Development
     */
    if (
      process.env.NODE_ENV ===
      "development"
    ) {
      console.log(
        "ACTIVITY TYPES RESPONSE:",
        {
          jobId,

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
     * پاسخ ناموفق Backend
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
              `کد پاسخ وب‌سرویس: ${backendResponse.status}`
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
     * Backend ممکن است پاسخ خالی برگرداند.
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
     * پاسخ موفق باید JSON باشد.
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
     * استخراج آرایه از ساختارهای مختلف پاسخ
     */
    const rawItems =
      extractArray(
        responseData
      );


    /*
     * به‌جای سخت‌گیری روی ساختار پاسخ،
     * اگر آرایه پیدا نشد لیست خالی برمی‌گردانیم.
     */
    if (rawItems === null) {
      console.error(
        "Activity types array not found:",
        responseData
      );

      return NextResponse.json(
        {
          items: [],
        },
        {
          status: 200,
        }
      );
    }


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


    /*
     * حذف گزینه‌های تکراری
     */
    const uniqueActivityTypes =
      Array.from(
        new Map(
          activityTypes.map(
            (activityType) => [
              activityType.id,
              activityType,
            ]
          )
        ).values()
      );


    return NextResponse.json(
      {
        items:
          uniqueActivityTypes,
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
          error instanceof Error
            ? error.message
            : "ارتباط با وب‌سرویس انواع فعالیت برقرار نشد.",
      },
      {
        status: 500,
      }
    );
  }
}


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
      const nestedArray =
        extractArray(
          fieldValue
        );


      if (nestedArray !== null) {
        return nestedArray;
      }
    }
  }


  return null;
}


/*
 * تبدیل jobId به عدد مثبت
 */
function parsePositiveInteger(
  value: string | null
): number | null {
  if (!value?.trim()) {
    return null;
  }


  const normalizedValue =
    normalizeDigits(
      value.trim()
    );


  const numericValue =
    Number(
      normalizedValue
    );


  if (
    !Number.isInteger(
      numericValue
    ) ||
    numericValue <= 0
  ) {
    return null;
  }


  return numericValue;
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
 * دریافت اولین نام معتبر
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
 * استخراج پیام خطای Backend
 */
function getErrorMessage(
  value: unknown
): string | null {
  if (!isRecord(value)) {
    return typeof value ===
      "string"
      ? value
      : null;
  }


  const possibleFields = [
    "message",
    "Message",

    "description",
    "Description",

    "detail",
    "Detail",

    "messageDetail",
    "MessageDetail",

    "title",
    "Title",
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
      return fieldValue.trim();
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


/*number-normalize*/
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