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


interface IssueProgramProfileRequest {
  forecastId: string;

  planId: number;

  networkId: number;

  networkGroupId: number;

  duration: string;

  broadcastDate: string;

  productionMethod: string;

  occasion: string;

  floorId: number;

  floorName: string;

  programDegreeId: number;

  programDegreeName: string;

  programStructureId: number;

  programStructureName: string;

  startTime: string;

  crewMembers:
    IssueCrewMemberRequest[];

  items:
    IssueProgramItemRequest[];
}


interface IssueCrewMemberRequest {
  personnelId: number;

  personnelName: string;

  activityTypeId: number;

  activityTypeName: string;

  isPresent: boolean;
}


interface IssueProgramItemRequest {
  itemName: string;

  productionType: string;

  duration: string;
}


/*
 * POST /api/program-profiles/issue
 *
 * دریافت اطلاعات فرم از Frontend
 * و ارسال آن به Backend اصلی
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
      return jsonError(
        "نشست کاربری معتبر نیست. دوباره وارد سامانه شوید.",
        401
      );
    }


    /*
     * دریافت Body به‌صورت unknown
     */
    const requestData =
      await request.json() as
        unknown;


    /*
     * بررسی ساختار Body
     */
    if (
      !isIssueProgramProfileRequest(
        requestData
      )
    ) {
      return jsonError(
        "ساختار اطلاعات شناسنامه معتبر نیست.",
        400
      );
    }


    /*
     * پاک‌سازی و تبدیل ارقام فارسی
     */
    const broadcastDate =
      normalizeDigits(
        requestData.broadcastDate
          .trim()
      );

    const duration =
      normalizeDigits(
        requestData.duration
          .trim()
      );

    const startTime =
      normalizeDigits(
        requestData.startTime
          .trim()
      );


    /*
     * اعتبارسنجی مقادیر اصلی
     */
    const validationMessage =
      validateIssueRequest({
        ...requestData,

        broadcastDate,

        duration,

        startTime,
      });

    if (validationMessage) {
      return jsonError(
        validationMessage,
        400
      );
    }


    /*
     * ساخت بدنه دقیق Backend
     */
    const backendBody:
      IssueProgramProfileRequest = {
      forecastId:
        requestData.forecastId
          .trim(),

      planId:
        requestData.planId,

      networkId:
        requestData.networkId,

      networkGroupId:
        requestData.networkGroupId,

      duration,

      broadcastDate,

      productionMethod:
        requestData.productionMethod
          .trim(),

      occasion:
        requestData.occasion
          .trim(),

      floorId:
        requestData.floorId,

      floorName:
        requestData.floorName
          .trim(),

      programDegreeId:
        requestData.programDegreeId,

      programDegreeName:
        requestData.programDegreeName
          .trim(),

      programStructureId:
        requestData.programStructureId,

      programStructureName:
        requestData.programStructureName
          .trim(),

      startTime,

      crewMembers:
        requestData.crewMembers.map(
          (crewMember) => ({
            personnelId:
              crewMember.personnelId,

            personnelName:
              crewMember.personnelName
                .trim(),

            activityTypeId:
              crewMember.activityTypeId,

            activityTypeName:
              crewMember.activityTypeName
                .trim(),

            isPresent:
              crewMember.isPresent,
          })
        ),

      items:
        requestData.items.map(
          (item) => ({
            itemName:
              item.itemName
                .trim(),

            productionType:
              item.productionType
                .trim(),

            duration:
              normalizeDigits(
                item.duration.trim()
              ),
          })
        ),
    };


    const backendUrl =
      `${API_CONFIG.baseUrl}` +
      `${API_ENDPOINTS.programProfiles.issue}`;


    /*
     * برای عیب‌یابی در ترمینال Next.js
     */
    console.log(
      "Issue program profile request:",
      {
        backendUrl,

        requestBody:
          backendBody,
      }
    );


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


    /*
     * پاسخ ابتدا Text خوانده می‌شود
     * تا پاسخ خالی موجب خطای JSON نشود.
     */
    const responseText =
      await backendResponse.text();

    const responseData =
      parseJsonResponse(
        responseText
      );


    /*
     * خطای Backend
     */
    if (!backendResponse.ok) {
      console.error(
        "Issue program profile backend error:",
        {
          url:
            backendUrl,

          status:
            backendResponse.status,

          statusText:
            backendResponse.statusText,

          requestBody:
            backendBody,

          responseText,
        }
      );

      return NextResponse.json(
        {
          message:
            getApiErrorMessage(
              responseData
            ) ??
            (
              responseText.trim()
                ? responseText
                : `صدور شناسنامه انجام نشد. کد پاسخ Backend: ${backendResponse.status}`
            ),

          status:
            backendResponse.status,
        },
        {
          status:
            backendResponse.status,
        }
      );
    }


    /*
     * طبق مستند پاسخ موفق 201
     * شامل ProfileResponse است.
     */
    if (
      responseData !== null &&
      !isRecord(
        responseData
      )
    ) {
      console.error(
        "Invalid issue profile response:",
        {
          status:
            backendResponse.status,

          responseText,
        }
      );

      return jsonError(
        "ساختار پاسخ صدور شناسنامه معتبر نیست.",
        502
      );
    }


    return NextResponse.json(
      {
        message:
          "شناسنامه با موفقیت صادر شد.",

        profile:
          responseData,
      },
      {
        status:
          201,
      }
    );
  } catch (error) {
    console.error(
      "Issue program profile route error:",
      error
    );

    if (
      error instanceof SyntaxError
    ) {
      return jsonError(
        "اطلاعات ارسال‌شده JSON معتبر نیست.",
        400
      );
    }

    return jsonError(
      "ارتباط با وب‌سرویس صدور شناسنامه برقرار نشد.",
      500
    );
  }
}


