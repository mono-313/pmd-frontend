"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  CalendarDays,
  FilePlus2,
  LoaderCircle,
  MoreVertical,
  RotateCcw,
  Search,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import type {
  ForecastResponse,
  PaginationMetadata,
} from "@/app/types/forecast";

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


  import IssueProgramProfileDialog from
  "@/app/component/program-profiles/IssueProgramProfileDialog";

interface ApprovedForecastListResponse {
  items: ForecastResponse[];

  pagination: PaginationMetadata;
}


export default function ApprovedForecastsPage() {
  const router =
    useRouter();

  const menuContainerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const [
    forecasts,
    setForecasts,
  ] = useState<ForecastResponse[]>(
    []
  );

  const [
    pagination,
    setPagination,
  ] = useState<PaginationMetadata | null>(
    null
  );


  const [
    fromDate,
    setFromDate,
  ] = useState<DateObject | null>(
    null
  );

  const [
  selectedForecast,
  setSelectedForecast,
  ] = useState<ForecastResponse | null>(
    null
  );

  const [
    toDate,
    setToDate,
  ] = useState<DateObject | null>(
    null
  );

  const [
    appliedFromDate,
    setAppliedFromDate,
  ] = useState<string>("");

  const [
    appliedToDate,
    setAppliedToDate,
  ] = useState<string>("");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    openMenuId,
    setOpenMenuId,
  ] = useState<string | null>(
    null
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  /*
   * دریافت فقط Forecastهای تأییدشده
   */
  const loadApprovedForecasts =
    useCallback(
      async () => {
        try {
          setIsLoading(true);
          setError("");

          const query =
            new URLSearchParams({
              status:
                "Approved",

              pageNumber:
                String(
                  currentPage
                ),

              pageSize:
                "10",
            });

          /*
           * تاریخ ورودی HTML به شکل
           * YYYY-MM-DD و با ارقام انگلیسی است.
           */
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
              `/api/forecasts?${query.toString()}`,
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
                `دریافت موضوعات تأییدشده انجام نشد. کد پاسخ: ${response.status}`
            );
          }

          console.log(
  "Approved forecasts response:",
  responseData
);

if (
  !isRecord(responseData) ||
  !Array.isArray(
    responseData.items
  )
) {
  console.error(
    "Invalid approved forecasts response:",
    responseData
  );

  throw new Error(
    "ساختار پاسخ فهرست موضوعات تأییدشده معتبر نیست."
  );
}

setForecasts(
  responseData.items as
    ForecastResponse[]
);

if (
  isRecord(
    responseData.pagination
  )
) {
  setPagination(
    responseData.pagination as
      unknown as
      PaginationMetadata
  );
} else {
  setPagination(null);
}
        } catch (loadError) {
          setForecasts([]);
          setPagination(null);

          setError(
            loadError instanceof Error
              ? loadError.message
              : "دریافت اطلاعات انجام نشد."
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
    void loadApprovedForecasts();
  }, [loadApprovedForecasts]);


  /*
   * بسته‌شدن منوی سه‌نقطه
   * با کلیک بیرون از آن
   */
  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent
    ) {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(
          event.target as Node
        )
      ) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

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
    fromGregorian > toGregorian
  ) {
    setError(
      "تاریخ شروع نباید بعد از تاریخ پایان باشد."
    );

    return;
  }

  /*
   * مقادیر تبدیل‌شده میلادی
   * برای Query ذخیره می‌شوند.
   */
  setAppliedFromDate(
    fromGregorian
  );

  setAppliedToDate(
    toGregorian
  );

  setCurrentPage(1);
}


function handleResetFilters() {
  setFromDate(null);
  setToDate(null);

  setAppliedFromDate("");
  setAppliedToDate("");

  setCurrentPage(1);
  setError("");
}


