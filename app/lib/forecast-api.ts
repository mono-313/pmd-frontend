import type {
  Forecast,
  ForecastListFilters,
  ForecastListResponse,
  ForecastResponse,
  ForecastStatus,
  PaginationMetadata,
} from "@/app/types/forecast";


/*
 * تنظیمات پیش‌فرض صفحه‌بندی
 */
const DEFAULT_PAGE_NUMBER =
  1;

const DEFAULT_PAGE_SIZE =
  10;

const REVIEW_PAGE_SIZE =
  100;


/*
 * دریافت عمومی فهرست پیش‌بینی‌ها
 *
 * این تابع پایه تمام فهرست‌های
 * پیش‌بینی است.
 *
 * Backend براساس Role داخل Token
 * تعیین می‌کند کاربر چه رکوردهایی
 * را مشاهده کند.
 */
export async function getForecastList(
  filters:
    Partial<
      ForecastListFilters
    > = {}
): Promise<
  ForecastListResponse
> {
  const query =
    createForecastQuery(
      filters
    );


  const response =
    await fetch(
      `/api/forecasts?${query.toString()}`,
      {
        method:
          "GET",

        headers: {
          Accept:
            "application/json",
        },

        /*
         * ارسال Cookie نشست
         * به Route داخلی Next.js
         */
        credentials:
          "include",

        cache:
          "no-store",
      }
    );


  const responseText =
    await response.text();


  const responseData =
    parseJsonResponse(
      responseText
    );


  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        responseData
      ) ??
      (
        "دریافت فهرست پیش‌بینی‌ها انجام نشد. " +
        `کد پاسخ: ${
          response.status
        }`
      )
    );
  }


  const result =
    normalizeForecastListResponse(
      responseData,
      query
    );


  if (!result) {
    console.error(
      "Invalid forecast list response:",
      responseData
    );


    throw new Error(
      "ساختار پاسخ فهرست پیش‌بینی‌ها معتبر نیست."
    );
  }


  return result;
}


/*
 * دریافت فهرست پیش‌بینی‌های
 * قابل مشاهده برای کاربر جاری
 *
 * Providers:
 * فقط رکوردهای ثبت‌شده خودش
 *
 * NetworkGroupManager:
 * رکوردهای گروه خودش
 *
 * NetworkManager:
 * رکوردهای شبکه‌های خودش
 *
 * Admin:
 * تمام رکوردها
 */
export async function getForecasts(
  filters:
    Partial<
      ForecastListFilters
    > = {}
): Promise<Forecast[]> {
  const result =
    await getForecastList(
      filters
    );


  return result.items;
}


/*
 * دریافت کارتابل بررسی مدیر گروه
 *
 * Endpoint همان فهرست Forecast
 * است و فقط وضعیت PendingReview
 * برای آن ارسال می‌شود.
 *
 * Backend باید براساس Role و
 * networkGroupId رکوردها را
 * محدود کند.
 */
export async function getReviewForecasts():
  Promise<Forecast[]> {
  const result =
    await getForecastList({
      status:
        "PendingReview",

      pageNumber:
        DEFAULT_PAGE_NUMBER,

      pageSize:
        REVIEW_PAGE_SIZE,
    });


  return result.items;
}


/*
 * نسخه صفحه‌بندی‌شده کارتابل
 *
 * اگر بعداً Pagination به صفحه
 * کارتابل اضافه شود، این تابع
 * قابل استفاده است.
 */
export async function getReviewForecastList(
  pageNumber =
    DEFAULT_PAGE_NUMBER,
  pageSize =
    DEFAULT_PAGE_SIZE
): Promise<
  ForecastListResponse
> {
  return getForecastList({
    status:
      "PendingReview",

    pageNumber,

    pageSize,
  });
}


/*
 * دریافت Forecastهای یک وضعیت
 * مشخص برای کاربر جاری
 */
export async function getForecastsByStatus(
  status:
    ForecastStatus,
  pageNumber =
    DEFAULT_PAGE_NUMBER,
  pageSize =
    DEFAULT_PAGE_SIZE
): Promise<
  ForecastListResponse
