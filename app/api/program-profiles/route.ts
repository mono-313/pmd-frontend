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
  ProgramProfileListResponse,
  ProgramProfilePagination,
  ProgramProfileResponse,
} from "@/app/types/program-profile";


const QUERY_PARAMETERS = [
  "planId",
  "fromDate",
  "toDate",
  "pageNumber",
  "pageSize",
] as const;


/*
 * GET /api/program-profiles
 */
export async function GET(
  request: Request
) {
  try {
    const cookieStore =
      await cookies();

    const accessToken =
      cookieStore.get(
        "access-token"
      )?.value;

    if (!accessToken) {
      return jsonError(
        "نشست کاربری معتبر نیست.",
        401
      );
    }


    const requestUrl =
      new URL(
        request.url
      );

    // مدیر گروه باید پیش‌نویس‌ها را نبیند؛ این مسیر فقط فهرست را تغییر می‌دهد.
    // سایر نقش‌ها دقیقاً از مسیر فعلی Backend استفاده می‌کنند.
    if (isNetworkGroupManagerToken(accessToken)) {
      return await getNetworkGroupProfiles(
        accessToken,
        requestUrl
      );
    }

    const backendUrl =
      new URL(
        `${API_CONFIG.baseUrl}` +
          `${API_ENDPOINTS.programProfiles.list}`
      );


    /*
     * انتقال فیلترها به Backend
     */
    for (
      const parameterName of
      QUERY_PARAMETERS
    ) {
      const parameterValue =
        requestUrl.searchParams.get(
          parameterName
        );

      if (
        parameterValue?.trim()
      ) {
        backendUrl.searchParams.set(
          parameterName,
          parameterValue
        );
      }
    }


    if (
      !backendUrl.searchParams.has(
        "pageNumber"
      )
    ) {
      backendUrl.searchParams.set(
        "pageNumber",
        "1"
      );
    }

    if (
      !backendUrl.searchParams.has(
        "pageSize"
      )
    ) {
      backendUrl.searchParams.set(
        "pageSize",
        "10"
      );
    }


    const backendResponse =
      await fetch(
        backendUrl.toString(),
        {
          method:
            "GET",

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


    const responseText =
      await backendResponse.text();

    const responseData =
      parseJsonResponse(
        responseText
      );


    if (!backendResponse.ok) {
      console.error(
        "Program profiles backend error:",
        {
          url:
            backendUrl.toString(),

          status:
            backendResponse.status,

          responseText,
        }
      );

      return NextResponse.json(
        {
          message:
            getApiErrorMessage(
              responseData
            ) ??
            `دریافت شناسنامه‌ها انجام نشد. کد پاسخ Backend: ${backendResponse.status}`,
        },
        {
          status:
            backendResponse.status,
        }
      );
    }


    /*
     * طبق مستند Backend آرایه مستقیم
     * ProfileResponse برمی‌گرداند.
     */
    const profiles =
      getProfileItems(
        responseData
      );

    if (!profiles) {
      console.error(
        "Invalid profiles list:",
        {
          responseData,
          responseText,
        }
      );

      return jsonError(
        "ساختار پاسخ فهرست شناسنامه‌ها معتبر نیست.",
        502
      );
    }


    const pagination =
      parsePaginationHeader(
        backendResponse.headers.get(
          "Pagination"
        ),
        backendUrl.searchParams,
        profiles.length
      );


    const result:
      ProgramProfileListResponse = {
      items:
        profiles,

      pagination,
    };


    return NextResponse.json(
      result,
      {
        status:
          200,
      }
    );
  } catch (error) {
    console.error(
      "Get program profiles route error:",
      error
    );

    return jsonError(
      "ارتباط با وب‌سرویس شناسنامه‌ها برقرار نشد.",
      500
    );
  }
}


/**
 * دریافت همه صفحه‌های شناسنامه برای مدیر گروه، حذف پیش‌نویس‌ها،
 * و سپس محاسبه صفحه‌بندی روی نتایج مجاز.
 * فیلترهای تاریخ و برنامه بدون تغییر به Backend منتقل می‌شوند.
 */
async function getNetworkGroupProfiles(
  accessToken: string,
  requestUrl: URL
): Promise<NextResponse> {
  const scanPageSize = 10;
  const requestedPage = toPositiveInteger(
    requestUrl.searchParams.get("pageNumber"),
    1
  );
  const requestedPageSize = toPositiveInteger(
    requestUrl.searchParams.get("pageSize"),
    10
  );

  const backendUrl = new URL(
    `${API_CONFIG.baseUrl}${API_ENDPOINTS.programProfiles.list}`
  );

  // حفظ فیلترهای فعلی صفحه؛ فقط صفحه‌بندی برای پیمایش همه نتایج تنظیم می‌شود.
  for (const parameterName of ["planId", "fromDate", "toDate"] as const) {
    const parameterValue = requestUrl.searchParams.get(parameterName);
    if (parameterValue?.trim()) {
      backendUrl.searchParams.set(parameterName, parameterValue);
    }
  }
  backendUrl.searchParams.set("pageSize", String(scanPageSize));

  const allProfiles: ProgramProfileResponse[] = [];
  let pageNumber = 1;
  let knownTotalPages: number | null = null;
  const maxPages = 1000;

  while (pageNumber <= maxPages) {
    backendUrl.searchParams.set("pageNumber", String(pageNumber));

    const backendResponse = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const responseText = await backendResponse.text();
    const responseData = parseJsonResponse(responseText);

    if (!backendResponse.ok) {
      console.error("Program profiles backend error for NetworkGroup:", {
        status: backendResponse.status,
        pageNumber,
        responseText,
      });
      return NextResponse.json(
        {
          message:
            getApiErrorMessage(responseData) ??
            `دریافت شناسنامه‌ها انجام نشد. کد پاسخ Backend: ${backendResponse.status}`,
        },
        { status: backendResponse.status }
      );
    }

    const profiles = getProfileItems(responseData);
    if (!profiles) {
      console.error("Invalid profiles list for NetworkGroup:", {
        pageNumber,
        responseData,
        responseText,
      });
      return jsonError("ساختار پاسخ فهرست شناسنامه‌ها معتبر نیست.", 502);
    }

    if (pageNumber === 1) {
      const paginationHeader = backendResponse.headers.get("Pagination");
      const rawPagination = paginationHeader
        ? parseJsonResponse(paginationHeader)
        : null;

      // فقط وقتی totalPages واقعاً در Header موجود و معتبر است، به آن تکیه می‌کنیم.
      if (isRecord(rawPagination)) {
        knownTotalPages =
          getFiniteNumber(rawPagination.totalPages) ??
          getFiniteNumber(rawPagination.TotalPages) ??
          getFiniteNumber(rawPagination.pageCount) ??
          getFiniteNumber(rawPagination.PageCount);
      }
    }

    if (profiles.length === 0) {
      break;
    }

    allProfiles.push(...profiles);

    if (knownTotalPages !== null && pageNumber >= knownTotalPages) {
      break;
    }

    // در نبود هدر صفحه‌بندی، تا رسیدن به صفحه خالی ادامه می‌دهیم.
    pageNumber += 1;
  }

  if (pageNumber > maxPages) {
    console.error("Program profiles pagination safety limit reached for NetworkGroup.");
    return jsonError("دریافت همه شناسنامه‌ها بیش از حد مجاز طول کشید. لطفاً دوباره تلاش کنید.", 502);
  }

  const visibleProfiles = allProfiles.filter((profile) => !isDraftProfile(profile));
  const totalCount = visibleProfiles.length;
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / requestedPageSize);
  const startIndex = (requestedPage - 1) * requestedPageSize;

  const result: ProgramProfileListResponse = {
    items: visibleProfiles.slice(startIndex, startIndex + requestedPageSize),
    pagination: {
      currentPage: requestedPage,
      pageSize: requestedPageSize,
      totalCount,
      totalPages,
      hasPrevious: requestedPage > 1 && totalPages > 0,
      hasNext: requestedPage < totalPages,
    },
  };

  return NextResponse.json(result, { status: 200 });
}

function isDraftProfile(profile: ProgramProfileResponse): boolean {
  const rawStatus: unknown = profile.status;
  if (rawStatus === 0 || rawStatus === "0") {
    return true;
  }

  const normalizedStatus =
    typeof rawStatus === "string"
      ? rawStatus.trim().toLowerCase().replace(/[\s_-]/g, "")
      : "";

  if (normalizedStatus === "draft" || normalizedStatus === "draftatprovider") {
    return true;
  }

  const displayName =
    typeof profile.statusDisplayName === "string"
      ? profile.statusDisplayName.trim().replace(/\u200c/g, " ").replace(/\s+/g, " ")
      : "";

  return displayName.startsWith("پیش نویس") || displayName.startsWith("پیش‌نویس");
}

/** تشخیص نقش با همان روش استفاده‌شده در Route پیش‌بینی‌ها. */
function isNetworkGroupManagerToken(token: string): boolean {
  const payload = readJwtPayload(token);
  if (!payload) return false;

  const roleClaimKeys = [
    "role",
    "roles",
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
  ];
  const roleValues: string[] = [];

  for (const key of roleClaimKeys) {
    const claim = payload[key];
    if (typeof claim === "string") {
      roleValues.push(...claim.split(","));
    } else if (Array.isArray(claim)) {
      roleValues.push(...claim.filter((value): value is string => typeof value === "string"));
    }
  }

  const normalizedRoles = roleValues.map((role) =>
    role.trim().toLowerCase().replace(/[ _-]/g, "")
  );

  return normalizedRoles.some(
    (role) => role === "networkgroupmanager" || role === "networkgroup"
  );
}

function readJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const normalizedPayload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const payload = Buffer.from(normalizedPayload, "base64").toString("utf8");
    const value = JSON.parse(payload) as unknown;

    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
}


