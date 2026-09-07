import {
  NextRequest,
  NextResponse,
} from "next/server";


const BASE_INFO_API_URL =
  process.env.BASE_INFO_API_URL ??
  "http://172.16.60.34/api/v1/baseinfo";


/*
 * GET /api/base-info/personnel
 *
 * نمونه:
 * /api/base-info/personnel?networkId=210
 *
 * یا:
 * /api/base-info/personnel?networkId=210&jobId=1
 */
export async function GET(
  request: NextRequest
) {
  try {
    const networkId =
      getOptionalPositiveInteger(
        request.nextUrl.searchParams.get(
          "networkId"
        )
      );

    const jobId =
      getOptionalPositiveInteger(
        request.nextUrl.searchParams.get(
          "jobId"
        )
      );


    /*
     * برای جلوگیری از دریافت اطلاعات
     * شبکه‌های نامرتبط، networkId
     * در Route داخلی الزامی است.
     */
    if (networkId === null) {
      return NextResponse.json(
        {
          message:
            "شناسه شبکه معتبر نیست.",
        },
        {
          status: 400,
        }
      );
    }


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
     * ساخت Query وب‌سرویس
     */
    const query =
      new URLSearchParams();

    query.set(
      "networkId",
      String(networkId)
    );


    if (jobId !== null) {
      query.set(
        "jobId",
        String(jobId)
      );
    }


    const backendUrl =
      `${removeTrailingSlash(
        BASE_INFO_API_URL
      )}` +
      `/personelProgramMaker?${query.toString()}`;


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
        "PERSONNEL RESPONSE:",
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
            getErrorMessage(
              responseData
            ) ??
            (
              "دریافت فهرست پرسنل انجام نشد. " +
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


    if (responseData === null) {
      return NextResponse.json(
        {
          message:
            "پاسخ وب‌سرویس پرسنل JSON معتبر نیست.",

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


    const rawItems =
      extractArray(
        responseData
      );


    if (rawItems === null) {
      console.error(
        "Invalid personnel response:",
        responseData
      );


      return NextResponse.json(
        {
          message:
            "فهرست پرسنل در پاسخ وب‌سرویس پیدا نشد.",

          details:
            responseData,
        },
        {
          status: 502,
        }
      );
    }


    /*
     * تبدیل پاسخ سرویس اطلاعات پایه
     * به ساختار یکپارچه Frontend
     */
    const personnel =
      rawItems
        .map(
          normalizePersonnelOption
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
          personnel,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Personnel route error:",
      error
    );


    return NextResponse.json(
      {
        message:
          "ارتباط با وب‌سرویس فهرست پرسنل برقرار نشد.",
      },
      {
        status: 500,
      }
    );
  }
}


/*
 * تبدیل پاسخ‌های مختلف سرویس
 * به { id, name }
 *
 * سرویس ممکن است از این نام‌ها
 * استفاده کند:
 *
 * Value / Text
 * value / text
 * Id / Name
 * id / name
 * PersonnelId / PersonnelName
 */
function normalizePersonnelOption(
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

        "personnelId",
        "PersonnelId",
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

        "personnelName",
        "PersonnelName",

        "fullName",
        "FullName",
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


  const fields = [
    "items",
    "Items",

    "data",
    "Data",

    "result",
    "Result",

    "personnel",
    "Personnel",
  ];


  for (const field of fields) {
    const fieldValue =
      value[field];


    if (Array.isArray(fieldValue)) {
      return fieldValue;
    }


    if (isRecord(fieldValue)) {
      const nestedItems =
        fieldValue.items ??
        fieldValue.Items;


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


    const numberValue =
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
        numberValue
      ) &&
      numberValue > 0
    ) {
      return numberValue;
    }
  }


  return null;
}


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


function getOptionalPositiveInteger(
  value:
    string | null
): number | null {
  if (!value?.trim()) {
    return null;
  }


  const numberValue =
    Number(
      normalizeDigits(
        value
      )
    );


  return (
    Number.isInteger(
      numberValue
    ) &&
    numberValue > 0
  )
    ? numberValue
    : null;
}


function getErrorMessage(
  value: unknown
): string | null {
  if (!isRecord(value)) {
    return null;
  }


  const fields = [
    "message",
    "Message",

    "description",
    "Description",

    "detail",
    "MessageDetail",
  ];


  for (const field of fields) {
    const fieldValue =
      value[field];


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


function removeTrailingSlash(
  value: string
): string {
  return value.replace(
    /\/+$/,
    ""
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