> {
  return getForecastList({
    status,

    pageNumber,

    pageSize,
  });
}


/*
 * ساخت Query براساس فیلترها
 *
 * pageNumber و pageSize همیشه
 * ارسال می‌شوند چون طبق مستند
 * Backend اجباری هستند.
 */
function createForecastQuery(
  filters:
    Partial<
      ForecastListFilters
    >
): URLSearchParams {
  const query =
    new URLSearchParams();


  const pageNumber =
    toPositiveInteger(
      filters.pageNumber,
      DEFAULT_PAGE_NUMBER
    );


  const pageSize =
    toPositiveInteger(
      filters.pageSize,
      DEFAULT_PAGE_SIZE
    );


  query.set(
    "pageNumber",
    String(pageNumber)
  );


  query.set(
    "pageSize",
    String(pageSize)
  );


  if (
    typeof filters.planId ===
      "number" &&
    Number.isInteger(
      filters.planId
    ) &&
    filters.planId > 0
  ) {
    query.set(
      "planId",
      String(
        filters.planId
      )
    );
  }


  if (
    filters.status
  ) {
    query.set(
      "status",
      filters.status
    );
  }


  if (
    typeof filters.fromDate ===
      "string" &&
    filters.fromDate.trim()
  ) {
    query.set(
      "fromDate",
      filters.fromDate.trim()
    );
  }


  if (
    typeof filters.toDate ===
      "string" &&
    filters.toDate.trim()
  ) {
    query.set(
      "toDate",
      filters.toDate.trim()
    );
  }


  return query;
}


/*
 * تبدیل پاسخ Route داخلی
 * به مدل یکپارچه Frontend
 */
function normalizeForecastListResponse(
  value: unknown,
  query:
    URLSearchParams
): ForecastListResponse | null {
  /*
   * ساختار اصلی Route داخلی:
   *
   * {
   *   items: [...],
   *   pagination: {...}
   * }
   */
  if (
    isRecord(value) &&
    Array.isArray(
      value.items
    )
  ) {
    const items =
      value.items.filter(
        isForecastResponse
      );


    return {
      items,

      pagination:
        normalizePagination(
          value.pagination,
          query,
          items.length
        ),
    };
  }


  /*
   * پشتیبانی موقت از حالتی
   * که Route مستقیماً آرایه
   * برگرداند.
   */
  if (Array.isArray(value)) {
    const items =
      value.filter(
        isForecastResponse
      );


    return {
      items,

      pagination:
        createFallbackPagination(
          query,
          items.length
        ),
    };
  }


  return null;
}


/*
 * بررسی حداقلی Forecast
 *
 * عمداً فیلدهای اختیاری یا جدید
 * Backend باعث رد پاسخ نمی‌شوند.
 */
function isForecastResponse(
  value: unknown
): value is ForecastResponse {
  return (
    isRecord(value) &&

    typeof value.id ===
      "string" &&

    Boolean(
      value.id.trim()
    ) &&

    typeof value.planId ===
      "number" &&

    typeof value.mainTopic ===
      "string" &&

    isForecastStatus(
      value.status
    )
  );
}


/*
 * وضعیت‌های معتبر مستند جدید
 */
function isForecastStatus(
  value: unknown
): value is ForecastStatus {
  return (
    value === "Draft" ||
    value ===
      "PendingReview" ||
    value === "Approved" ||
    value === "Rejected" ||
    value ===
      "ReturnedForEdit"
  );
}


/*
 * تبدیل اطلاعات Pagination
 */
