"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  AlertCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  Eye,
  LoaderCircle,
  RefreshCcw,
  Search,
} from "lucide-react";

import type {
  ProgramProfileResponse,
} from "@/app/types/program-profile";


const BACKEND_PAGE_SIZE =
  100;

const DISPLAY_PAGE_SIZE =
  10;

/*
 * جلوگیری از حلقه بی‌نهایت در صورت
 * نامعتبر بودن Pagination Backend.
 */
const MAX_BACKEND_PAGES =
  100;


interface NormalizedProfilePage {
  items:
    ProgramProfileResponse[];

  hasNext:
    boolean;
}


export default function ApprovedProgramProfilesPage() {
  const [
    profiles,
    setProfiles,
  ] = useState<
    ProgramProfileResponse[]
  >([]);

  const [
    searchText,
    setSearchText,
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


  /*
   * چون Backend پارامتر status ندارد،
   * تمام صفحات قابل‌دسترسی کاربر دریافت
   * و سپس Approvedها استخراج می‌شوند.
   */
  const loadApprovedProfiles =
    useCallback(
      async () => {
        try {
          setIsLoading(true);
          setError("");

          const allProfiles:
            ProgramProfileResponse[] = [];

          for (
            let pageNumber = 1;
            pageNumber <=
              MAX_BACKEND_PAGES;
            pageNumber += 1
          ) {
            const query =
              new URLSearchParams({
                pageNumber:
                  String(
                    pageNumber
                  ),

                pageSize:
                  String(
                    BACKEND_PAGE_SIZE
                  ),
              });

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
                  (
                    "دریافت شناسنامه‌های تأییدشده انجام نشد. " +
                    `کد پاسخ: ${response.status}`
                  )
              );
            }

            const normalizedPage =
              normalizeProfilePage(
                responseData
              );

            if (!normalizedPage) {
              console.error(
                "Invalid approved profiles response:",
                {
                  pageNumber,
                  responseData,
                  responseText,
                }
              );

              throw new Error(
                "ساختار پاسخ فهرست شناسنامه‌ها معتبر نیست."
              );
            }

            allProfiles.push(
              ...normalizedPage.items
            );

            if (
              !normalizedPage.hasNext
            ) {
              break;
            }
          }

          /*
           * حذف رکوردهای تکراری احتمالی.
           */
          const uniqueProfiles =
            [
              ...new Map(
                allProfiles.map(
                  (profile) => [
                    profile.id,
                    profile,
                  ]
                )
              ).values(),
            ];

          const approvedProfiles =
            uniqueProfiles
              .filter(
                (profile) =>
                  profile.status ===
                  "Approved"
              )
              .sort(
                compareProfilesDescending
              );

          setProfiles(
            approvedProfiles
          );

          setCurrentPage(1);
        } catch (loadError) {
          setProfiles([]);

          setError(
            loadError instanceof Error
              ? loadError.message
              : "دریافت شناسنامه‌های تأییدشده انجام نشد."
          );
        } finally {
          setIsLoading(false);
        }
      },
      []
    );


  useEffect(() => {
    void loadApprovedProfiles();
  }, [
    loadApprovedProfiles,
  ]);


  const filteredProfiles =
    useMemo(
      () => {
        const normalizedSearch =
          searchText
            .trim()
            .toLowerCase();

        if (!normalizedSearch) {
          return profiles;
        }

        return profiles.filter(
          (profile) => {
            const searchableValues = [
              profile.programName,
              profile.mainTopic,
              profile.planId,
              profile.createdByUserName,
              profile.programTypeName,
            ];

            return searchableValues.some(
              (value) =>
                String(
                  value ?? ""
                )
                  .toLowerCase()
                  .includes(
                    normalizedSearch
                  )
            );
          }
        );
      },
      [
        profiles,
        searchText,
      ]
    );


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredProfiles.length /
          DISPLAY_PAGE_SIZE
      )
    );


  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchText,
  ]);


  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);


  const visibleProfiles =
    useMemo(
      () => {
        const startIndex =
          (
            currentPage -
            1
          ) *
          DISPLAY_PAGE_SIZE;

        return filteredProfiles.slice(
          startIndex,
          startIndex +
            DISPLAY_PAGE_SIZE
        );
      },
      [
        currentPage,
        filteredProfiles,
      ]
    );


  return (
    <main
      className="
        min-h-screen
        min-w-0
        w-full
        overflow-x-hidden
        bg-gray-50
        px-4
        py-8
      "
      dir="rtl"
    >
      <section
        className="
          mx-auto
          w-full
          max-w-7xl
        "
      >
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
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-green-100
                text-green-700
              "
            >
              <Award
                size={23}
              />
            </div>

            <div>
              <h1
                className="
                  text-2xl
                  font-bold
                  text-gray-800
                "
              >
                شناسنامه‌های تأییدشده
              </h1>

              <p
                className="
                  mt-1
                  text-sm
                  text-gray-500
                "
              >
                شناسنامه‌هایی که تمام مراحل تأیید را طی کرده‌اند
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={
              isLoading
            }
            onClick={() =>
              void loadApprovedProfiles()
            }
            className="
              flex
              items-center
              gap-2
              rounded-xl
              border
              border-gray-300
              bg-white
              px-4
              py-2.5
              text-sm
              font-medium
              text-gray-700
              transition
              hover:border-[#007fcf]
              hover:text-[#007fcf]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {isLoading
              ? (
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                )
              : (
                  <RefreshCcw
                    size={18}
                  />
                )}

            به‌روزرسانی
          </button>
        </header>


        <section
          className="
            mb-5
            rounded-2xl
            border
            border-gray-200
            bg-white
            p-4
            shadow-sm
          "
        >
          <label
            htmlFor="approved-profile-search"
            className="
              mb-2
              block
              text-sm
              font-medium
              text-gray-700
            "
          >
            جست‌وجو در شناسنامه‌های تأییدشده
          </label>

          <div
            className="
              relative
              max-w-xl
            "
          >
            <Search
              size={19}
              className="
                absolute
                right-3
                top-1/2
                -translate-y-1/2
                text-gray-400
              "
            />

            <input
              id="approved-profile-search"
              type="search"
              value={
                searchText
              }
              onChange={(
                event
              ) =>
                setSearchText(
                  event.target.value
                )
              }
              placeholder="موضوع، نام برنامه، شماره برنامه یا ثبت‌کننده"
              className="
                h-11
                w-full
                rounded-xl
                border
                border-gray-300
                pr-10
                pl-3
                text-sm
                outline-none
                transition
                focus:border-[#007fcf]
              "
            />
          </div>
        </section>


        {error && (
          <div
            className="
              mb-5
              flex
              items-start
              gap-3
              rounded-xl
              border
              border-red-200
              bg-red-50
              p-4
              text-sm
              text-red-700
            "
          >
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
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
          {isLoading
            ? (
                <div
                  className="
                    flex
                    min-h-72
                    items-center
                    justify-center
                    gap-3
                    text-gray-500
                  "
                >
                  <LoaderCircle
                    size={22}
                    className="animate-spin"
                  />

                  در حال دریافت شناسنامه‌های تأییدشده...
                </div>
              )
            : visibleProfiles.length ===
                0
              ? (
                  <div
                    className="
                      flex
                      min-h-72
                      flex-col
                      items-center
                      justify-center
                      px-4
                      text-center
                    "
                  >
                    <Award
                      size={44}
                      className="text-gray-300"
                    />

                    <p
                      className="
                        mt-4
                        font-medium
                        text-gray-600
                      "
                    >
                      شناسنامه تأییدشده‌ای پیدا نشد.
                    </p>
                  </div>
                )
              : (
                  <div
                    className="overflow-x-auto"
                  >
                    <table
                      className="
                        w-full
                        min-w-[1050px]
                        text-sm
                      "
                    >
                      <thead
                        className="
                          bg-gray-50
                          text-gray-600
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
                            موضوع اصلی
                          </th>

                          <th className={headerClass}>
                            نوع برنامه
                          </th>

                          <th className={headerClass}>
                            تاریخ پخش
                          </th>

                          <th className={headerClass}>
                            مدت
                          </th>

                          <th className={headerClass}>
                            ثبت‌کننده
                          </th>

                          <th className={headerClass}>
                            وضعیت
                          </th>

                          <th
                            className="
                              px-4
                              py-4
                              text-center
                              font-semibold
                            "
                          >
                            عملیات
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {visibleProfiles.map(
                          (
                            profile,
                            index
                          ) => (
                            <tr
                              key={
                                profile.id
                              }
                              className="
                                border-t
                                border-gray-100
                                text-gray-700
                                transition
                                hover:bg-green-50/40
                              "
                            >
                              <td className={cellClass}>
                                {(
                                  currentPage -
                                  1
                                ) *
                                  DISPLAY_PAGE_SIZE +
                                  index +
                                  1}
                              </td>

                              <td className={cellClass}>
                                {profile.programName ||
                                  `برنامه شماره ${profile.planId}`}
                              </td>

                              <td
                                className="
                                  max-w-xs
                                  px-4
                                  py-4
                                  font-medium
                                  text-gray-800
                                "
                              >
                                {profile.mainTopic ||
                                  "—"}
                              </td>

                              <td className={cellClass}>
                                {profile.programTypeName ||
                                  getProgramTypeName(
                                    profile.programType
                                  )}
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
                                {profile.duration ||
                                  "—"}
                              </td>

                              <td className={cellClass}>
                                {profile.createdByUserName ||
                                  "—"}
                              </td>

                              <td className={cellClass}>
                                <span
                                  className="
                                    inline-flex
                                    rounded-full
                                    bg-green-100
                                    px-3
                                    py-1
                                    text-xs
                                    font-medium
                                    text-green-700
                                  "
                                >
                                  {profile.statusDisplayName ||
                                    "تأیید نهایی"}
                                </span>
                              </td>

                              <td
                                className="
                                  px-4
                                  py-4
                                  text-center
                                "
                              >
                                <Link
                                  href={`/program-profiles/${encodeURIComponent(
                                    profile.id
                                  )}`}
                                  className="
                                    inline-flex
                                    items-center
                                    gap-2
                                    rounded-lg
                                    border
                                    border-green-200
                                    bg-green-50
                                    px-3
                                    py-2
                                    text-sm
                                    font-medium
                                    text-green-700
                                    transition
                                    hover:border-green-600
                                    hover:bg-green-600
                                    hover:text-white
                                  "
                                >
                                  <Eye
                                    size={17}
                                  />

                                  مشاهده
                                </Link>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}


          {!isLoading &&
            filteredProfiles.length >
              0 && (
              <footer
                className="
                  flex
                  flex-wrap
                  items-center
                  justify-between
                  gap-4
                  border-t
                  border-gray-200
                  bg-gray-50
                  px-5
                  py-4
                "
              >
                <p
                  className="
                    text-sm
                    text-gray-500
                  "
                >
                  تعداد کل شناسنامه‌های تأییدشده:
                  {" "}

                  <strong
                    className="text-gray-700"
                  >
                    {filteredProfiles.length}
                  </strong>
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
                    disabled={
                      currentPage <= 1
                    }
                    onClick={() =>
                      setCurrentPage(
                        (
                          previous
                        ) =>
                          Math.max(
                            1,
                            previous -
                              1
                          )
                      )
                    }
                    className={paginationButtonClass}
                  >
                    <ChevronRight
                      size={17}
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
                    {currentPage}
                    {" "}
                    از
                    {" "}
                    {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={
                      currentPage >=
                      totalPages
                    }
                    onClick={() =>
                      setCurrentPage(
                        (
                          previous
                        ) =>
                          Math.min(
                            totalPages,
                            previous +
                              1
                          )
                      )
                    }
                    className={paginationButtonClass}
                  >
                    بعدی

                    <ChevronLeft
                      size={17}
                    />
                  </button>
                </div>
              </footer>
            )}
        </section>
      </section>
    </main>
  );
}


function normalizeProfilePage(
  value:
    unknown
): NormalizedProfilePage | null {
  if (
    Array.isArray(
      value
    )
  ) {
    return {
      items:
        value.filter(
          isProgramProfile
        ),

      hasNext:
        false,
    };
  }

  if (
    !isRecord(
      value
    ) ||
    !Array.isArray(
      value.items
    )
  ) {
    return null;
  }

  const pagination =
    isRecord(
      value.pagination
    )
      ? value.pagination
      : null;

  const currentPage =
    readNumber(
      pagination?.currentPage
    ) ??
    readNumber(
      pagination?.pageNumber
    ) ??
    1;

  const totalPages =
    readNumber(
      pagination?.totalPages
    ) ??
    currentPage;

  const hasNext =
    typeof pagination?.hasNext ===
      "boolean"
      ? pagination.hasNext
      : currentPage <
        totalPages;

  return {
    items:
      value.items.filter(
        isProgramProfile
      ),

    hasNext,
  };
}


function compareProfilesDescending(
  first:
    ProgramProfileResponse,

  second:
    ProgramProfileResponse
): number {
  const firstDate =
    Date.parse(
      first.lastModifiedDate ||
      first.createdDate ||
      ""
    );

  const secondDate =
    Date.parse(
      second.lastModifiedDate ||
      second.createdDate ||
      ""
    );

  const normalizedFirstDate =
    Number.isNaN(
      firstDate
    )
      ? 0
      : firstDate;

  const normalizedSecondDate =
    Number.isNaN(
      secondDate
    )
      ? 0
      : secondDate;

  return (
    normalizedSecondDate -
    normalizedFirstDate
  );
}


function isProgramProfile(
  value:
    unknown
): value is ProgramProfileResponse {
  return (
    isRecord(
      value
    ) &&
    typeof value.id ===
      "string" &&
    typeof value.status ===
      "string"
  );
}


function getProgramTypeName(
  value:
    unknown
): string {
  switch (
    Number(
      value
    )
  ) {
    case 10:
      return "زنده";

    case 20:
      return "ضبطی (تولیدی)";

    default:
      return "—";
  }
}


function formatPersianDate(
  value:
    string
): string {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      value
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
  ).format(
    date
  );
}


function parseJsonResponse(
  responseText:
    string
): unknown | null {
  if (
    !responseText.trim()
  ) {
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
  value:
    unknown
): string | null {
  if (
    !isRecord(
      value
    )
  ) {
    return null;
  }

  return (
    getString(
      value.message
    ) ??
    getString(
      value.description
    ) ??
    getString(
      value.detail
    ) ??
    getString(
      value.title
    ) ??
    getString(
      value.errors
    )
  );
}


function getString(
  value:
    unknown
): string | null {
  return (
    typeof value ===
      "string" &&
    value.trim()
  )
    ? value.trim()
    : null;
}


function readNumber(
  value:
    unknown
): number | null {
  if (
    typeof value ===
      "number" &&
    Number.isFinite(
      value
    )
  ) {
    return value;
  }

  if (
    typeof value ===
      "string" &&
    value.trim()
  ) {
    const numberValue =
      Number(
        value
      );

    return Number.isFinite(
      numberValue
    )
      ? numberValue
      : null;
  }

  return null;
}


function isRecord(
  value:
    unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(
      value
    )
  );
}


const headerClass =
  `
    whitespace-nowrap
    px-4
    py-4
    text-right
    font-semibold
  `;


const cellClass =
  `
    whitespace-nowrap
    px-4
    py-4
  `;


const paginationButtonClass =
  `
    flex
    items-center
    gap-1
    rounded-lg
    border
    border-gray-300
    bg-white
    px-3
    py-2
    text-sm
    text-gray-700
    disabled:cursor-not-allowed
    disabled:opacity-40
  `;