function handleIssueProfile(
  forecast: ForecastResponse
) {
  setOpenMenuId(null);

  setSelectedForecast(
    forecast
  );
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
          <h1
            className="
              text-2xl
              font-bold
              text-gray-800
            "
          >
            موضوعات تأییدشده
          </h1>

          <p
            className="
              mt-2
              text-sm
              text-gray-500
            "
          >
            موضوعات تأییدشده آماده تبدیل به شناسنامه هستند.
          </p>
        </header>


        {/* فیلتر بازه زمانی */}
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
              flex items-center
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
                htmlFor="fromDate"
                className="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-gray-700
                "
              >
                از تاریخ
              </label>
              <DatePicker
                      value={fromDate}
                      onChange={(value) => {
                        if (
                          value instanceof DateObject
                        ) {
                          setFromDate(value);
                        } else {
                          setFromDate(null);
                        }
                      }}
                      calendar={persian}
                      locale={persianFa}
                      format="YYYY/MM/DD"
                      calendarPosition="bottom-right"
                      placeholder="انتخاب تاریخ شروع"
                      inputClass="
                        h-11
                        w-full
                        rounded-lg
                        border
                        border-gray-300
                        bg-white
                        px-3
                        text-right
                        outline-none
                        focus:border-[#007fcf]
                      "
                      containerClassName="w-full"
                    />

              
            </div>

            <div>
              <label
                htmlFor="toDate"
                className="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-gray-700
                "
              >
                تا تاریخ
              </label>
              <DatePicker
                    value={toDate}
                    onChange={(value) => {
                      if (
                        value instanceof DateObject
                      ) {
                        setToDate(value);
                      } else {
                        setToDate(null);
                      }
                    }}
                    calendar={persian}
                    locale={persianFa}
                    format="YYYY/MM/DD"
                    calendarPosition="bottom-right"
                    placeholder="انتخاب تاریخ پایان"
                    inputClass="
                      h-11
                      w-full
                      rounded-lg
                      border
                      border-gray-300
                      bg-white
                      px-3
                      text-right
                      outline-none
                      focus:border-[#007fcf]
                    "
                    containerClassName="w-full"
                  />

              
            </div>

            <button
              type="button"
              onClick={
                handleApplyFilters
              }
              className="
                flex
                h-11
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
                flex
                h-11
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

            <p>{error}</p>
          </div>
        )}


        <section
          className="
            overflow-visible
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

              در حال دریافت موضوعات...
            </div>
          ) : forecasts.length === 0 ? (
            <div
              className="
                flex
                min-h-64
                items-center
                justify-center
                text-gray-500
              "
            >
              موضوع تأییدشده‌ای پیدا نشد.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="
                  w-full
                  min-w-[950px]
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
                      قسمت
                    </th>

                    <th className={headerClass}>
                      موضوع اصلی
                    </th>

                    <th className={headerClass}>
                      تاریخ پخش
                    </th>

                    <th className={headerClass}>
                      ثبت‌کننده
                    </th>

                    <th className={headerClass}>
                      وضعیت
                    </th>

                    <th
                      className={`
                        ${headerClass}
                        w-20
                        text-center
                      `}
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
                        key={forecast.id}
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
                              currentPage - 1
                            ) * 10 + index + 1}
                        </td>

                        <td className={cellClass}>
                          {forecast.planId}
                        </td>

                        <td className={cellClass}>
                          {forecast.episodeNumber}
                        </td>

                        <td
                          className={`
                            ${cellClass}
                            max-w-xs
                            font-semibold
                            text-gray-800
                          `}
                        >
                          {forecast.mainTopic}
                        </td>

                        <td className={cellClass}>
                          {formatPersianDate(
                            forecast.broadcastDate
                          )}
                        </td>

                        <td className={cellClass}>
                          {forecast.createdByUserName ||
                            "—"}
                        </td>

                        <td className={cellClass}>
                          <span
                            className="
                              inline-flex
                              rounded-full
                              bg-green-100
                              px-3 py-1
                              text-xs
                              font-bold
                              text-green-700
                            "
                          >
                            تأییدشده
                          </span>
                        </td>

                        <td
                          className={`
                            ${cellClass}
                            text-center
                          `}
                        >
                          <div
                            ref={
                              openMenuId ===
                              forecast.id
                                ? menuContainerRef
                                : undefined
                            }
                            className="
                              relative
                              inline-block
                            "
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenuId(
                                  (
                                    previous
                                  ) =>
                                    previous ===
                                    forecast.id
                                      ? null
                                      : forecast.id
                                )
                              }
                              className="
                                rounded-lg
                                p-2
                                text-gray-600
                                transition
                                hover:bg-gray-100
                                hover:text-[#007fcf]
                              "
                              aria-label="نمایش عملیات"
                              aria-expanded={
                                openMenuId ===
                                forecast.id
                              }
                            >
                              <MoreVertical
                                size={21}
                              />
                            </button>

                            {openMenuId ===
                              forecast.id && (
                              <div
                                className="
                                  absolute
                                  left-0
                                  top-full
                                  z-30
                                  mt-1
                                  w-56
                                  overflow-hidden
                                  rounded-xl
                                  border
                                  border-gray-200
                                  bg-white
                                  p-1
                                  text-right
                                  shadow-xl
                                "
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                              handleIssueProfile(
                                                forecast
                                              )
                                            }
                                  className="
                                    flex
                                    w-full
                                    items-center
                                    gap-3
                                    rounded-lg
                                    px-3 py-3
                                    text-sm
                                    font-semibold
                                    text-gray-700
                                    transition
                                    hover:bg-blue-50
                                    hover:text-[#007fcf]
                                  "
                                >
                                  <FilePlus2
                                    size={18}
                                  />

                                  تبدیل به شناسنامه
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}


          {/* صفحه‌بندی */}
          {!isLoading &&
            pagination &&
            pagination.totalPages > 1 && (
              <footer
                className="
                  flex
                  items-center
                  justify-between
                  border-t
                  border-gray-200
                  px-5 py-4
                "
              >
                <p
                  className="
                    text-sm
                    text-gray-500
                  "
                >
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
                    صفحه {pagination.currentPage}
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
      {selectedForecast && (
  <IssueProgramProfileDialog
    forecast={
      selectedForecast
    }
    onClose={() =>
      setSelectedForecast(
        null
      )
    }
    onIssued={(
      issuedForecastId
    ) => {
      /*
       * از جدول فعلی حذف می‌شود تا
       * دوباره برای آن شناسنامه صادر نشود.
       */
      setForecasts(
        (previous) =>
          previous.filter(
            (forecast) =>
              forecast.id !==
              issuedForecastId
          )
      );

      setSelectedForecast(
        null
      );

      /*
       * بعد از ثبت موفق، به لیست
       * شناسنامه‌ها منتقل می‌شود.
       */
      router.push(
        "/program-profiles"
      );

      router.refresh();
    }}
  />
)}
    </main>
  );
}


function isApprovedForecastListResponse(
  value: unknown
): value is ApprovedForecastListResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.items) &&
    value.items.every(
      isForecastResponse
    ) &&
    isPaginationMetadata(
      value.pagination
    )
  );
}


