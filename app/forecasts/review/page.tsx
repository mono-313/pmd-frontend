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

import {
  getReviewForecasts,
} from "@/app/lib/forecast-api";


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


          const items =
            await getReviewForecasts();


          if (signal?.aborted) {
            return;
          }


          setForecasts(
            items
          );
        } catch (loadError) {
          if (signal?.aborted) {
            return;
          }


          setForecasts([]);


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
      []
    );


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


  return (
    <main
      className="
        min-h-screen
        bg-gray-50
        px-4 py-8
        sm:px-6
      "
      dir="rtl"
    >
      <section
        className="
          mx-auto
          max-w-7xl
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
            gap-4
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
                  min-w-[920px]
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
                        min-w-[220px]
                        px-4 py-4
                        text-right
                        font-bold
                      "
                    >
                      موضوع اصلی
                    </th>

                    <th
                      className="
                        min-w-[150px]
                        px-4 py-4
                        text-right
                        font-bold
                      "
                    >
                      ثبت‌کننده
                    </th>

                    <th
                      className="
                        min-w-[130px]
                        px-4 py-4
                        text-center
                        font-bold
                      "
                    >
                      تاریخ پخش
                    </th>

                    <th
                      className="
                        min-w-[100px]
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
                        min-w-[170px]
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
                            index + 1
                          )}
                        </td>


                        <td
                          className="
                            px-4 py-4
                            font-semibold
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
                          colSpan={7}
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