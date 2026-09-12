"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import ForecastStatusBadge from
  "@/app/component/forecast/forecast-status-badge";

import type {
  ForecastListResponse,
  ForecastResponse,
  ForecastStatus,
  PaginationMetadata,
} from "@/app/types/forecast";

import ForecastActions from
  "@/app/component/forecast/forecast-actions";

const initialPagination:
  PaginationMetadata = {
  totalCount: 0,

  currentPage: 1,

  pageSize: 10,

  totalPages: 0,

  hasNext: false,

  hasPrevious: false,
};


export default function ForecastListPage() {
  const [
    forecasts,
    setForecasts,
  ] = useState<ForecastResponse[]>([]);


  const [
  programNames,
  setProgramNames,
  ] = useState<Record<number, string>>({});


  const [
    pagination,
    setPagination,
  ] = useState<PaginationMetadata>(
    initialPagination
  );

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState<
    ForecastStatus | ""
  >("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  const loadForecasts =
    useCallback(
      async (
        pageNumber: number
      ) => {
        try {
          setIsLoading(true);
          setError("");


          const query =
            new URLSearchParams();

          query.set(
            "pageNumber",
            String(pageNumber)
          );

          query.set(
            "pageSize",
            "10"
          );


          if (selectedStatus) {
            query.set(
              "status",
              selectedStatus
            );
          }


          const response =
            await fetch(
              `/api/forecasts?${query.toString()}`,
              {
                method: "GET",

                cache: "no-store",
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
              getMessage(
                responseData
              ) ??
              `دریافت فهرست انجام نشد. کد پاسخ: ${response.status}`
            );
          }


          if (
            !isForecastListResponse(
              responseData
            )
          ) {
            throw new Error(
              "ساختار پاسخ فهرست پیش‌بینی‌ها معتبر نیست."
            );
          }


          setForecasts(
            responseData.items
          );

          setPagination(
            responseData.pagination
          );
        } catch (loadError) {
          setForecasts([]);

          setPagination(
            initialPagination
          );

          setError(
            loadError instanceof Error
              ? loadError.message
              : "دریافت فهرست انجام نشد."
          );
        } finally {
          setIsLoading(false);
        }
      },
      [
        selectedStatus,
      ]
    );


    



  useEffect(() => {
    loadForecasts(1);
  }, [
    loadForecasts,
  ]);

  const loadPrograms =
  useCallback(async () => {
    try {
      const response =
        await fetch(
          "/api/programs",
          {
            method: "GET",

            headers: {
              Accept:
                "application/json",
            },

            cache: "no-store",
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
          getMessage(
            responseData
          ) ??
          `دریافت برنامه‌ها انجام نشد. کد پاسخ: ${response.status}`
        );
      }

      const programs =
        extractPrograms(
          responseData
        );

      const nextProgramNames:
        Record<number, string> = {};

      programs.forEach(
        (program) => {
          nextProgramNames[
            program.id
          ] = program.name;
        }
      );

      setProgramNames(
        nextProgramNames
      );
    } catch (programsError) {
      console.error(
        "Load programs error:",
        programsError
      );

      /*
       * خطای برنامه‌ها نباید باعث شود
       * کل جدول پیش‌بینی‌ها نمایش داده نشود.
       */
      setProgramNames({});
    }
  }, []);


useEffect(() => {
  void loadPrograms();
}, [loadPrograms]);


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
        <header
          className="
            mb-6
            flex flex-col
            gap-4
            md:flex-row
            md:items-center
            md:justify-between
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
              لیست پیش‌بینی‌ها
            </h1>

            <p
              className="
                mt-2
                text-sm
                text-gray-500
              "
            >
              پیش‌بینی‌های ثبت‌شده متناسب با سطح دسترسی شما
            </p>
          </div>


          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <select
              value={
                selectedStatus
              }
              onChange={(event) =>
                setSelectedStatus(
                  event.target.value as
                    | ForecastStatus
                    | ""
                )
              }
              className="
                h-11
                rounded-lg
                border
                border-gray-300
                bg-white
                px-3
                outline-none
                focus:border-[#007fcf]
              "
            >
              <option value="">
                همه وضعیت‌ها
              </option>

              <option value="Draft">
                پیش‌نویس
              </option>

              <option value="PendingReview">
                در انتظار بررسی
              </option>

              <option value="Approved">
                تأیید شده
              </option>

              <option value="Rejected">
                رد شده
              </option>

              <option value="ReturnedForEdit">
                برگشت برای اصلاح
              </option>
            </select>


            <button
              type="button"
              onClick={() =>
                loadForecasts(
                  pagination.currentPage
                )
              }
              disabled={
                isLoading
              }
              className="
                flex h-11
                items-center
                gap-2
                rounded-lg
                border
                border-gray-300
                bg-white
                px-4
                text-gray-700
                hover:bg-gray-50
                disabled:opacity-60
              "
            >
              <RefreshCw
                size={17}
              />

              بروزرسانی
            </button>
          </div>
        </header>


        {error && (
          <div
            className="
              mb-5
              rounded-xl
              border
              border-red-200
              bg-red-50
              p-4
              text-sm
              text-red-700
            "
          >
            {error}
          </div>
        )}


        <div
          className="
            overflow-hidden
            rounded-2xl
            border
            border-gray-200
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
                  table-fixed
                  border-collapse
              "
            >
              <colgroup>
                    <col className="w-[4%]" />
                    <col className="w-[20%]" />
                    <col className="w-[4%]" />
                    <col className="w-[10%]" />
                    <col className="w-[7%]" />
                    <col className="w-[7%]" />
                    <col className="w-[10%]" />
                    <col className="w-[7%]" />
                    <col className="w-[7%]" />
                    </colgroup>
              <thead
                className="
                  bg-gray-50
                "
              >
                <tr>
                  <th className={headerClass}>
                    ردیف
                  </th>

                  <th className={headerClass}>
                    نام برنامه
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
                    کارشناس
                  </th>

                  <th className={headerClass}>
                    محورهای موضوعی
                  </th>

                  {/* <th className={headerClass}>
                    ثبت‌کننده
                  </th> */}

                  <th className={headerClass}>
                    وضعیت
                  </th>
                  <th className={headerClass}>
                    عملیات
                  </th>
                </tr>
              </thead>


              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="
                        py-16
                        text-center
                      "
                    >
                      <div
                        className="
                          flex
                          items-center
                          justify-center
                          gap-2
                          text-gray-500
                        "
                      >
                        <LoaderCircle
                          size={20}
                          className="
                            animate-spin
                          "
                        />

                        در حال دریافت پیش‌بینی‌ها...
                      </div>
                    </td>
                  </tr>
                ) : forecasts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="
                        py-16
                        text-center
                        text-gray-500
                      "
                    >
                      پیش‌بینی ثبت‌شده‌ای پیدا نشد.
                    </td>
                  </tr>
                ) : (
                  forecasts.map(
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
                          hover:bg-gray-50/70
                        "
                      >
                        <td className={cellClass}>
                          {(
                            pagination.currentPage -
                            1
                          ) *
                            pagination.pageSize +
                            index +
                            1}
                        </td>

                       <td
                          className="
                            px-3 py-4
                            align-middle
                            text-sm
                            text-gray-700
                          "
                        >
                          <span
                            className="
                              block
                              overflow-hidden
                              text-ellipsis
                              break-words
                              whitespace-normal
                              leading-6
                              line-clamp-2
                            "
                            title={getProgramName(
                              programNames,
                              forecast.planId
                            )}
                          >
                            {getProgramName(
                              programNames,
                              forecast.planId
                            )}
                          </span>
                        </td>

                        <td className={cellClass}>
                          {forecast.episodeNumber}
                        </td>

                        <td
                          className={`
                            ${cellClass}
                            max-w-64
                            whitespace-normal
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
                          {forecast.hasExpert
                            ? `${forecast.expertIds.length} کارشناس`
                            : "ندارد"}
                        </td>

                        <td className={cellClass}>
                          {forecast.topicAxes.length > 0
                            ? [...forecast.topicAxes]
                                .sort(
                                  (
                                    first,
                                    second
                                  ) =>
                                    first.displayOrder -
                                    second.displayOrder
                                )
                                .map(
                                  (
                                    axis
                                  ) =>
                                    axis.title
                                )
                                .join("، ")
                            : "—"}
                        </td>

                        {/* <td className={cellClass}>
                          {forecast.createdByUserName}
                        </td> */}

                        <td className={cellClass}>
                          <ForecastStatusBadge
                            status={
                              forecast.status
                            }
                          />
                        </td>
                        <td className={cellClass}>
                        <ForecastActions
                          forecast={forecast}
                          onChanged={() =>
                            loadForecasts(
                              pagination.currentPage
                            )
                          }
                        />
                      </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>


          <footer
            className="
              flex flex-col
              gap-3
              border-t
              border-gray-200
              px-5 py-4
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <p
              className="
                text-sm
                text-gray-500
              "
            >
              تعداد کل:
              {" "}
              {pagination.totalCount}
            </p>


            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <button
                type="button"
                onClick={() =>
                  loadForecasts(
                    pagination.currentPage -
                      1
                  )
                }
                disabled={
                  isLoading ||
                  !pagination.hasPrevious
                }
                className={paginationButtonClass}
              >
                <ChevronRight
                  size={18}
                />

                قبلی
              </button>


              <span
                className="
                  text-sm
                  text-gray-600
                "
              >
                صفحه
                {" "}
                {pagination.currentPage}
                {" "}
                از
                {" "}
                {Math.max(
                  pagination.totalPages,
                  1
                )}
              </span>


              <button
                type="button"
                onClick={() =>
                  loadForecasts(
                    pagination.currentPage +
                      1
                  )
                }
                disabled={
                  isLoading ||
                  !pagination.hasNext
                }
                className={paginationButtonClass}
              >
                بعدی

                <ChevronLeft
                  size={18}
                />
              </button>
            </div>
          </footer>
        </div>
      </section>
    </main>
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


function isForecastListResponse(
  value: unknown
): value is ForecastListResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(
      value.items
    ) &&
    isRecord(
      value.pagination
    )
  );
}


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


function getMessage(
  value: unknown
): string | null {
  if (!isRecord(value)) {
    return null;
  }

  return typeof value.message ===
    "string"
    ? value.message
    : null;
}


function formatPersianDate(
  isoDate: string
): string {
  const date =
    new Date(isoDate);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return isoDate;
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


const headerClass = `
  whitespace-nowrap
  px-4 py-4
  text-right
  text-xs
  font-bold
  text-gray-600
`;


const cellClass = `
  whitespace-nowrap
  px-4 py-4
  text-sm
  text-gray-600
`;


const paginationButtonClass = `
  flex
  items-center
  gap-1
  rounded-lg
  border
  border-gray-300
  bg-white
  px-3 py-2
  text-sm
  text-gray-700
  hover:bg-gray-50
  disabled:cursor-not-allowed
  disabled:opacity-50
`;



interface ProgramListItem {
  id: number;
  name: string;
}


function extractPrograms(
  value: unknown
): ProgramListItem[] {
  const rawPrograms =
    findProgramsArray(value);

  if (!rawPrograms) {
    console.error(
      "Programs array was not found:",
      value
    );

    return [];
  }

  return rawPrograms
    .map(normalizeProgram)
    .filter(
      (
        program
      ): program is ProgramListItem =>
        program !== null
    );
}


function findProgramsArray(
  value: unknown
): unknown[] | null {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return null;
  }

  const possibleFields = [
    "programs",
    "Programs",
    "items",
    "Items",
    "data",
    "Data",
    "result",
    "Result",
  ];

  for (
    const fieldName of
    possibleFields
  ) {
    const fieldValue =
      value[fieldName];

    if (Array.isArray(fieldValue)) {
      return fieldValue;
    }

    const nestedResult =
      findProgramsArray(
        fieldValue
      );

    if (nestedResult) {
      return nestedResult;
    }
  }

  return null;
}


function normalizeProgram(
  value: unknown
): ProgramListItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const rawId =
    value.id ??
    value.Id ??
    value.value ??
    value.Value ??
    value.planId ??
    value.PlanId;

  const rawName =
    value.name ??
    value.Name ??
    value.text ??
    value.Text ??
    value.title ??
    value.Title ??
    value.planName ??
    value.PlanName;

  const id =
    typeof rawId === "number"
      ? rawId
      : typeof rawId === "string"
        ? Number(rawId)
        : Number.NaN;

  const name =
    typeof rawName === "string"
      ? rawName.trim()
      : "";

  if (
    !Number.isFinite(id) ||
    !name
  ) {
    return null;
  }

  return {
    id,
    name,
  };
}


function getProgramName(
  programNames:
    Record<number, string>,
  planId: unknown
): string {
  const normalizedPlanId =
    readNumericValue(planId);

  if (normalizedPlanId === null) {
    return "—";
  }

  return (
    programNames[
      normalizedPlanId
    ] ??
    `برنامه شماره ${normalizedPlanId}`
  );
}



function readNumericValue(
  value: unknown
): number | null {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string" &&
          value.trim()
        ? Number(
            normalizeDigits(
              value
            )
          )
        : Number.NaN;

  return Number.isFinite(
    numericValue
  )
    ? numericValue
    : null;
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