/*
 * بررسی ساختار درخواست
 */
function isIssueProgramProfileRequest(
  value: unknown
): value is IssueProgramProfileRequest {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.forecastId ===
      "string" &&

    typeof value.planId ===
      "number" &&

    typeof value.networkId ===
      "number" &&

    typeof value.networkGroupId ===
      "number" &&

    typeof value.duration ===
      "string" &&

    typeof value.broadcastDate ===
      "string" &&

    typeof value.productionMethod ===
      "string" &&

    typeof value.occasion ===
      "string" &&

    typeof value.floorId ===
      "number" &&

    typeof value.floorName ===
      "string" &&

    typeof value.programDegreeId ===
      "number" &&

    typeof value.programDegreeName ===
      "string" &&

    typeof value.programStructureId ===
      "number" &&

    typeof value.programStructureName ===
      "string" &&

    typeof value.startTime ===
      "string" &&

    Array.isArray(
      value.crewMembers
    ) &&

    value.crewMembers.every(
      isCrewMemberRequest
    ) &&

    Array.isArray(
      value.items
    ) &&

    value.items.every(
      isProgramItemRequest
    )
  );
}


/*
 * بررسی هر عامل برنامه
 */
function isCrewMemberRequest(
  value: unknown
): value is IssueCrewMemberRequest {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.personnelId ===
      "number" &&

    typeof value.personnelName ===
      "string" &&

    typeof value.activityTypeId ===
      "number" &&

    typeof value.activityTypeName ===
      "string" &&

    typeof value.isPresent ===
      "boolean"
  );
}


/*
 * بررسی هر آیتم برنامه
 */
function isProgramItemRequest(
  value: unknown
): value is IssueProgramItemRequest {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.itemName ===
      "string" &&

    typeof value.productionType ===
      "string" &&

    typeof value.duration ===
      "string"
  );
}


/*
 * اعتبارسنجی محتوای درخواست
 */
