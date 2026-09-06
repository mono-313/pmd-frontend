"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import DatePicker from
  "react-multi-date-picker";

import DateObject from
  "react-date-object";

import persian from
  "react-date-object/calendars/persian";

import gregorian from
  "react-date-object/calendars/gregorian";

import persianFa from
  "react-date-object/locales/persian_fa";

import gregorianEn from
  "react-date-object/locales/gregorian_en";

import {
  AlertCircle,
  CalendarDays,
  FileText,
  LoaderCircle,
  RotateCcw,
  Search,
} from "lucide-react";

import type {
  ProgramProfileListResponse,
  ProgramProfilePagination,
  ProgramProfileResponse,
} from "@/app/types/program-profile";


const PAGE_SIZE =
  10;


export default function ProgramProfilesPage() {
  const [
    profiles,
    setProfiles,
  ] = useState<
    ProgramProfileResponse[]
  >([]);

  const [
  pagination,
  setPagination,
] = useState<
  ProgramProfilePagination | null
>(null);

  const [
    fromDate,
    setFromDate,
  ] = useState<
    DateObject | null
  >(null);

  const [
    toDate,
    setToDate,
  ] = useState<
    DateObject | null
  >(null);

  const [
    appliedFromDate,
    setAppliedFromDate,
  ] = useState("");

  const [
    appliedToDate,
    setAppliedToDate,
  ] = useState("");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  const loadProfiles =
    useCallback(
      async () => {
        try {
          setIsLoading(true);
          setError("");

          const query =
            new URLSearchParams({
              pageNumber:
                String(
                  currentPage
                ),

              pageSize:
                String(
                  PAGE_SIZE
                ),
            });


          if (appliedFromDate) {
            query.set(
              "fromDate",
              `${appliedFromDate}T00:00:00.000Z`
            );
          }

          if (appliedToDate) {
            query.set(
              "toDate",
              `${appliedToDate}T23:59:59.999Z`
            );
          }


          const response =
            await fetch(
              `/api/program-profiles?${query.toString()}`,
              {
                method:
                  "GET",

                headers: {
                  Accept:
                    "application/json",
                },

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
              getErrorMessage(
                responseData
              ) ??
                `دریافت شناسنامه‌ها انجام نشد. کد پاسخ: ${response.status}`
            );
          }


          const normalizedResult =
            normalizeListResponse(
              responseData,
              currentPage
            );

          if (!normalizedResult) {
            console.error(
              "Invalid profiles response:",
              {
                responseData,
                responseText,
              }
            );

            throw new Error(
              "ساختار پاسخ فهرست شناسنامه‌ها معتبر نیست."
            );
          }


          setProfiles(
            normalizedResult.items
          );

          setPagination(
            normalizedResult.pagination
          );
        } catch (loadError) {
          setProfiles([]);
          setPagination(null);

          setError(
            loadError instanceof Error
              ? loadError.message
              : "دریافت شناسنامه‌ها انجام نشد."
          );
        } finally {
          setIsLoading(false);
        }
      },
      [
        appliedFromDate,
        appliedToDate,
        currentPage,
      ]
    );


  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);


  function handleApplyFilters() {
    setError("");

    const fromGregorian =
      fromDate
        ? convertPersianDateToGregorian(
            fromDate
          )
        : "";

    const toGregorian =
      toDate
        ? convertPersianDateToGregorian(
            toDate
          )
        : "";


    if (
      fromGregorian &&
      toGregorian &&
      fromGregorian >
        toGregorian
    ) {
      setError(
        "تاریخ شروع نباید بعد از تاریخ پایان باشد."
      );

      return;
    }


    setCurrentPage(1);

    setAppliedFromDate(
      fromGregorian
    );

    setAppliedToDate(
      toGregorian
    );
  }


  function handleResetFilters() {
    setFromDate(null);
    setToDate(null);

    setAppliedFromDate("");
    setAppliedToDate("");

    setCurrentPage(1);
    setError("");
  }


  return (
    <main
      className="
        min-h-screen
        bg-gray-50
        px-4 py-8
      "
      dir="rtl"
    >
      <section
        className="
          mx-auto
          max-w-7xl
        "
      >
        <header className="mb-6">
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-11 w-11
                items-center
                justify-center
                rounded-xl
                bg-blue-100
                text-[#007fcf]
              "
            >
              <FileText size={23} />
            </div>

            <div>
              <h1
                className="
                  text-2xl
                  font-bold
                  text-gray-800
                "
              >
                لیست شناسنامه‌ها
              </h1>

              <p
                className="
                  mt-1
                  text-sm
                  text-gray-500
                "
              >
                شناسنامه‌های صادرشده برنامه‌ها
              </p>
            </div>
          </div>
        </header>


        {/* فیلتر شمسی */}
        <section
          className="
            mb-6
            rounded-2xl
            border
            border-gray-200
            bg-white
            p-5
            shadow-sm
          "
        >
          <div
            className="
              mb-4
              flex
              items-center
              gap-2
              font-bold
              text-gray-800
            "
          >
            <CalendarDays
              size={20}
              className="text-[#007fcf]"
            />

            فیلتر بازه زمانی
          </div>

          <div
            className="
              grid
              grid-cols-1
              gap-4
              md:grid-cols-2
              lg:grid-cols-4
              lg:items-end
            "
          >
            <div>
              <label
                className={labelClass}
              >
                از تاریخ
              </label>

              <DatePicker
                value={fromDate}
                onChange={(value) => {
                  setFromDate(
                    value instanceof
                      DateObject
                      ? value
                      : null
                  );
                }}
                calendar={persian}
                locale={persianFa}
                format="YYYY/MM/DD"
                calendarPosition="bottom-right"
                placeholder="انتخاب تاریخ شروع"
                inputClass={dateInputClass}
                containerClassName="w-full"
              />
            </div>

            <div>
              <label
                className={labelClass}
              >
                تا تاریخ
              </label>

              <DatePicker
                value={toDate}
                onChange={(value) => {
                  setToDate(
                    value instanceof
                      DateObject
                      ? value
                      : null
                  );
                }}
                calendar={persian}
                locale={persianFa}
                format="YYYY/MM/DD"
                calendarPosition="bottom-right"
                placeholder="انتخاب تاریخ پایان"
                inputClass={dateInputClass}
                containerClassName="w-full"
              />
            </div>

            <button
              type="button"
              onClick={
                handleApplyFilters
              }
              className="
                flex h-11
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-[#007fcf]
                px-5
                font-semibold
                text-white
                transition
                hover:bg-[#006bab]
              "
            >
              <Search size={18} />

              اعمال فیلتر
            </button>

            <button
              type="button"
              onClick={
                handleResetFilters
              }
              className="
                flex h-11
                items-center
                justify-center
                gap-2
                rounded-lg
                border
                border-gray-300
                bg-white
                px-5
                font-semibold
                text-gray-700
                transition
                hover:bg-gray-50
              "
            >
              <RotateCcw size={18} />

              حذف فیلتر
            </button>
          </div>
        </section>


        {error && (
          <div
            role="alert"
            className="
              mb-6
              flex
              items-start
              gap-3
              rounded-xl
              border
              border-red-200
              bg-red-50
              p-4
              text-red-700
            "
          >
            <AlertCircle
              size={21}
              className="shrink-0"
            />

            {error}
          </div>
        )}


        <section
          className="
            overflow-hidden
            rounded-2xl
            border
            border-gray-200
            bg-white
            shadow-sm
          "
        >
          {isLoading ? (
            <div
              className="
                flex
                min-h-64
                items-center
                justify-center
                gap-3
                text-gray-600
              "
            >
              <LoaderCircle
                size={24}
                className="animate-spin"
              />

              در حال دریافت شناسنامه‌ها...
            </div>
          ) : profiles.length ===
            0 ? (
            <div
              className="
                flex
                min-h-64
                items-center
                justify-center
                text-gray-500
              "
            >
              شناسنامه‌ای پیدا نشد.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="
                  w-full
                  min-w-[1250px]
                  border-collapse
                "
              >
                <thead>
                  <tr
                    className="
                      bg-gray-50
                      text-right
                      text-sm
                      text-gray-600
                    "
                  >
                    <th className={headerClass}>
                      ردیف
                    </th>

                    <th className={headerClass}>
                      شناسه برنامه
                    </th>

                    <th className={headerClass}>
                      موضوع اصلی
                    </th>

                    <th className={headerClass}>
                      تاریخ پخش
                    </th>

                    <th className={headerClass}>
                      مدت
                    </th>

                    <th className={headerClass}>
                      ساعت شروع
                    </th>

                    <th className={headerClass}>
                      نحوه تولید
                    </th>

                    <th className={headerClass}>
                      مناسبت
                    </th>

                    <th className={headerClass}>
                      طبقه
                    </th>

                    <th className={headerClass}>
                      درجه
                    </th>

                    <th className={headerClass}>
                      ساختار
                    </th>

                    <th className={headerClass}>
                      ثبت‌کننده
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {profiles.map(
                    (
                      profile,
                      index
                    ) => (
                      <tr
                        key={profile.id}
                        className="
                          border-t
                          border-gray-200
                          text-sm
                          transition
                          hover:bg-blue-50/40
                        "
                      >
                        <td className={cellClass}>
                          {(
                            currentPage -
                            1
                          ) *
                            PAGE_SIZE +
                            index +
                            1}
                        </td>

                        <td className={cellClass}>
                          {profile.planId}
                        </td>

                        <td
                          className={`
                            ${cellClass}
                            max-w-xs
                            font-semibold
                            text-gray-800
                          `}
                        >
                          {profile.mainTopic}
                        </td>

                        <td className={cellClass}>
                          {formatPersianDate(
                            profile.broadcastDate
                          )}
                        </td>

                        <td
                          className={cellClass}
                          dir="ltr"
                        >
                          {profile.duration}
                        </td>

                        <td
                          className={cellClass}
                          dir="ltr"
                        >
                          {profile.startTime}
                        </td>

                        <td className={cellClass}>
                          {profile.productionMethod}
                        </td>

                        <td className={cellClass}>
                          {profile.occasion}
                        </td>

                        <td className={cellClass}>
                          {profile.floorName}
                        </td>

                        <td className={cellClass}>
                          {profile.programDegreeName}
                        </td>

                        <td className={cellClass}>
                          {profile.programStructureName}
                        </td>

                        <td className={cellClass}>
                          {profile.createdByUserName ||
                            "—"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}


          {!isLoading &&
            pagination &&
            pagination.totalPages >
              1 && (
              <footer
                className="
                  flex
                  flex-col
                  items-center
                  justify-between
                  gap-3
                  border-t
                  border-gray-200
                  px-5 py-4
                  sm:flex-row
                "
              >
                <p className="text-sm text-gray-500">
                  تعداد کل:

                  <span
                    className="
                      mr-1
                      font-bold
                      text-gray-700
                    "
                  >
                    {pagination.totalCount}
                  </span>
                </p>

                <div
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >
                  <button
                    type="button"
                    disabled={
                      !pagination.hasPrevious
                    }
                    onClick={() =>
                      setCurrentPage(
                        (
                          previous
                        ) =>
                          Math.max(
                            previous - 1,
                            1
                          )
                      )
                    }
                    className={paginationButtonClass}
                  >
                    قبلی
                  </button>

                  <span
                    className="
                      px-3
                      text-sm
                      text-gray-600
                    "
                  >
                    صفحه {currentPage}
                    از {pagination.totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={
                      !pagination.hasNext
                    }
                    onClick={() =>
                      setCurrentPage(
                        (
                          previous
                        ) =>
                          previous + 1
                      )
                    }
                    className={paginationButtonClass}
                  >
                    بعدی
                  </button>
                </div>
              </footer>
            )}
        </section>
      </section>
    </main>
  );
}


/*
 * پاسخ Route داخلی می‌تواند Object
 * یا آرایه مستقیم باشد.
 */
function normalizeListResponse(
  value: unknown,
  requestedPage: number
): ProgramProfileListResponse | null {
  if (Array.isArray(value)) {
    const items =
      value.filter(
        isProgramProfile
      );

    return {
      items,

      pagination:
        createFallbackPagination(
          items.length,
          requestedPage
        ),
    };
  }

  if (
    !isRecord(value) ||
    !Array.isArray(
      value.items
    )
  ) {
    return null;
  }

  const items =
    value.items.filter(
      isProgramProfile
    );

  return {
    items,

    pagination:
      normalizePagination(
        value.pagination,
        items.length,
        requestedPage
      ),
  };
}


function isProgramProfile(
  value: unknown
): value is ProgramProfileResponse {
  return (
    isRecord(value) &&

    typeof value.id ===
      "string" &&

    typeof value.mainTopic ===
      "string" &&

    typeof value.broadcastDate ===
      "string"
  );
}


function convertPersianDateToGregorian(
  value: DateObject
): string {
  return new DateObject(value)
    .convert(
      gregorian,
      gregorianEn
    )
    .format(
      "YYYY-MM-DD"
    );
}


function formatPersianDate(
  value: string
): string {
  const date =
    new Date(
      normalizeDigits(value)
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "fa-IR",
    {
      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit",
    }
  ).format(date);
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


function normalizePagination(
  value: unknown,
  itemCount: number,
  requestedPage: number
): ProgramProfilePagination {
  const defaultPagination:
    ProgramProfilePagination = {
    currentPage:
      requestedPage,

    pageSize:
      PAGE_SIZE,

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

  if (!isRecord(value)) {
    return defaultPagination;
  }

  const currentPage =
    readNumber(
      value.currentPage
    ) ??
    readNumber(
      value.pageNumber
    ) ??
    defaultPagination.currentPage;

  const pageSize =
    readNumber(
      value.pageSize
    ) ??
    defaultPagination.pageSize;

  const totalCount =
    readNumber(
      value.totalCount
    ) ??
    defaultPagination.totalCount;

  const totalPages =
    readNumber(
      value.totalPages
    ) ??
    (
      totalCount > 0
        ? Math.ceil(
            totalCount /
              pageSize
          )
        : 0
    );

  return {
    currentPage,

    pageSize,

    totalCount,

    totalPages,

    hasPrevious:
      typeof value.hasPrevious ===
      "boolean"
        ? value.hasPrevious
        : currentPage > 1,

    hasNext:
      typeof value.hasNext ===
      "boolean"
        ? value.hasNext
        : currentPage <
          totalPages,
  };
}


function createFallbackPagination(
  itemCount: number,
  requestedPage: number
): ProgramProfilePagination {
  return {
    currentPage:
      requestedPage,

    pageSize:
      PAGE_SIZE,

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
}


function readNumber(
  value: unknown
): number | null {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return null;
  }

  return value;
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


function getErrorMessage(
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


const labelClass =
  `
    mb-2
    block
    text-sm
    font-semibold
    text-gray-700
  `;

const dateInputClass =
  `
    h-11
    w-full
    rounded-lg
    border
    border-gray-300
    bg-white
    px-3
    text-right
    outline-none
    transition
    focus:border-[#007fcf]
  `;

const headerClass =
  `
    whitespace-nowrap
    px-4 py-4
    font-semibold
  `;

const cellClass =
  `
    whitespace-nowrap
    px-4 py-4
    text-gray-600
  `;

const paginationButtonClass =
  `
    rounded-lg
    border
    border-gray-300
    px-4 py-2
    text-sm
    font-semibold
    text-gray-700
    transition
    hover:bg-gray-50
    disabled:cursor-not-allowed
    disabled:opacity-40
  `;