/*
 * استخراج آرایه Profile
 */
function getProfileItems(
  value: unknown
): ProgramProfileResponse[] | null {
  /*
   * پاسخ مستقیم Backend
   */
  if (Array.isArray(value)) {
    return value.filter(
      isProgramProfileResponse
    );
  }

  if (!isRecord(value)) {
    return null;
  }

  /*
   * پشتیبانی از پاسخ بسته‌بندی‌شده
   */
  const possibleArrays = [
    value.items,
    value.data,
    value.profiles,
  ];

  for (
    const possibleArray of
    possibleArrays
  ) {
    if (
      Array.isArray(
        possibleArray
      )
    ) {
      return possibleArray.filter(
        isProgramProfileResponse
      );
    }
  }

  return null;
}


/*
 * برای جلوگیری از رد پاسخ معتبر،
 * فقط فیلدهای ضروری جدول بررسی می‌شوند.
 */
function isProgramProfileResponse(
  value: unknown
): value is ProgramProfileResponse {
  return (
    isRecord(value) &&

    typeof value.id ===
      "string" &&

    value.id.length > 0 &&

    typeof value.forecastId ===
      "string" &&

    typeof value.planId ===
      "number" &&

    typeof value.mainTopic ===
      "string" &&

    typeof value.broadcastDate ===
      "string"
  );
}


