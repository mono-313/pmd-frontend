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
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Eye,
  LoaderCircle,
  RefreshCcw,
} from "lucide-react";

import {
  hasPermission,
} from "@/app/lib/permissions";

import {
  PERMISSIONS,
} from "@/app/types/authorization";

import type {
  ProgramProfileResponse,
} from "@/app/types/program-profile";


const PAGE_SIZE =
  10;


/*
 * چون مستند Backend برای فهرست شناسنامه‌ها
 * پارامتر status تعریف نکرده، فعلاً فهرست
 * دریافت و در Frontend بر اساس نقش و وضعیت
 * مرحله جاری فیلتر می‌شود.
 */
const BACKEND_PAGE_SIZE =
  1000;


interface StoredUserSession {
  roles?: unknown;
  profileRole?: unknown;
  profile_role?: unknown;
}


export default function ProgramProfileReviewList() {
  const [
    profiles,
    setProfiles,
  ] = useState<
    ProgramProfileResponse[]
  >([]);

  const [
    roles,
    setRoles,
  ] = useState<string[]>([]);

  const [
    sessionLoaded,
    setSessionLoaded,
  ] = useState(false);

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


  /*
   * دریافت نقش‌های کاربر از نشست ذخیره‌شده.
   */
  useEffect(() => {
    setRoles(
      readStoredRoles()
    );

    setSessionLoaded(true);
  }, []);


  const canViewReviewList =
    useMemo(
      () =>
        hasPermission(
          roles,
          PERMISSIONS.PROFILE_REVIEW_LIST
        ),
      [
        roles,
      ]
    );


  /*
   * دریافت فهرست شناسنامه‌ها.
   */
  const loadProfiles =
    useCallback(
      async () => {
        if (
          !sessionLoaded ||
          !canViewReviewList
        ) {
          setIsLoading(false);
          return;
        }

        try {
          setIsLoading(true);
          setError("");

          const query =
            new URLSearchParams({
              pageNumber:
                "1",

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
                  "دریافت کارتابل شناسنامه‌ها انجام نشد. " +
                  `کد پاسخ: ${response.status}`
                )
            );
          }

          const profileItems =
            extractProfileItems(
              responseData
            );

          if (!profileItems) {
            console.error(
              "Invalid program profile review list response:",
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
            profileItems
          );

          setCurrentPage(1);
        } catch (loadError) {
          setProfiles([]);

          setError(
            loadError instanceof Error
              ? loadError.message
              : "دریافت کارتابل شناسنامه‌ها انجام نشد."
          );
        } finally {
          setIsLoading(false);
        }
      },
      [
        canViewReviewList,
        sessionLoaded,
      ]
    );


  useEffect(() => {
    void loadProfiles();
  }, [
    loadProfiles,
  ]);


  /*
   * هر نقش فقط مرحله مربوط به خودش را می‌بیند.
   */
  const assignedProfiles =
    useMemo(
      () =>
        profiles.filter(
          (profile) =>
            isProfileAssignedToRoles(
              profile,
              roles
            )
        ),
      [
        profiles,
        roles,
      ]
    );


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        assignedProfiles.length /
          PAGE_SIZE
      )
    );


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
          PAGE_SIZE;

        return assignedProfiles.slice(
          startIndex,
          startIndex +
            PAGE_SIZE
        );
      },
      [
        assignedProfiles,
        currentPage,
      ]
    );


  if (
    !sessionLoaded
  ) {
    return (
      <PageLoading />
    );
  }


  if (
    !canViewReviewList
  ) {
    return (
      <main
        className="
          min-h-screen
          bg-gray-50
          px-4
          py-8
        "
        dir="rtl"
      >
        <section
          className="
            mx-auto
            max-w-4xl
            rounded-2xl
            border
            border-red-200
            bg-red-50
            p-6
            text-red-700
          "
        >
          <div
            className="
              flex
              items-start
              gap-3
            "
          >
            <AlertCircle
              className="mt-0.5 shrink-0"
              size={22}
            />

            <div>
              <h1
                className="
                  text-lg
                  font-bold
                "
              >
                عدم دسترسی
              </h1>

              <p
                className="
                  mt-2
                  text-sm
                "
              >
                شما مجوز مشاهده کارتابل ارجاعات شناسنامه را ندارید.
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }


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
                bg-blue-100
                text-[#007fcf]
              "
            >
              <ClipboardCheck
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
                کارتابل ارجاعات شناسنامه
              </h1>

              <p
                className="
                  mt-1
                  text-sm
                  text-gray-500
                "
              >
                شناسنامه‌های منتظر بررسی در مرحله جاری
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadProfiles()
            }
            disabled={
              isLoading
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

            <span>
              {error}
            </span>
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
                    className="animate-spin"
                    size={23}
                  />

                  در حال دریافت ارجاعات...
                </div>
              )
            : visibleProfiles.length === 0
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
                    <ClipboardCheck
                      size={42}
                      className="text-gray-300"
                    />

                    <p
                      className="
                        mt-4
                        font-medium
                        text-gray-600
                      "
                    >
                      شناسنامه‌ای برای بررسی در مرحله شما وجود ندارد.
                    </p>

                    <p
                      className="
                        mt-2
                        text-sm
                        text-gray-400
                      "
                    >
                      موارد جدید پس از ارجاع در این بخش نمایش داده می‌شوند.
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
                        min-w-[1000px]
                        border-collapse
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
                          <th
                            className="px-4 py-4 text-right"
                          >
                            ردیف
                          </th>

                          <th
                            className="px-4 py-4 text-right"
                          >
                            شماره برنامه
                          </th>

                          <th
                            className="px-4 py-4 text-right"
                          >
                            موضوع اصلی
                          </th>

                          <th
                            className="px-4 py-4 text-right"
                          >
                            نوع برنامه
                          </th>

                          <th
                            className="px-4 py-4 text-right"
                          >
                            مرحله جاری
                          </th>

                          <th
                            className="px-4 py-4 text-right"
                          >
                            تاریخ پخش
                          </th>

                          <th
                            className="px-4 py-4 text-right"
                          >
                            صادرکننده
                          </th>

                          <th
                            className="px-4 py-4 text-center"
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
                                hover:bg-blue-50/40
                              "
                            >
                              <td
                                className="px-4 py-4"
                              >
                                {(
                                  currentPage -
                                  1
                                ) *
                                  PAGE_SIZE +
                                  index +
                                  1}
                              </td>

                              <td
                                className="
                                  px-4
                                  py-4
                                  font-medium
                                "
                              >
                                {profile.planId}
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

                              <td
                                className="px-4 py-4"
                              >
                                {profile.programTypeName ||
                                  getProgramTypeName(
                                    profile.programType
                                  )}
                              </td>

                              <td
                                className="px-4 py-4"
                              >
                                <StatusBadge
                                  profile={
                                    profile
                                  }
                                />
                              </td>

                              <td
                                className="px-4 py-4"
                              >
                                {formatPersianDate(
                                  profile.broadcastDate
                                )}
                              </td>

                              <td
                                className="px-4 py-4"
                              >
                                {profile.createdByUserName ||
                                  "—"}
                              </td>

                              <td
                                className="
                                  px-4
                                  py-4
                                  text-center
                                "
                              >
                                <Link
                                  href={`/program-profiles/review/${encodeURIComponent(
                                        profile.id
                                      )}`}
                                  className="
                                    inline-flex
                                    items-center
                                    gap-2
                                    rounded-lg
                                    border
                                    border-blue-200
                                    bg-blue-50
                                    px-3
                                    py-2
                                    text-sm
                                    font-medium
                                    text-[#007fcf]
                                    transition
                                    hover:border-[#007fcf]
                                    hover:bg-[#007fcf]
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
            assignedProfiles.length >
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
                  تعداد کل ارجاعات:
                  {" "}
                  <strong
                    className="text-gray-700"
                  >
                    {assignedProfiles.length}
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
                    className="
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
                    "
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
                    className="
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
                    "
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


function StatusBadge({
  profile,
}: {
  profile:
    ProgramProfileResponse;
}) {
  return (
    <span
      className="
        inline-flex
        rounded-full
        bg-amber-100
        px-3
        py-1
        text-xs
        font-medium
        text-amber-700
      "
    >
      {profile.statusDisplayName ||
        getStatusTitle(
          profile.status
        )}
    </span>
  );
}


function PageLoading() {
  return (
    <main
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-gray-50
      "
      dir="rtl"
    >
      <div
        className="
          flex
          items-center
          gap-3
          text-gray-500
        "
      >
        <LoaderCircle
          className="animate-spin"
          size={22}
        />

        در حال دریافت اطلاعات کاربر...
      </div>
    </main>
  );
}


/*
 * تطبیق مرحله شناسنامه با نقش بررسی‌کننده.
 */
function isProfileAssignedToRoles(
  profile:
    ProgramProfileResponse,

  roles:
    readonly string[]
): boolean {
  const normalizedRoles =
    new Set(
      roles.map(
        normalizeRoleName
      )
    );

  /*
   * Admin تمام مراحل در انتظار را می‌بیند.
   */
  if (
    normalizedRoles.has(
      "admin"
    )
  ) {
    return isPendingStatus(
      profile.status
    );
  }

  if (
    profile.status ===
      "PendingGroupManager"
  ) {
    return (
      normalizedRoles.has(
        "networkgroupmanager"
      ) ||
      normalizedRoles.has(
        "networkgroup"
      )
    );
  }

  if (
    profile.status ===
      "PendingSupervisor"
  ) {
    /*
     * برنامه زنده:
     * programType = 10
     */
    if (
      Number(
        profile.programType
      ) === 10
    ) {
      return normalizedRoles.has(
        "livesupervisor"
      );
    }

    /*
     * برنامه ضبطی یا تولیدی:
     * programType = 20
     */
    if (
      Number(
        profile.programType
      ) === 20
    ) {
      return normalizedRoles.has(
        "supervisor"
      );
    }

    return false;
  }

  if (
    profile.status ===
      "PendingBroadcastManager"
  ) {
    return normalizedRoles.has(
      "broadcastmanager"
    );
  }

  if (
    profile.status ===
      "PendingPlanningManager"
  ) {
    return normalizedRoles.has(
      "planmanager"
    );
  }

  return false;
}


function isPendingStatus(
  status:
    ProgramProfileResponse["status"]
): boolean {
  return [
    "PendingGroupManager",
    "PendingSupervisor",
    "PendingBroadcastManager",
    "PendingPlanningManager",
  ].includes(
    status
  );
}


function normalizeRoleName(
  role:
    string
): string {
  return role
    .trim()
    .toLowerCase()
    .replace(
      /[\s_-]+/g,
      ""
    );
}


function readStoredRoles():
  string[] {
  try {
    const storedSession =
      window.localStorage.getItem(
        "pmd-user-session"
      );

    if (!storedSession) {
      return [];
    }

    const parsedSession =
      JSON.parse(
        storedSession
      ) as unknown;

    if (
      !isRecord(
        parsedSession
      )
    ) {
      return [];
    }

    const session =
      parsedSession as StoredUserSession;

    const roles =
      Array.isArray(
        session.roles
      )
        ? session.roles.filter(
            (
              role
            ): role is string =>
              typeof role ===
                "string" &&
              role.trim().length >
                0
          )
        : [];

    const profileRole =
      getString(
        session.profileRole
      ) ??
      getString(
        session.profile_role
      );

    return [
      ...new Set(
        profileRole
          ? [
              ...roles,
              profileRole,
            ]
          : roles
      ),
    ];
  } catch {
    return [];
  }
}


function extractProfileItems(
  value:
    unknown
): ProgramProfileResponse[] | null {
  if (
    Array.isArray(
      value
    )
  ) {
    return value.filter(
      isProgramProfile
    );
  }

  if (
    !isRecord(
      value
    )
  ) {
    return null;
  }

  const possibleArrays = [
    value.items,
    value.Items,
    value.data,
    value.Data,
    value.result,
    value.Result,
    value.programProfiles,
    value.ProgramProfiles,
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
        isProgramProfile
      );
    }

    if (
      isRecord(
        possibleArray
      )
    ) {
      const nestedItems =
        extractProfileItems(
          possibleArray
        );

      if (nestedItems) {
        return nestedItems;
      }
    }
  }

  return null;
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
    typeof value.mainTopic ===
      "string" &&
    typeof value.status ===
      "string"
  );
}


function getStatusTitle(
  status:
    ProgramProfileResponse["status"]
): string {
  switch (status) {
    case "Draft":
      return "پیش‌نویس";

    case "PendingGroupManager":
      return "در انتظار مدیر گروه";

    case "PendingSupervisor":
      return "در انتظار ناظر";

    case "PendingBroadcastManager":
      return "در انتظار مدیر پخش";

    case "PendingPlanningManager":
      return "در انتظار مدیر طرح و برنامه‌ریزی";

    case "Approved":
      return "تأیید نهایی";

    case "ReturnedForEdit":
      return "بازگشت برای اصلاح";

    default:
      return String(
        status
      );
  }
}


function getProgramTypeName(
  programType:
    unknown
): string {
  switch (
    Number(
      programType
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


function normalizeDigits(
  value:
    string
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