function isForecastResponse(
  value: unknown
): value is ForecastResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id ===
      "string" &&

    typeof value.planId ===
      "number" &&

    typeof value.mainTopic ===
      "string" &&

    typeof value.broadcastDate ===
      "string" &&

    typeof value.status ===
      "string"
  );
}


function isPaginationMetadata(
  value: unknown
): value is PaginationMetadata {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.currentPage ===
      "number" &&

    typeof value.totalPages ===
      "number" &&

    typeof value.pageSize ===
      "number" &&

    typeof value.totalCount ===
      "number" &&

    typeof value.hasPrevious ===
      "boolean" &&

    typeof value.hasNext ===
      "boolean"
  );
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


function formatPersianDate(
  value: string
): string {
  const date =
    new Date(value);

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


function getRowNumber(
  index: number,
  pagination: PaginationMetadata | null
): number {
  if (!pagination) {
    return index + 1;
  }

  return (
    (
      pagination.currentPage - 1
    ) *
      pagination.pageSize +
    index +
    1
  );
}


const headerClass =
  "whitespace-nowrap px-4 py-4 font-semibold";

const cellClass =
  "px-4 py-4 text-gray-600";

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




  function convertPersianDateToGregorian(
  value: DateObject
): string {
  return new DateObject(value)
    .convert(
      gregorian,
      gregorianEn
    )
    .format("YYYY-MM-DD");
}