/*
 * تبدیل Header Pagination
 */
function parsePaginationHeader(
  headerValue: string | null,
  searchParams: URLSearchParams,
  itemCount: number
): ProgramProfilePagination {
  const requestedPage =
    toPositiveInteger(
      searchParams.get(
        "pageNumber"
      ),
      1
    );

  const requestedPageSize =
    toPositiveInteger(
      searchParams.get(
        "pageSize"
      ),
      10
    );


  const fallback:
    ProgramProfilePagination = {
    currentPage:
      requestedPage,

    pageSize:
      requestedPageSize,

    totalCount:
      itemCount,

    totalPages:
      itemCount > 0
        ? 1
        : 0,

    hasPrevious:
      requestedPage > 1,

    hasNext:
      false,
  };


  if (!headerValue) {
    return fallback;
  }

  const parsedHeader =
    parseJsonResponse(
      headerValue
    );

  if (!isRecord(parsedHeader)) {
    return fallback;
  }


  const currentPage =
    getFiniteNumber(
      parsedHeader.currentPage
    ) ??
    getFiniteNumber(
      parsedHeader.pageNumber
    ) ??
    fallback.currentPage;

  const pageSize =
    getFiniteNumber(
      parsedHeader.pageSize
    ) ??
    fallback.pageSize;

  const totalCount =
    getFiniteNumber(
      parsedHeader.totalCount
    ) ??
    fallback.totalCount;

  const totalPages =
    getFiniteNumber(
      parsedHeader.totalPages
    ) ??
    (
      totalCount === 0
        ? 0
        : Math.ceil(
            totalCount /
              pageSize
          )
    );


  return {
    currentPage,

    pageSize,

    totalCount,

    totalPages,

    hasPrevious:
      typeof parsedHeader
        .hasPrevious ===
      "boolean"
        ? parsedHeader
            .hasPrevious
        : currentPage > 1,

    hasNext:
      typeof parsedHeader
        .hasNext ===
      "boolean"
        ? parsedHeader
            .hasNext
        : currentPage <
          totalPages,
  };
}


function toPositiveInteger(
  value: string | null,
  fallback: number
): number {
  const parsedValue =
    Number(value);

  return (
    Number.isInteger(
      parsedValue
    ) &&
    parsedValue > 0
  )
    ? parsedValue
    : fallback;
}


function getFiniteNumber(
  value: unknown
): number | null {
  return (
    typeof value ===
      "number" &&
    Number.isFinite(value)
  )
    ? value
    : null;
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
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}


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