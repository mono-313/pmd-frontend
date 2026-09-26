"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Eye,
  RefreshCw,
} from "lucide-react";

import type {
  Forecast,
} from "@/app/types/forecast";

const PAGE_SIZE = 10;


interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
}


export default function ForecastReviewPage() {
  const router =
    useRouter();


  const [
    forecasts,
    setForecasts,
  ] = useState<Forecast[]>(
    []
  );


  const [
    isLoading,
    setIsLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);


  const [
    pagination,
    setPagination,
  ] = useState<PaginationMetadata>({
    currentPage: 1,
    totalPages: 1,
    pageSize: PAGE_SIZE,
    totalCount: 0,
    hasPrevious: false,
    hasNext: false,
  });


  const [
    programNames,
    setProgramNames,
  ] = useState<Record<number, string>>({});


  /*
   * دریافت پیش‌بینی‌های
   * در انتظار بررسی
   *
   * Backend براساس Role و
   * networkGroupId مدیر، محدوده
   * رکوردها را مشخص می‌کند.
   */
  const loadForecasts =
    useCallback(
      async (
        signal?: AbortSignal
      ) => {
        try {
          setIsLoading(true);
          setError("");


          const query =
            new URLSearchParams({
              status: "PendingReview",
              pageNumber: String(currentPage),
              pageSize: String(PAGE_SIZE),
            });


          const response =
            await fetch(
              `/api/forecasts?${query.toString()}`,
              {
                method: "GET",
                headers: {
                  Accept: "application/json",
                },
                cache: "no-store",
                signal,
              }
            );


          const responseData =
            await readJsonResponse(response);


          if (!response.ok) {
            throw new Error(
              getErrorMessage(responseData) ??
                `دریافت موضوعات نیازمند بررسی انجام نشد. کد پاسخ: ${response.status}`
            );
          }


          const result =
            normalizeForecastListResponse(
              responseData,
              currentPage
            );


          if (signal?.aborted) {
            return;
          }


          setForecasts(
            result.items
          );


          setPagination(
            result.pagination
          );
        } catch (loadError) {
          if (signal?.aborted) {
            return;
          }


          setForecasts([]);


          setPagination((previous) => ({
            ...previous,
            currentPage,
            hasNext: false,
            hasPrevious: currentPage > 1,
          }));


          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "دریافت موضوعات نیازمند بررسی انجام نشد."
          );
        } finally {
          if (!signal?.aborted) {
            setIsLoading(false);
          }
        }
      },
      [currentPage]
    );


  const loadPrograms =
    useCallback(async () => {
      try {
        const response =
          await fetch(
            "/api/programs",
            {
              method: "GET",
              headers: {
                Accept: "application/json",
              },
              cache: "no-store",
            }
          );


        const responseData =
          await readJsonResponse(response);


        if (!response.ok) {
          throw new Error(
            getErrorMessage(responseData) ??
              "دریافت نام برنامه‌ها انجام نشد."
          );
        }


        setProgramNames(
          extractProgramNames(
            responseData
          )
        );
      } catch (programError) {
        console.error(
          "Load programs error:",
          programError
        );

        setProgramNames({});
      }
    }, []);


  /*
   * بارگذاری اولیه کارتابل
   */
  useEffect(() => {
    const controller =
      new AbortController();


    void loadForecasts(
      controller.signal
    );


    return () => {
      controller.abort();
    };
  }, [loadForecasts]);


  useEffect(() => {
    void loadPrograms();
  }, [loadPrograms]);


  /*
   * رفتن به صفحه مشاهده
   * و تصمیم‌گیری مدیر
   */
  function handleReview(
    forecastId: string
  ) {
    router.push(
      `/forecasts/review/${encodeURIComponent(
        forecastId
      )}`
    );
  }


  /*
   * دریافت مجدد فهرست
   */
  function handleRefresh() {
    void loadForecasts();
  }


  function handlePreviousPage() {
    if (currentPage > 1) {
      setCurrentPage((page) =>
        page - 1
      );
    }
  }


  function handleNextPage() {
    if (pagination.hasNext) {
      setCurrentPage((page) =>
        page + 1
      );
    }
  }


  return (
    <main
      className="
        
        bg-gray-50
        px-4 py-8
        sm:px-6
      "
      dir="rtl"
    >
      <section
        className="
        mx-auto
         max-w-5xl
        "
      >
        {/* عنوان صفحه */}
        <header
          className="
            mb-6
            flex
            flex-wrap
            items-center
            justify-between
            gap-3
          "
        >
          <div>
            <h1
              className="
                text-2xl
                font-bold
                text-gray-800
              "
            >
              کارتابل بررسی موضوعات
            </h1>

            <p
              className="
                mt-2
                text-sm
                leading-7
                text-gray-500
              "
            >
              پیش‌بینی‌های در انتظار بررسی مربوط به گروه برنامه‌ساز شما در این بخش نمایش داده می‌شوند.
            </p>
          </div>


          <button
            type="button"
            onClick={
              handleRefresh
            }
            disabled={
              isLoading
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-lg
              border border-gray-300
              bg-white
              px-4 py-2.5
              text-sm
              font-semibold
              text-gray-700
              transition
              hover:bg-gray-50
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <RefreshCw
              size={17}
              className={
                isLoading
                  ? "animate-spin"
                  : ""
              }
            />

            به‌روزرسانی
          </button>
        </header>


        {/* خطای دریافت اطلاعات */}
        {error && (
          <div
            className="
              mb-5
              rounded-xl
              border border-red-200
              bg-red-50
              px-4 py-3
              text-sm
              leading-7
              text-red-700
            "
            role="alert"
          >
            {error}
          </div>
        )}


        {/* حالت دریافت اطلاعات */}
        {isLoading ? (
          <div
            className="
              rounded-xl
              border border-gray-200
              bg-white
              p-10
              text-center
              text-sm
              text-gray-500
              shadow-sm
            "
          >
            <RefreshCw
              size={24}
              className="
                mx-auto
                mb-3
                animate-spin
                text-[#007fcf]
              "
            />

            در حال دریافت موارد نیازمند بررسی...
          </div>
        ) : (
          /*
           * جدول کارتابل
           */
          <div
            className="
              overflow-hidden
              rounded-xl
              border border-gray-200
              bg-white
              shadow-sm
            "
          >
            <div
              className="
                overflow-x-auto
              "
            >
              <table
                className="
                  w-full
                  max-w-[1000px]
                  text-sm
                "
              >
                <thead
                  className="
                    bg-gray-50
                    text-gray-700
                  "
                >
                  <tr>
                    <th
                      className="
                        w-16
                        px-4 py-4
                        text-center
                        font-bold
                      "
                    >
                      ردیف
                    </th>

                    <th
                      className="
                        min-w-[100px]
                        px-4 py-4
                        text-right
                        font-bold
                      "
                    >
                      نام برنامه
                    </th>

                    <th
                      className="
                        min-w-[100px]
                        px-3 py-4
                        text-right
                        font-bold
                      "
                    >
                      موضوع اصلی
                    </th>

                    <th
                      className="
                        min-w-[100px]
                        px-4 py-4
                        text-right
                        font-bold
                      "
                    >
                      ثبت‌کننده
                    </th>

                    <th
                      className="
                        min-w-[40px]
                        px-4 py-4
                        text-center
                        font-bold
                      "
                    >
                      تاریخ پخش
                    </th>

                    <th
                      className="
                        min-w-[40px]
                        px-4 py-4
                        text-center
                        font-bold
                      "
                    >
                      شماره قسمت
                    </th>

                    <th
                      className="
                        min-w-[150px]
                        px-4 py-4
                        text-center
                        font-bold
                      "
                    >
                      وضعیت
                    </th>

                    <th
                      className="
                        min-w-[200px]
                        px-4 py-4
                        text-center
                        font-bold
                      "
                    >
                      عملیات
                    </th>
                  </tr>
                </thead>


                <tbody>
                  {forecasts.map(
                    (
                      forecast,
                      index
                    ) => (
                      <tr
                        key={
                          forecast.id
                        }
                        className="
                          border-t
                          border-gray-100
                          text-gray-700
                          transition-colors
                          hover:bg-blue-50/40
                        "
                      >
                        <td
                          className="
                            px-4 py-4
                            text-center
                            text-gray-500
                          "
                        >
                          {toPersianNumber(
                            (pagination.currentPage - 1) *
                              pagination.pageSize +
                              index +
                              1
                          )}
                        </td>


                        <td
                          className="
                            px-4 py-4
                            text-gray-800
                          "
                        >
                          {getProgramName(
                            programNames,
                            forecast.planId
                          )}
                        </td>


                        <td
                          className="
                            px-4 py-4
                            
                            leading-7
                            text-gray-800
                          "
                        >
                          {forecast.mainTopic
                            .trim() ||
                            "—"}
                        </td>


                        <td
                          className="
                            px-4 py-4
                            text-gray-700
                          "
                        >
                          {forecast
                            .createdByUserName
                            ?.trim() ||
                            "—"}
                        </td>


                        <td
                          className="
                            whitespace-nowrap
                            px-4 py-4
                            text-center
                          "
                        >
                          {formatJalaliDate(
                            forecast
                              .broadcastDate
                          )}
                        </td>


                        <td
                          className="
                            px-4 py-4
                            text-center
                          "
                        >
                          {forecast
                            .episodeNumber !=
                          null
                            ? toPersianNumber(
                                forecast
                                  .episodeNumber
                              )
                            : "—"}
                        </td>


                        <td
                          className="
                            px-4 py-4
                            text-center
                          "
                        >
                          <span
                            className="
                              inline-flex
                              items-center
                              rounded-full
                              bg-amber-100
                              px-3 py-1
                              text-xs
                              font-bold
                              text-amber-700
                            "
                          >
                            در انتظار بررسی
                          </span>
                        </td>


                        <td
                          className="
                            px-4 py-4
                            text-center
                          "
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleReview(
                                forecast.id
                              )
                            }
                            className="
                              inline-flex
                              items-center
                              justify-center
                              gap-2
                              rounded-lg
                              bg-[#007fcf]
                              px-4 py-2
                              font-semibold
                              text-white
                              shadow-sm
                              transition
                              hover:bg-[#006daf]
                              focus:outline-none
                              focus:ring-2
                              focus:ring-[#007fcf]/30
                            "
                          >
                            <Eye
                              size={17}
                            />

                            مشاهده و بررسی
                          </button>
                        </td>
                      </tr>
                    )
                  )}


                  {!error &&
                    forecasts.length ===
                      0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="
                            px-4 py-12
                            text-center
                            text-gray-500
                          "
                        >
                          موردی نیازمند بررسی نیست.
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>


            {(pagination.totalPages > 1 ||
              pagination.hasPrevious ||
              pagination.hasNext) && (
              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  justify-between
                  gap-3
                  border-t border-gray-200
                  px-4 py-4
                "
              >
                <span
                  className="
                    text-sm
                    text-gray-500
                  "
                >
                  صفحه {toPersianNumber(pagination.currentPage)}
                  {pagination.totalPages > 0 && (
                    <>
                      {" "}از {toPersianNumber(pagination.totalPages)}
                    </>
                  )}
                </span>


                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePreviousPage}
                    disabled={
                      isLoading ||
                      !pagination.hasPrevious
                    }
                    className="
                      rounded-lg
                      border border-gray-300
                      bg-white
                      px-4 py-2
                      text-sm font-semibold
                      text-gray-700
                      transition
                      hover:bg-gray-50
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                  >
                    صفحه قبل
                  </button>


                  <button
                    type="button"
                    onClick={handleNextPage}
                    disabled={
                      isLoading ||
                      !pagination.hasNext
                    }
                    className="
                      rounded-lg
                      border border-gray-300
                      bg-white
                      px-4 py-2
                      text-sm font-semibold
                      text-gray-700
                      transition
                      hover:bg-gray-50
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                  >
                    صفحه بعد
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}


/*
 * تبدیل تاریخ میلادی Backend
 * به تاریخ شمسی قابل نمایش
 */
function formatJalaliDate(
  value:
    | string
    | null
    | undefined
): string {
  if (!value) {
    return "—";
  }


  const normalizedValue =
    normalizeDigits(
      value
    );


  const date =
    new Date(
      normalizedValue
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }


  return new Intl.DateTimeFormat(
    "fa-IR-u-ca-persian",
    {
      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit",

      timeZone:
        "UTC",
    }
  ).format(
    date
  );
}


/*
 * تبدیل اعداد انگلیسی
 * به فارسی
 */
function toPersianNumber(
  value:
    string |
    number
): string {
  return String(
    value
  ).replace(
    /\d/g,
    (digit) =>
      "۰۱۲۳۴۵۶۷۸۹"[
        Number(digit)
      ]
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


async function readJsonResponse(
  response: Response
): Promise<unknown> {
  const responseText =
    await response.text();

  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(
      responseText
    ) as unknown;
  } catch {
    throw new Error(
      `پاسخ وب‌سرویس JSON معتبر نیست. کد پاسخ: ${response.status}`
    );
  }
}


function normalizeForecastListResponse(
  value: unknown,
  requestedPage: number
): {
  items: Forecast[];
  pagination: PaginationMetadata;
} {
  const record =
    isRecord(value)
      ? value
      : null;

  const items =
    Array.isArray(value)
      ? value as Forecast[]
      : Array.isArray(record?.items)
        ? record.items as Forecast[]
        : [];

  const rawPagination =
    isRecord(record?.pagination)
      ? record.pagination
      : {};

  const hasPaginationMetadata =
    Object.keys(rawPagination).length > 0;

  const currentPage =
    readPositiveNumber(
      rawPagination.currentPage ??
        rawPagination.pageNumber
    ) ?? requestedPage;

  const pageSize =
    readPositiveNumber(
      rawPagination.pageSize
    ) ?? PAGE_SIZE;

  const totalCount =
    readNonNegativeNumber(
      rawPagination.totalCount
    ) ?? items.length;

  const totalPages =
    readPositiveNumber(
      rawPagination.totalPages
    ) ?? (
      hasPaginationMetadata
        ? Math.max(
            1,
            Math.ceil(
              totalCount / pageSize
            )
          )
        : currentPage +
          (items.length === pageSize
            ? 1
            : 0)
    );

  return {
    items,
    pagination: {
      currentPage,
      pageSize,
      totalCount,
      totalPages,
      hasPrevious:
        typeof rawPagination.hasPrevious === "boolean"
          ? rawPagination.hasPrevious
          : currentPage > 1,
      hasNext:
        typeof rawPagination.hasNext === "boolean"
          ? rawPagination.hasNext
          : hasPaginationMetadata
            ? currentPage < totalPages
            : items.length === pageSize,
    },
  };
}


function extractProgramNames(
  value: unknown
): Record<number, string> {
  const items =
    findArray(value);

  const result:
    Record<number, string> = {};

  for (const item of items) {
    if (!isRecord(item)) {
      continue;
    }

    const id =
      readPositiveNumber(
        item.id ??
          item.Id ??
          item.planId ??
          item.PlanId ??
          item.value ??
          item.Value
      );

    const nameValue =
      item.name ??
      item.Name ??
      item.programName ??
      item.ProgramName ??
      item.planName ??
      item.PlanName ??
      item.title ??
      item.Title ??
      item.text ??
      item.Text;

    const name =
      typeof nameValue === "string"
        ? nameValue.trim()
        : "";

    if (id !== null && name) {
      result[id] = name;
    }
  }

  return result;
}


function findArray(
  value: unknown
): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return [];
  }

  for (const field of [
    "programs",
    "Programs",
    "items",
    "Items",
    "data",
    "Data",
    "result",
    "Result",
  ]) {
    const nested = value[field];

    if (Array.isArray(nested)) {
      return nested;
    }

    const nestedItems =
      findArray(nested);

    if (nestedItems.length > 0) {
      return nestedItems;
    }
  }

  return [];
}


function getProgramName(
  programNames: Record<number, string>,
  planId: unknown
): string {
  const normalizedPlanId =
    readPositiveNumber(planId);

  if (normalizedPlanId === null) {
    return "—";
  }

  return (
    programNames[normalizedPlanId] ??
    `برنامه شماره ${toPersianNumber(normalizedPlanId)}`
  );
}


function getErrorMessage(
  value: unknown
): string | null {
  if (!isRecord(value)) {
    return null;
  }

  for (const field of [
    "message",
    "description",
    "detail",
    "title",
  ]) {
    const message = value[field];

    if (
      typeof message === "string" &&
      message.trim()
    ) {
      return message.trim();
    }
  }

  return null;
}


function readPositiveNumber(
  value: unknown
): number | null {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(normalizeDigits(value))
        : Number.NaN;

  return (
    Number.isFinite(numberValue) &&
    numberValue > 0
  )
    ? numberValue
    : null;
}


function readNonNegativeNumber(
  value: unknown
): number | null {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(normalizeDigits(value))
        : Number.NaN;

  return (
    Number.isFinite(numberValue) &&
    numberValue >= 0
  )
    ? numberValue
    : null;
}


function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}
