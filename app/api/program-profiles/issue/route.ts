import {
  NextResponse,
} from "next/server";

import {
  cookies,
} from "next/headers";

import {
  API_CONFIG,
} from "@/app/lib/api-config";

import type {
  IssueProgramProfileRequest,
  ProfileCrewMemberData,
  ProfileItemData,
} from "@/app/types/program-profile";


/*
 * POST /api/program-profiles/issue
 *
 * صدور شناسنامه از روی
 * Forecast تأییدشده
 */
export async function POST(
  request: Request
) {
  try {
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
     * خواندن بدنه درخواست
     */
    const requestData =
      await request.json() as
        unknown;


    if (!isRecord(requestData)) {
      return NextResponse.json(
        {
          message:
            "ساختار اطلاعات شناسنامه معتبر نیست.",
        },
        {
          status: 400,
        }
      );
    }


    /*
     * استخراج و نرمال‌سازی
     * اطلاعات اصلی
     */
    const forecastId =
      getString(
        requestData,
        "forecastId"
      );

    const planId =
      getPositiveInteger(
        requestData,
        "planId"
      );

    const networkId =
      getPositiveInteger(
        requestData,
        "networkId"
      );

    const networkGroupId =
      getPositiveInteger(
        requestData,
        "networkGroupId"
      );

    const duration =
      normalizeDigits(
        getString(
          requestData,
          "duration"
        )
      );

    const broadcastDate =
      normalizeDigits(
        getString(
          requestData,
          "broadcastDate"
        )
      );

    const productionMethod =
      getString(
        requestData,
        "productionMethod"
      );

    const occasion =
      getString(
        requestData,
        "occasion"
      );

    const floorId =
      getPositiveInteger(
        requestData,
        "floorId"
      );

    const floorName =
      getString(
        requestData,
        "floorName"
      );

    const programDegreeId =
      getPositiveInteger(
        requestData,
        "programDegreeId"
      );

    const programDegreeName =
      getString(
        requestData,
        "programDegreeName"
      );

    const programStructureId =
      getPositiveInteger(
        requestData,
        "programStructureId"
      );

    const programStructureName =
      getString(
        requestData,
        "programStructureName"
      );

    const startTime =
      normalizeDigits(
        getString(
          requestData,
          "startTime"
        )
      );


    /*
     * اعتبارسنجی اطلاعات اصلی
     */
    if (!forecastId) {
      return badRequest(
        "شناسه پیش‌بینی الزامی است."
      );
    }


    if (planId === null) {
      return badRequest(
        "شناسه برنامه معتبر نیست."
      );
    }


    if (networkId === null) {
      return badRequest(
        "شناسه شبکه معتبر نیست."
      );
    }


    if (
      networkGroupId ===
      null
    ) {
      return badRequest(
        "شناسه گروه برنامه‌ساز معتبر نیست."
      );
    }


    if (!isTimeSpan(duration)) {
      return badRequest(
        "مدت برنامه باید با فرمت hh:mm:ss وارد شود."
      );
    }


    if (
      !broadcastDate ||
      Number.isNaN(
        Date.parse(
          broadcastDate
        )
      )
    ) {
      return badRequest(
        "تاریخ پخش معتبر نیست."
      );
    }


    if (!productionMethod) {
      return badRequest(
        "نحوه تولید الزامی است."
      );
    }


    if (!occasion) {
      return badRequest(
        "مناسبت الزامی است."
      );
    }


    if (floorId === null) {
      return badRequest(
        "شناسه طبقه برنامه معتبر نیست."
      );
    }


    if (!floorName) {
      return badRequest(
        "نام طبقه برنامه الزامی است."
      );
    }


    if (
      programDegreeId ===
      null
    ) {
      return badRequest(
        "شناسه درجه برنامه معتبر نیست."
      );
    }


    if (!programDegreeName) {
      return badRequest(
        "نام درجه برنامه الزامی است."
      );
    }


    if (
      programStructureId ===
      null
    ) {
      return badRequest(
        "شناسه ساختار برنامه معتبر نیست."
      );
    }


    if (
      !programStructureName
    ) {
      return badRequest(
        "نام ساختار برنامه الزامی است."
      );
    }


    if (!isClockTime(startTime)) {
      return badRequest(
        "ساعت شروع باید با فرمت hh:mm:ss وارد شود."
      );
    }


    /*
     * تبدیل عوامل برنامه
     */
    const crewResult =
      normalizeCrewMembers(
        requestData.crewMembers
      );


    if (!crewResult.ok) {
      return badRequest(
        crewResult.message
      );
    }


    /*
     * تبدیل آیتم‌های برنامه
     */
    const itemsResult =
      normalizeProgramItems(
        requestData.items
      );


    if (!itemsResult.ok) {
      return badRequest(
        itemsResult.message
      );
    }


    /*
     * Payload دقیق مطابق مستند
     *
     * mainTopic و hasExpert
     * عمداً ارسال نمی‌شوند؛
     * Backend آن‌ها را از Forecast
     * دریافت می‌کند.
     */
    const backendBody:
      IssueProgramProfileRequest = {
      forecastId,

      planId,

      networkId,

      networkGroupId,

      duration,

      broadcastDate,

      productionMethod,

      occasion,

      floorId,

      floorName,

      programDegreeId,

      programDegreeName,

      programStructureId,

      programStructureName,

      startTime,

      crewMembers:
        crewResult.items,

      items:
        itemsResult.items,
    };


    const backendUrl =
      `${removeTrailingSlash(
        API_CONFIG.baseUrl
      )}` +
      "/program-profiles/issue";


    if (
      process.env.NODE_ENV ===
      "development"
    ) {
      console.log(
        "ISSUE PROFILE REQUEST:",
        {
          backendUrl,

          backendBody,
        }
      );
    }


    /*
     * ارسال درخواست به Backend
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


    if (
      process.env.NODE_ENV ===
      "development"
    ) {
      console.log(
        "ISSUE PROFILE RESPONSE:",
        {
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
              "صدور شناسنامه انجام نشد. " +
              "کد پاسخ Backend: " +
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
     * طبق مستند، Backend باید
     * ProfileResponse برگرداند.
     *
     * برای ثبت کارشناسان به id
     * شناسنامه نیاز داریم.
     */
    const issuedProfile =
      extractIssuedProfile(
        responseData
      );


    if (!issuedProfile) {
      console.error(
        "Issued profile id not found:",
        responseData ??
        responseText
      );


      return NextResponse.json(
        {
          message:
            "شناسنامه صادر شد؛ اما شناسه شناسنامه در پاسخ Backend پیدا نشد.",

          details:
            responseData ??
            responseText,
        },
        {
          status: 502,
        }
      );
    }


    /*
     * پاسخ یکپارچه Route داخلی
     */
    return NextResponse.json(
      {
        message:
          "شناسنامه با موفقیت صادر شد.",

        profile:
          issuedProfile,

        issueSucceeded:
          true,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Issue program profile route error:",
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
          "ارتباط با وب‌سرویس صدور شناسنامه برقرار نشد.",
      },
      {
        status: 500,
      }
    );
  }
}