function normalizePagination(
  value: unknown,
  query:
    URLSearchParams,
  itemCount: number
): PaginationMetadata {
  const fallback =
    createFallbackPagination(
      query,
      itemCount
    );


  if (!isRecord(value)) {
    return fallback;
  }


  const currentPage =
    getFirstFiniteNumber(
      value,
      [
        "currentPage",
        "CurrentPage",
        "pageNumber",
        "PageNumber",
      ],
      fallback.currentPage
    );


  const pageSize =
    getFirstFiniteNumber(
      value,
      [
        "pageSize",
        "PageSize",
      ],
      fallback.pageSize
    );


  const totalCount =
    getFirstFiniteNumber(
      value,
      [
        "totalCount",
        "TotalCount",
      ],
      fallback.totalCount
    );


  const calculatedTotalPages =
    pageSize > 0
      ? Math.ceil(
          totalCount /
          pageSize
        )
      : fallback.totalPages;


  const totalPages =
    getFirstFiniteNumber(
      value,
      [
        "totalPages",
        "TotalPages",
      ],
      calculatedTotalPages
    );


  return {
    currentPage,

    pageSize,

    totalCount,

    totalPages,

    hasPrevious:
      getFirstBoolean(
        value,
        [
          "hasPrevious",
          "HasPrevious",
          "hasPreviousPage",
          "HasPreviousPage",
        ],
        currentPage > 1
      ),

    hasNext:
      getFirstBoolean(
        value,
        [
          "hasNext",
          "HasNext",
          "hasNextPage",
          "HasNextPage",
        ],
        currentPage <
          totalPages
      ),
  };
}


/*
 * Pagination جایگزین
 */
function createFallbackPagination(
  query:
    URLSearchParams,
  itemCount: number
): PaginationMetadata {
  const currentPage =
    toPositiveInteger(
      query.get(
        "pageNumber"
      ),
      DEFAULT_PAGE_NUMBER
    );


  const pageSize =
    toPositiveInteger(
      query.get(
        "pageSize"
      ),
      DEFAULT_PAGE_SIZE
    );


  return {
    currentPage,

    pageSize,

    totalCount:
      itemCount,

    totalPages:
      itemCount > 0
        ? 1
        : 0,

    hasPrevious:
      currentPage > 1,

    hasNext:
      false,
  };
}


/*
 * تبدیل امن پاسخ JSON
 */
function parseJsonResponse(
  value: string
): unknown | null {
  if (!value.trim()) {
    return null;
  }


  try {
    return JSON.parse(
      value
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


  const candidates = [
    value.message,
    value.description,
    value.detail,
    value.title,
  ];


  for (
    const candidate of
    candidates
  ) {
    if (
      typeof candidate ===
        "string" &&
      candidate.trim()
    ) {
      return candidate.trim();
    }
  }


  if (
    typeof value.errors ===
      "string" &&
    value.errors.trim()
  ) {
    return value.errors.trim();
  }


  if (isRecord(value.errors)) {
    const messages =
      Object.values(
        value.errors
      ).flatMap(
        (errorValue) => {
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
        }
      );


    if (messages.length > 0) {
      return messages.join(
        "، "
      );
    }
  }


  return null;
}


/*
 * دریافت اولین مقدار عددی
 */
function getFirstFiniteNumber(
  value: Record<
    string,
    unknown
  >,
  propertyNames:
    readonly string[],
  fallback: number
): number {
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
              propertyValue
            )
          : Number.NaN;


    if (
      Number.isFinite(
        numericValue
      )
    ) {
      return numericValue;
    }
  }


  return fallback;
}


/*
 * دریافت اولین مقدار Boolean
 */
function getFirstBoolean(
  value: Record<
    string,
    unknown
  >,
  propertyNames:
    readonly string[],
  fallback: boolean
): boolean {
  for (
    const propertyName of
    propertyNames
  ) {
    const propertyValue =
      value[propertyName];


    if (
      typeof propertyValue ===
        "boolean"
    ) {
      return propertyValue;
    }


    if (
      propertyValue ===
        "true"
    ) {
      return true;
    }


    if (
      propertyValue ===
        "false"
    ) {
      return false;
    }
  }


  return fallback;
}


/*
 * تبدیل به عدد صحیح مثبت
 */
function toPositiveInteger(
  value:
    number |
    string |
    null |
    undefined,
  fallback: number
): number {
  const numericValue =
    typeof value ===
      "number"
      ? value
      : typeof value ===
            "string" &&
          value.trim()
        ? Number(value)
        : Number.NaN;


  return (
    Number.isInteger(
      numericValue
    ) &&
    numericValue > 0
  )
    ? numericValue
    : fallback;
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