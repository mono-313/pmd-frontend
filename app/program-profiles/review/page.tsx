"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";
import {
  AlertCircle,
  Eye,
  FileCheck2,
  LoaderCircle,
  RefreshCcw,
  Search,
} from "lucide-react";

import type {
  ProgramProfileResponse,
  ProgramProfileStatus,
} from "@/app/types/program-profile";


const API_PAGE_SIZE = 100;
const TABLE_PAGE_SIZE = 10;

const PENDING_STATUSES = new Set<ProgramProfileStatus>([
  10,
  20,
  30,
  40,
]);

const STATUS_LABELS:
  Record<ProgramProfileStatus, string> = {
  0: "پیش‌نویس",
  10: "در انتظار مدیر گروه",
  20: "در انتظار ناظر",
  30: "در انتظار مدیر پخش",
  40: "در انتظار مدیر طرح و برنامه",
  50: "تأیید نهایی",
  60: "بازگشت برای اصلاح",
};


export default function ProgramProfileReviewInboxPage() {
  const router = useRouter();

  const [profiles, setProfiles] =
    useState<ProgramProfileResponse[]>([]);
  const [roles, setRoles] =
    useState<string[]>([]);
  const [searchText, setSearchText] =
    useState("");
  const [isLoading, setIsLoading] =
    useState(true);
  const [error, setError] =
    useState("");
  const [currentPage, setCurrentPage] =
    useState(1);
  const [programNames, setProgramNames] =
    useState<Record<number, string>>({});


  useEffect(() => {
    setRoles(readCurrentUserRoles());
  }, []);


  const loadInbox =
    useCallback(async () => {
      try {
        setIsLoading(true);
        setError("");

        const allProfiles =
          await fetchAllVisibleProfiles();

        console.info(
          "PROGRAM PROFILE REVIEW INBOX:",
          {
            receivedCount:
              allProfiles.length,
            pendingCount:
              allProfiles.filter(
                (profile) =>
                  PENDING_STATUSES.has(
                    profile.status
                  )
              ).length,
            statuses:
              countByStatus(
                allProfiles
              ),
          }
        );

        setProfiles(allProfiles);
      } catch (loadError) {
        console.error(
          "PROGRAM PROFILE REVIEW INBOX ERROR:",
          loadError
        );

        setProfiles([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "دریافت کارتابل شناسنامه‌ها انجام نشد."
        );
      } finally {
        setIsLoading(false);
      }
    }, []);


  useEffect(() => {
    void loadInbox();
  }, [loadInbox]);


  const loadPrograms =
    useCallback(async () => {
      try {
        const response = await fetch(
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
          parseJsonResponse(
            await response.text()
          );

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(
              responseData
            ) ??
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
          "PROGRAM NAMES ERROR:",
          programError
        );
        setProgramNames({});
      }
    }, []);


  useEffect(() => {
    void loadPrograms();
  }, [loadPrograms]);


  const inboxProfiles =
    useMemo(() => {
      const actionable =
        profiles.filter(
          (profile) =>
            isVisibleInInbox(
              profile,
              roles
            )
        );

      const query =
        searchText
          .trim()
          .toLocaleLowerCase("fa");

      if (!query) {
        return actionable;
      }

      return actionable.filter(
        (profile) =>
          [
            profile.mainTopic,
            getProgramName(
              programNames,
              profile
            ),
            profile.createdByUserName,
            profile.statusDisplayName,
          ].some(
            (value) =>
              typeof value === "string" &&
              value
                .toLocaleLowerCase("fa")
                .includes(query)
          )
      );
    }, [
      profiles,
      programNames,
      roles,
      searchText,
    ]);


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        inboxProfiles.length /
          TABLE_PAGE_SIZE
      )
    );


  const paginatedProfiles =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        TABLE_PAGE_SIZE;

      return inboxProfiles.slice(
        startIndex,
        startIndex + TABLE_PAGE_SIZE
      );
    }, [
      currentPage,
      inboxProfiles,
    ]);


  useEffect(() => {
    setCurrentPage(1);
  }, [searchText]);


  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);


  return (
    <main
      className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6"
      dir="rtl"
    >
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#007fcf] text-white shadow-sm">
                <FileCheck2 size={23} />
              </span>

              <div>
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  کارتابل ارجاعات شناسنامه
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  شناسنامه‌های منتظر بررسی در مرحله جاری
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              void loadInbox();
              void loadPrograms();
            }}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#007fcf] bg-white px-4 py-2.5 text-sm font-semibold text-[#007fcf] transition hover:bg-blue-50 disabled:opacity-50"
          >
            <RefreshCcw
              size={18}
              className={
                isLoading
                  ? "animate-spin"
                  : ""
              }
            />
            به‌روزرسانی
          </button>
        </header>


        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-gray-200 p-4 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-sm">
              <Search
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={searchText}
                onChange={(event) =>
                  setSearchText(
                    event.target.value
                  )
                }
                placeholder="جستجو در موضوع، برنامه یا ثبت‌کننده"
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-3 pr-10 text-sm outline-none transition focus:border-[#007fcf] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="text-sm text-gray-500">
              تعداد ارجاعات:
              <strong className="mr-1 text-gray-800">
                {toPersianNumber(
                  inboxProfiles.length
                )}
              </strong>
            </div>
          </div>


          {isLoading ? (
            <div className="flex min-h-72 items-center justify-center gap-3 text-gray-600">
              <LoaderCircle
                size={25}
                className="animate-spin text-[#007fcf]"
              />
              در حال دریافت ارجاعات شناسنامه...
            </div>
          ) : error ? (
            <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={22}
                  className="mt-0.5 shrink-0"
                />

                <div>
                  <p className="font-bold">
                    دریافت کارتابل انجام نشد
                  </p>
                  <p className="mt-1 text-sm leading-7">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          ) : inboxProfiles.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-5 text-center">
              <FileCheck2
                size={44}
                className="text-gray-300"
              />
              <p className="mt-4 font-bold text-gray-700">
                ارجاعی برای بررسی وجود ندارد
              </p>
              <p className="mt-2 max-w-xl text-sm leading-7 text-gray-500">
                اگر شناسنامه ارسال شده است، وضعیت آن باید
                PendingGroupManager باشد و مدیر گروه باید عضو همان
                networkGroupId شناسنامه باشد.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className=" min-w-[950px] text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <TableHead>ردیف</TableHead>
                    <TableHead>نام برنامه</TableHead>
                    <TableHead>موضوع اصلی</TableHead>
                    <TableHead>تاریخ پخش</TableHead>
                    <TableHead>ثبت‌کننده</TableHead>
                    <TableHead>مرحله جاری</TableHead>
                    <TableHead>عملیات</TableHead>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {paginatedProfiles.map(
                    (profile, index) => (
                      <tr
                        key={profile.id}
                        className="transition hover:bg-blue-50/40"
                      >
                        <TableCell>
                          {toPersianNumber(
                            (currentPage - 1) *
                              TABLE_PAGE_SIZE +
                              index +
                              1
                          )}
                        </TableCell>

                        <TableCell className="text-gray-800">
                          {getProgramName(
                            programNames,
                            profile
                          )}
                        </TableCell>

                        <TableCell>
                          {displayText(
                            profile.mainTopic
                          )}
                        </TableCell>

                        <TableCell>
                          {formatPersianDate(
                            profile.broadcastDate
                          )}
                        </TableCell>

                        <TableCell>
                          {displayText(
                            profile.createdByUserName
                          )}
                        </TableCell>

                        <TableCell>
                          <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs  text-amber-800">
                            {getStatusLabel(
                              profile
                            )}
                          </span>
                        </TableCell>

                        <TableCell>
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/program-profiles/review/${encodeURIComponent(
                                  profile.id
                                )}`
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-[#007fcf] px-3 py-2 font-semibold text-[#007fcf] transition hover:bg-[#007fcf] hover:text-white"
                          >
                            <Eye size={17} />
                            مشاهده و بررسی
                          </button>
                        </TableCell>
                      </tr>
                    )
                  )}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-4">
                  <span className="text-sm text-gray-500">
                    صفحه {toPersianNumber(currentPage)} از {toPersianNumber(totalPages)}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          (page) =>
                            Math.max(1, page - 1)
                        )
                      }
                      disabled={currentPage === 1}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      صفحه قبل
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          (page) =>
                            Math.min(
                              totalPages,
                              page + 1
                            )
                        )
                      }
                      disabled={
                        currentPage === totalPages
                      }
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      صفحه بعد
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}


function TableHead({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <th className="whitespace-nowrap px-4 py-4 text-right font-bold">
      {children}
    </th>
  );
}


function TableCell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td
      className={`whitespace-nowrap px-4 py-4 text-gray-600 ${className}`}
    >
      {children}
    </td>
  );
}


async function fetchAllVisibleProfiles():
  Promise<ProgramProfileResponse[]> {
  const firstPage =
    await fetchProfilePage(1);

  const allItems = [
    ...firstPage.items,
  ];

  const totalPages =
    Math.min(
      Math.max(
        firstPage.totalPages,
        1
      ),
      100
    );

  for (
    let pageNumber = 2;
    pageNumber <= totalPages;
    pageNumber += 1
  ) {
    const page =
      await fetchProfilePage(
        pageNumber
      );

    allItems.push(
      ...page.items
    );
  }

  return uniqueById(allItems);
}


async function fetchProfilePage(
  pageNumber: number
): Promise<{
  items: ProgramProfileResponse[];
  totalPages: number;
}> {
  const query =
    new URLSearchParams({
      pageNumber:
        String(pageNumber),
      pageSize:
        String(API_PAGE_SIZE),
    });

  /*
   * عمداً status ارسال نمی‌شود؛ چون طبق مستند جدید
   * GET /api/program-profiles پارامتر status ندارد.
   */
  const response =
    await fetch(
      `/api/program-profiles?${query.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
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
      getApiErrorMessage(
        responseData
      ) ??
        `دریافت شناسنامه‌ها انجام نشد. کد پاسخ: ${response.status}`
    );
  }

  const normalized =
    normalizeProfileList(
      responseData
    );

  if (!normalized) {
    throw new Error(
      "ساختار پاسخ فهرست شناسنامه‌ها معتبر نیست."
    );
  }

  return normalized;
}


function normalizeProfileList(
  value: unknown
): {
  items: ProgramProfileResponse[];
  totalPages: number;
} | null {
  if (Array.isArray(value)) {
    return {
      items:
        value.filter(
          isProgramProfile
        ),
      totalPages: 1,
    };
  }

  if (!isRecord(value)) {
    return null;
  }

  const possibleItems = [
    value.items,
    value.data,
    value.result,
  ];

  for (const candidate of possibleItems) {
    if (Array.isArray(candidate)) {
      return {
        items:
          candidate.filter(
            isProgramProfile
          ),
        totalPages:
          readTotalPages(
            value.pagination
          ),
      };
    }

    if (isRecord(candidate)) {
      const nested =
        normalizeProfileList(
          candidate
        );

      if (nested) {
        return nested;
      }
    }
  }

  return null;
}


function readTotalPages(
  value: unknown
): number {
  if (!isRecord(value)) {
    return 1;
  }

  const rawValue =
    value.totalPages ??
    value.TotalPages;

  return typeof rawValue === "number" &&
    Number.isFinite(rawValue)
    ? rawValue
    : 1;
}


function extractProgramNames(
  value: unknown
): Record<number, string> {
  const programs =
    findProgramsArray(value);

  const result:
    Record<number, string> = {};

  for (const program of programs) {
    if (!isRecord(program)) {
      continue;
    }

    const id = readPositiveNumber(
      program.id ??
        program.Id ??
        program.planId ??
        program.PlanId ??
        program.value ??
        program.Value
    );

    const rawName =
      program.name ??
      program.Name ??
      program.programName ??
      program.ProgramName ??
      program.planName ??
      program.PlanName ??
      program.title ??
      program.Title ??
      program.text ??
      program.Text;

    const name =
      typeof rawName === "string"
        ? rawName.trim()
        : "";

    if (id !== null && name) {
      result[id] = name;
    }
  }

  return result;
}


function findProgramsArray(
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

    const nestedPrograms =
      findProgramsArray(nested);

    if (nestedPrograms.length > 0) {
      return nestedPrograms;
    }
  }

  return [];
}


function getProgramName(
  programNames: Record<number, string>,
  profile: ProgramProfileResponse
): string {
  const planId =
    readPositiveNumber(
      profile.planId
    );

  if (
    planId !== null &&
    programNames[planId]
  ) {
    return programNames[planId];
  }

  return displayText(
    profile.programName
  );
}


function readPositiveNumber(
  value: unknown
): number | null {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string" &&
          value.trim()
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(numberValue) &&
    numberValue > 0
    ? numberValue
    : null;
}


function isVisibleInInbox(
  profile: ProgramProfileResponse,
  roles: string[]
): boolean {
  if (
    !PENDING_STATUSES.has(
      profile.status
    )
  ) {
    return false;
  }

  const normalizedRoles =
    roles.map(normalizeRole);

  if (
    normalizedRoles.includes(
      "admin"
    )
  ) {
    return true;
  }

  if (
    normalizedRoles.includes(
      "networkgroupmanager"
    )
  ) {
    return profile.status ===
     10;
  }

  if (
    normalizedRoles.includes(
      "supervisor"
    ) ||
    normalizedRoles.includes(
      "livesupervisor"
    )
  ) {
    return profile.status ===
      20;
  }

  if (
    normalizedRoles.includes(
      "broadcastmanager"
    )
  ) {
    return profile.status ===
      30;
  }

  if (
    normalizedRoles.includes(
      "planmanager"
    )
  ) {
    return profile.status ===
      40;
  }

  /*
   * اگر localStorage قدیمی یا ناقص باشد، کارتابل را
   * اشتباهاً خالی نکن. Backend همچنان دسترسی عملیات را کنترل می‌کند.
   */
  return true;
}


function readCurrentUserRoles(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  for (
    const key of [
      "userInfo",
      "user-info",
      "auth-user",
    ]
  ) {
    try {
      const rawValue =
        window.localStorage.getItem(
          key
        );

      if (!rawValue) {
        continue;
      }

      const value =
        JSON.parse(rawValue) as unknown;

      if (!isRecord(value)) {
        continue;
      }

      const rawRoles =
        value.roles ??
        value.role;

      if (Array.isArray(rawRoles)) {
        return rawRoles.filter(
          (role): role is string =>
            typeof role === "string"
        );
      }

      if (typeof rawRoles === "string") {
        return [rawRoles];
      }
    } catch (error) {
      console.warn(
        `Invalid auth data in localStorage key ${key}:`,
        error
      );
    }
  }

  return [];
}


function normalizeRole(
  value: string
): string {
  return value
    .trim()
    .replace(/[\s_-]/g, "")
    .toLowerCase();
}


function getStatusLabel(
  profile: ProgramProfileResponse
): string {
  return displayText(
    profile.statusDisplayName
  ) !== "—"
    ? displayText(
        profile.statusDisplayName
      )
    : STATUS_LABELS[
        profile.status
      ] ?? profile.status;
}


function countByStatus(
  profiles: ProgramProfileResponse[]
): Record<string, number> {
  return profiles.reduce<
    Record<string, number>
  >(
    (result, profile) => {
      result[profile.status] =
        (result[profile.status] ?? 0) + 1;
      return result;
    },
    {}
  );
}


function uniqueById(
  profiles: ProgramProfileResponse[]
): ProgramProfileResponse[] {
  return Array.from(
    new Map(
      profiles.map(
        (profile) => [
          profile.id,
          profile,
        ]
      )
    ).values()
  );
}


function isProgramProfile(
  value: unknown
): value is ProgramProfileResponse {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.mainTopic === "string" &&
    typeof value.status === "number"
  );
}


function parseJsonResponse(
  text: string
): unknown | null {
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
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

  for (
    const candidate of [
      value.message,
      value.description,
      value.detail,
      value.title,
    ]
  ) {
    if (
      typeof candidate === "string" &&
      candidate.trim()
    ) {
      return candidate.trim();
    }
  }

  return null;
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


function displayText(
  value: unknown
): string {
  return typeof value === "string" &&
    value.trim()
    ? value.trim()
    : "—";
}


function formatPersianDate(
  value: string
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return displayText(value);
  }

  return new Intl.DateTimeFormat(
    "fa-IR",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(date);
}


function toPersianNumber(
  value: number
): string {
  return new Intl.NumberFormat(
    "fa-IR"
  ).format(value);
}