/*
 * تبدیل و اعتبارسنجی عوامل
 */
function normalizeCrewMembers(
  value: unknown
):
  | {
      ok: true;
      items:
        ProfileCrewMemberData[];
    }
  | {
      ok: false;
      message: string;
    } {
  /*
   * طبق مستند آرایه الزامی است؛
   * ولی می‌تواند خالی باشد.
   */
  if (!Array.isArray(value)) {
    return {
      ok: false,

      message:
        "ساختار عوامل برنامه معتبر نیست.",
    };
  }


  const items:
    ProfileCrewMemberData[] = [];


  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    const item =
      value[index];


    if (!isRecord(item)) {
      return {
        ok: false,

        message:
          `اطلاعات عامل ردیف ${
            index + 1
          } معتبر نیست.`,
      };
    }


    const personnelId =
      getPositiveInteger(
        item,
        "personnelId"
      );

    const personnelName =
      getString(
        item,
        "personnelName"
      );

    const activityTypeId =
      getPositiveInteger(
        item,
        "activityTypeId"
      );

    const activityTypeName =
      getString(
        item,
        "activityTypeName"
      );

    const isPresent =
      getBoolean(
        item,
        "isPresent"
      );


    if (personnelId === null) {
      return {
        ok: false,

        message:
          `شناسه پرسنل ردیف ${
            index + 1
          } معتبر نیست.`,
      };
    }


    if (!personnelName) {
      return {
        ok: false,

        message:
          `نام پرسنل ردیف ${
            index + 1
          } الزامی است.`,
      };
    }


    if (
      activityTypeId === null
    ) {
      return {
        ok: false,

        message:
          `نوع فعالیت ردیف ${
            index + 1
          } معتبر نیست.`,
      };
    }


    if (!activityTypeName) {
      return {
        ok: false,

        message:
          `عنوان فعالیت ردیف ${
            index + 1
          } الزامی است.`,
      };
    }


    if (isPresent === null) {
      return {
        ok: false,

        message:
          `وضعیت حضور عامل ردیف ${
            index + 1
          } معتبر نیست.`,
      };
    }


    items.push({
      personnelId,

      personnelName,

      activityTypeId,

      activityTypeName,

      isPresent,
    });
  }


  return {
    ok: true,
    items,
  };
}


