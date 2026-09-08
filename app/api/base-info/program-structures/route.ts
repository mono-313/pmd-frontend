import {
  NextResponse,
} from "next/server";


const BASE_INFO_API_URL =
  process.env.BASE_INFO_API_URL ??
  "http://172.16.60.34/api/v1/baseinfo";


export async function GET() {
  try {
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
      )}/structurePrograms`;


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


    return createLookupResponse(
      backendResponse,
      "دریافت ساختارهای برنامه انجام نشد."
    );
  } catch (error) {
    console.error(
      "Program structures route error:",
      error
    );


    return NextResponse.json(
      {
        message:
          "ارتباط با وب‌سرویس ساختارهای برنامه برقرار نشد.",
      },
      {
        status: 500,
      }
    );
  }
}


async function createLookupResponse(
  backendResponse: Response,
  fallbackMessage: string
) {
  const responseText =
    await backendResponse.text();

  const responseData =
    parseJsonResponse(
      responseText
    );


  if (!backendResponse.ok) {
    return NextResponse.json(
      {
        message:
          getErrorMessage(
            responseData
          ) ??
          `${fallbackMessage} کد پاسخ: ${backendResponse.status}`,

        details:
          responseData ??
          responseText,
      },
      {
        status:
          backendResponse.status,
      }
    );
  }


  const options =
    normalizeLookupOptions(
      extractArray(
        responseData
      )
    );


  return NextResponse.json(
    {
      items:
        options,
    },
    {
      status: 200,
    }
  );
}


function normalizeLookupOptions(
  values: unknown[]
): Array<{
  id: number;
  name: string;
}> {
  return values.flatMap(
    (value) => {
      if (!isRecord(value)) {
        return [];
      }


      const rawId =
        value.Value ??
        value.value ??
        value.Id ??
        value.id;


      const rawName =
        value.Text ??
        value.text ??
        value.Name ??
        value.name;


      const id =
        typeof rawId === "number"
          ? rawId
          : typeof rawId === "string"
            ? Number(rawId)
            : Number.NaN;


      const name =
        typeof rawName === "string"
          ? rawName.trim()
          : "";


      return (
        Number.isFinite(id) &&
        id > 0 &&
        name
      )
        ? [
            {
              id,
              name,
            },
          ]
        : [];
    }
  );
}


function extractArray(
  value: unknown
): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }


  if (!isRecord(value)) {
    return [];
  }


  for (
    const nestedValue of
    Object.values(value)
  ) {
    const result =
      extractArray(
        nestedValue
      );


    if (result.length > 0) {
      return result;
    }
  }


  return [];
}


function parseJsonResponse(
  value: string
): unknown | null {
  try {
    return value.trim()
      ? JSON.parse(value) as unknown
      : null;
  } catch {
    return null;
  }
}


function getErrorMessage(
  value: unknown
): string | null {
  if (!isRecord(value)) {
    return null;
  }


  const message =
    value.Message ??
    value.message ??
    value.Detail ??
    value.detail;


  return typeof message === "string"
    ? message
    : null;
}


function removeTrailingSlash(
  value: string
): string {
  return value.replace(
    /\/+$/,
    ""
  );
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