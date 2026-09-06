"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Eye,
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
  ] = useState<Forecast[]>([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  /*
   * دریافت پیش‌بینی‌های ارسال‌شده
   * برای بررسی مدیر گروه
   */
  useEffect(() => {
    let cancelled =
      false;

    async function loadItems() {
      try {
        setIsLoading(true);
        setError("");

        const items =
          await getReviewForecasts();

        if (!cancelled) {
          setForecasts(
            Array.isArray(items)
              ? items
              : []
          );
        }
      } catch (loadError) {
        if (!cancelled) {
          setForecasts([]);

          setError(
            loadError instanceof Error
              ? loadError.message
              : "دریافت موضوعات انجام نشد."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadItems();

    return () => {
      cancelled =
        true;
    };
  }, []);


  /*
   * فقط موضوعات در انتظار بررسی
   */
  const pendingForecasts =
    useMemo(
      () =>
        forecasts.filter(
          (forecast) =>
            isPendingReviewStatus(
              forecast.status
            )
        ),
      [forecasts]
    );


  /*
   * رفتن به صفحه مشاهده و بررسی
   */
  function handleReview(
    forecastId: string
  ) {
    router.push(
      `/forecasts/review/${forecastId}`
    );
  }


  if (isLoading) {
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
          <div
            className="
              rounded-xl
              border border-gray-200
              bg-white
              p-8
              text-center
              text-sm
              text-gray-500
              shadow-sm
            "
          >
            در حال دریافت موارد نیازمند بررسی...
          </div>
        </section>
      </main>
    );
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
        <header className="mb-6">
          <h1
            className="
              text-2xl
              font-bold
              text-gray-800
            "
          >
            موضوعات نیازمند بررسی
          </h1>

          <p
            className="
              mt-2
              text-sm
              text-gray-500
            "
          >
            موضوعات ارسال‌شده برای مدیر گروه در این بخش
            نمایش داده می‌شوند.
          </p>
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
              text-red-700
            "
          >
            {error}
          </div>
        )}


        {/* جدول کارتابل */}
        <div
          className="
            overflow-hidden
            rounded-xl
            border border-gray-200
            bg-white
            shadow-sm
          "
        >
          <div className="overflow-x-auto">
            <table
              className="
                w-full
                min-w-[760px]
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
                      w-20
                      px-4 py-4
                      text-center
                      font-bold
                    "
                  >
                    ردیف
                  </th>

                  <th
                    className="
                      px-4 py-4
                      text-right
                      font-bold
                    "
                  >
                    موضوع اصلی
                  </th>

                  <th
                    className="
                      px-4 py-4
                      text-center
                      font-bold
                    "
                  >
                    تاریخ پخش
                  </th>

                  <th
                    className="
                      px-4 py-4
                      text-center
                      font-bold
                    "
                  >
                    شماره قسمت
                  </th>

                  <th
                    className="
                      px-4 py-4
                      text-center
                      font-bold
                    "
                  >
                    وضعیت
                  </th>

                  <th
                    className="
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
                {pendingForecasts.map(
                  (
                    forecast,
                    index
                  ) => (
                    <tr
                      key={forecast.id}
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
                          text-gray-800
                        "
                      >
                        {forecast.mainTopic ||
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
                          forecast.broadcastDate
                        )}
                      </td>

                      <td
                        className="
                          px-4 py-4
                          text-center
                        "
                      >
                        {forecast.episodeNumber !=
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
                          <Eye size={17} />

                          مشاهده و بررسی
                        </button>
                      </td>
                    </tr>
                  )
                )}


                {!error &&
                  pendingForecasts.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={6}
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
      </section>
    </main>
  );
}


/*
 * تشخیص وضعیت PendingReview
 *
 * Backend ممکن است وضعیت را
 * به‌صورت عدد یا رشته برگرداند.
 */
function isPendingReviewStatus(
  status: unknown
): boolean {
  return (
    status === 2 ||
    status === "2" ||
    status ===
      "PendingReview"
  );
}


/*
 * تبدیل تاریخ ISO میلادی Backend
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
    normalizeDigits(value);

  const date =
    new Date(normalizedValue);

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

      /*
       * مانع جابه‌جایی روز بر اثر
       * اختلاف منطقه زمانی می‌شود.
       */
      timeZone:
        "UTC",
    }
  ).format(date);
}


/*
 * تبدیل اعداد انگلیسی به فارسی
 */
function toPersianNumber(
  value: string | number
): string {
  return String(value).replace(
    /\d/g,
    (digit) =>
      "۰۱۲۳۴۵۶۷۸۹"[
        Number(digit)
      ]
  );
}


/*
 * تبدیل اعداد فارسی و عربی
 * به انگلیسی برای ساخت Date
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