/*
 * تبدیل و اعتبارسنجی آیتم‌ها
 */
function normalizeProgramItems(
  value: unknown
):
  | {
      ok: true;
      items:
        ProfileItemData[];
    }
  | {
      ok: false;
      message: string;
    } {
  /*
   * طبق مستند آرایه الزامی است؛
   * ولی می‌تواند خالی باشد.
   */
  if (!Array.isArray(value)) {
    return {
      ok: false,

      message:
        "ساختار آیتم‌های برنامه معتبر نیست.",
    };
  }


  const items:
    ProfileItemData[] = [];


  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    const item =
      value[index];


    if (!isRecord(item)) {
      return {
        ok: false,

        message:
          `اطلاعات آیتم ردیف ${
            index + 1
          } معتبر نیست.`,
      };
    }


    const itemName =
      getString(
        item,
        "itemName"
      );

    const productionType =
      getString(
        item,
        "productionType"
      );

    const duration =
      normalizeDigits(
        getString(
          item,
          "duration"
        )
      );


    if (!itemName) {
      return {
        ok: false,

        message:
          `عنوان آیتم ردیف ${
            index + 1
          } الزامی است.`,
      };
    }


    if (!productionType) {
      return {
        ok: false,

        message:
          `نوع تولید آیتم ردیف ${
            index + 1
          } الزامی است.`,
      };
    }


    if (!isTimeSpan(duration)) {
      return {
        ok: false,

        message:
          `مدت آیتم ردیف ${
            index + 1
          } باید با فرمت hh:mm:ss باشد.`,
      };
    }


    items.push({
      itemName,

      productionType,

      duration,
    });
  }


  return {
    ok: true,
    items,
  };
}


/*
 * استخراج Profile از حالت‌های مختلف:
 *
 * ProfileResponse
 *
 * { profile: ProfileResponse }
 *
 * { data: ProfileResponse }
 *
 * { data: { profile: ProfileResponse } }
 */
function extractIssuedProfile(
  value: unknown
): Record<
  string,
  unknown
> | null {
  if (!isRecord(value)) {
    return null;
  }


  const candidates:
    unknown[] = [
    value,

    value.profile,

    value.data,

    value.result,
  ];


  if (isRecord(value.data)) {
    candidates.push(
      value.data.profile,

      value.data.result
    );
  }


  for (
    const candidate of
    candidates
  ) {
    if (
      isRecord(candidate) &&
      typeof candidate.id ===
        "string" &&
      candidate.id.trim()
    ) {
      return candidate;
    }
  }


  return null;
}


/*
 * پاسخ 400 داخلی
 */
function badRequest(
  message: string
) {
  return NextResponse.json(
    {
      message,
    },
    {
      status: 400,
    }
  );
}


/*
 * بررسی فرمت TimeSpan
 *
 * نمونه:
 * 01:00:00
 * 100:00:00
 */
function isTimeSpan(
  value: string
): boolean {
  return (
    /^\d{2,}:[0-5]\d:[0-5]\d$/
      .test(value)
  );
}


/*
 * بررسی ساعت شبانه‌روز
 *
 * نمونه:
 * 20:30:00
 */
function isClockTime(
  value: string
): boolean {
  return (
    /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/
      .test(value)
  );
}


/*
 * دریافت String
 */
function getString(
  value: Record<
    string,
    unknown
  >,
  propertyName: string
): string {
  const propertyValue =
    value[propertyName];


  return typeof propertyValue ===
    "string"
    ? propertyValue.trim()
    : "";
}


/*
 * دریافت عدد صحیح مثبت
 */
function getPositiveInteger(
  value: Record<
    string,
    unknown
  >,
  propertyName: string
): number | null {
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


  return (
    Number.isInteger(
      numericValue
    ) &&
    numericValue > 0
  )
    ? numericValue
    : null;
}


/*
 * دریافت مقدار Boolean
 */
function getBoolean(
  value: Record<
    string,
    unknown
  >,
  propertyName: string
): boolean | null {
  const propertyValue =
    value[propertyName];


  if (
    propertyValue === true ||
    propertyValue === "true" ||
    propertyValue === 1 ||
    propertyValue === "1"
  ) {
    return true;
  }


  if (
    propertyValue === false ||
    propertyValue === "false" ||
    propertyValue === 0 ||
    propertyValue === "0"
  ) {
    return false;
  }


  return null;
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


  const fields = [
    "message",
    "description",
    "detail",
    "title",
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


  /*
   * پشتیبانی از:
   * details: {
   *   detail: "..."
   * }
   */
  if (isRecord(value.details)) {
    return getErrorMessage(
      value.details
    );
  }


  return null;
}


/*
 * تبدیل Text به JSON
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
 * حذف Slash انتهای URL
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
 * بررسی Object
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