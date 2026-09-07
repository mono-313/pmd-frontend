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
  AttendanceType,
  ProfileExpertRequest,
  UpdateProfileExpertsRequest,
} from "@/app/types/program-profile";


/*
 * PUT /api/program-profiles/experts
 *
 * ثبت یا جایگزینی کامل کارشناسان
 * یک شناسنامه
 */
export async function PUT(
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
     * دریافت بدنه درخواست
     */
    const requestData =
      await request.json() as
        unknown;


    if (!isRecord(requestData)) {
      return NextResponse.json(
        {
          message:
            "ساختار اطلاعات کارشناسان معتبر نیست.",
        },
        {
          status: 400,
        }
      );
    }


    const profileId =
      getString(
        requestData,
        "profileId"
      );


    if (!profileId) {
      return NextResponse.json(
        {
          message:
            "شناسه شناسنامه الزامی است.",
        },
        {
          status: 400,
        }
      );
    }


    /*
     * طبق مستند، experts باید
     * آرایه باشد؛ اما می‌تواند
     * خالی باشد.
     */
    if (
      !Array.isArray(
        requestData.experts
      )
    ) {
      return NextResponse.json(
        {
          message:
            "فهرست کارشناسان معتبر نیست.",
        },
        {
          status: 400,
        }
      );
    }


    const normalizedExperts:
      ProfileExpertRequest[] = [];


    /*
     * تبدیل و اعتبارسنجی
     * کارشناسان
     */
    for (
      let index = 0;
      index <
      requestData.experts.length;
      index += 1
    ) {
      const expert =
        requestData.experts[index];


      if (!isRecord(expert)) {
        return badRequest(
          `اطلاعات کارشناس ردیف ${
            index + 1
          } معتبر نیست.`
        );
      }


      const expertId =
        getString(
          expert,
          "expertId"
        );


      const topicAxisId =
        getString(
          expert,
          "topicAxisId"
        );


      const duration =
        normalizeDigits(
          getString(
            expert,
            "duration"
          )
        );


      const attendanceType =
        getAttendanceType(
          expert.attendanceType
        );


      const hasPayment =
        getBoolean(
          expert,
          "hasPayment"
        );


      if (!expertId) {
        return badRequest(
          `شناسه کارشناس ردیف ${
            index + 1
          } الزامی است.`
        );
      }


      if (!topicAxisId) {
        return badRequest(
          `محور موضوعی کارشناس ردیف ${
            index + 1
          } انتخاب نشده است.`
        );
      }


      if (!isTimeSpan(duration)) {
        return badRequest(
          `مدت حضور کارشناس ردیف ${
            index + 1
          } باید با فرمت hh:mm:ss باشد.`
        );
      }


      if (
        attendanceType ===
        null
      ) {
        return badRequest(
          `نحوه حضور کارشناس ردیف ${
            index + 1
          } معتبر نیست.`
        );
      }


      if (hasPayment === null) {
        return badRequest(
          `وضعیت هزینه کارشناس ردیف ${
            index + 1
          } معتبر نیست.`
        );
      }


      normalizedExperts.push({
        expertId,

        topicAxisId,

        duration,

        attendanceType,

        hasPayment,
      });
    }


    /*
     * جلوگیری از ثبت تکراری
     * یک کارشناس برای یک محور
     */
    const duplicateExpert =
      findDuplicateExpert(
        normalizedExperts
      );


    if (duplicateExpert) {
      return badRequest(
        "یک کارشناس برای یک محور موضوعی بیش از یک‌بار انتخاب شده است."
      );
    }


    /*
     * بدنه دقیق مطابق مستند Backend
     */
    const backendBody:
      UpdateProfileExpertsRequest = {
      profileId,

      experts:
        normalizedExperts,
    };


    const backendUrl =
      `${removeTrailingSlash(
        API_CONFIG.baseUrl
      )}` +
      "/program-profiles/experts";


    if (
      process.env.NODE_ENV ===
      "development"
    ) {
      console.log(
        "UPDATE PROFILE EXPERTS REQUEST:",
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
            "PUT",

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
        "UPDATE PROFILE EXPERTS RESPONSE:",
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
              "ثبت کارشناسان شناسنامه انجام نشد. " +
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
     * پاسخ موفق
     *
     * ممکن است Backend یک
     * ProfileResponse کامل یا
     * پاسخ خالی برگرداند.
     */
    return NextResponse.json(
      {
        message:
          normalizedExperts.length >
          0
            ? "کارشناسان شناسنامه با موفقیت ثبت شدند."
            : "فهرست کارشناسان شناسنامه با موفقیت خالی شد.",

        profile:
          responseData,

        expertsSucceeded:
          true,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Update profile experts route error:",
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
          "ارتباط با وب‌سرویس ثبت کارشناسان شناسنامه برقرار نشد.",
      },
      {
        status: 500,
      }
    );
  }
}


/*
 * پیدا کردن کارشناس تکراری
 * برای یک محور مشخص
 */
function findDuplicateExpert(
  experts:
    ProfileExpertRequest[]
): boolean {
  const uniqueKeys =
    new Set<string>();


  for (const expert of experts) {
    const key =
      `${expert.expertId}` +
      "::" +
      `${expert.topicAxisId}`;


    if (uniqueKeys.has(key)) {
      return true;
    }


    uniqueKeys.add(key);
  }


  return false;
}


/*
 * تبدیل نحوه حضور به Enum
 */
function getAttendanceType(
  value: unknown
): AttendanceType | null {
  const normalizedValue =
    typeof value === "number"
      ? value
      : typeof value ===
            "string" &&
          value.trim()
        ? Number(
            normalizeDigits(
              value
            )
          )
        : Number.NaN;


  if (
    normalizedValue === 1 ||
    normalizedValue === 2 ||
    normalizedValue === 3 ||
    normalizedValue === 4
  ) {
    return normalizedValue;
  }


  return null;
}


/*
 * دریافت Boolean
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
 * فرمت TimeSpan
 *
 * نمونه:
 * 00:15:00
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
 * پاسخ داخلی 400
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
 * استخراج پیام خطای Backend
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