function validateIssueRequest(
  value: IssueProgramProfileRequest
): string | null {
  if (
    !isGuid(
      value.forecastId
    )
  ) {
    return "شناسه پیش‌بینی معتبر نیست.";
  }

  if (
    !isPositiveInteger(
      value.planId
    )
  ) {
    return "شناسه برنامه معتبر نیست.";
  }

  if (
    !isPositiveInteger(
      value.networkId
    )
  ) {
    return "شناسه شبکه معتبر نیست.";
  }

  if (
    !isPositiveInteger(
      value.networkGroupId
    )
  ) {
    return "شناسه گروه برنامه‌ساز معتبر نیست.";
  }

  if (
    !isDuration(
      value.duration
    )
  ) {
    return "مدت برنامه باید با فرمت hh:mm:ss وارد شود.";
  }

  if (
    !value.broadcastDate ||
    Number.isNaN(
      Date.parse(
        value.broadcastDate
      )
    )
  ) {
    return "تاریخ پخش معتبر نیست.";
  }

  if (
    !value.productionMethod
      .trim()
  ) {
    return "نحوه تولید الزامی است.";
  }

  if (
    !value.occasion.trim()
  ) {
    return "مناسبت الزامی است.";
  }

  if (
    !isPositiveInteger(
      value.floorId
    )
  ) {
    return "شناسه طبقه برنامه معتبر نیست.";
  }

  if (
    !value.floorName.trim()
  ) {
    return "نام طبقه برنامه الزامی است.";
  }

  if (
    !isPositiveInteger(
      value.programDegreeId
    )
  ) {
    return "شناسه درجه برنامه معتبر نیست.";
  }

  if (
    !value.programDegreeName
      .trim()
  ) {
    return "نام درجه برنامه الزامی است.";
  }

  if (
    !isPositiveInteger(
      value.programStructureId
    )
  ) {
    return "شناسه ساختار برنامه معتبر نیست.";
  }

  if (
    !value.programStructureName
      .trim()
  ) {
    return "نام ساختار برنامه الزامی است.";
  }

  if (
    !isStartTime(
      value.startTime
    )
  ) {
    return "ساعت شروع باید با فرمت hh:mm:ss وارد شود.";
  }


  for (
    const crewMember of
    value.crewMembers
  ) {
    if (
      !isPositiveInteger(
        crewMember.personnelId
      ) ||
      !crewMember.personnelName
        .trim() ||
      !isPositiveInteger(
        crewMember.activityTypeId
      ) ||
      !crewMember.activityTypeName
        .trim()
    ) {
      return "اطلاعات عوامل برنامه کامل یا معتبر نیست.";
    }
  }


  for (
    const item of
    value.items
  ) {
    if (
      !item.itemName.trim() ||
      !item.productionType
        .trim() ||
      !isDuration(
        item.duration
      )
    ) {
      return "اطلاعات آیتم‌های برنامه کامل یا معتبر نیست.";
    }
  }

  return null;
}


/*
 * Guid استاندارد
 */
function isGuid(
  value: string
): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim()
  );
}


/*
 * اعداد مثبت
 */
function isPositiveInteger(
  value: number
): boolean {
  return (
    Number.isInteger(value) &&
    value > 0
  );
}


/*
 * مدت زمان با فرمت TimeSpan
 *
 * ساعت مدت برنامه می‌تواند
 * بیشتر از 23 باشد.
 */
function isDuration(
  value: string
): boolean {
  return /^\d{2,3}:[0-5]\d:[0-5]\d$/.test(
    normalizeDigits(
      value.trim()
    )
  );
}


/*
 * ساعت شروع بین 00 تا 23
 */
function isStartTime(
  value: string
): boolean {
  return /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(
    normalizeDigits(
      value.trim()
    )
  );
}


/*
 * تبدیل ارقام فارسی و عربی
 * به ارقام انگلیسی
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
 * استخراج پیام خطای Backend
 */
function getApiErrorMessage(
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

  const validationMessages =
    getValidationMessages(
      value.errors
    );

  if (
    validationMessages.length > 0
  ) {
    return validationMessages.join(
      "، "
    );
  }

  if (
    typeof value.title ===
    "string"
  ) {
    return value.title;
  }

  return null;
}


/*
 * استخراج خطاهای Validation
 */
function getValidationMessages(
  value: unknown
): string[] {
  if (!isRecord(value)) {
    return [];
  }

  return Object.values(
    value
  ).flatMap((errorValue) => {
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
  });
}


/*
 * تشخیص Object
 */
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


/*
 * پاسخ خطای استاندارد
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