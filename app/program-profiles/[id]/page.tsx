"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  AlertCircle,
  ArrowRight,
  Clock3,
  FileText,
  LoaderCircle,
  RefreshCcw,
  Users,
} from "lucide-react";

import type {
  ProgramProfileResponse,
  ProgramProfileStatus,
} from "@/app/types/program-profile";


export default function ProgramProfileDetailsPage() {
  const router =
    useRouter();

  const params =
    useParams<{
      id: string | string[];
    }>();

  const profileId =
    readRouteId(
      params?.id
    );

  const [
    profile,
    setProfile,
  ] = useState<
    ProgramProfileResponse | null
  >(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  const loadProfile =
    useCallback(async () => {
      if (!profileId) {
        setProfile(null);
        setError(
          "شناسه شناسنامه معتبر نیست."
        );
        setIsLoading(false);

        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const response =
          await fetch(
            `/api/program-profiles/${encodeURIComponent(
              profileId
            )}`,
            {
              method: "GET",

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
            getApiErrorMessage(
              responseData
            ) ??
              getStatusErrorMessage(
                response.status
              )
          );
        }

        const normalizedProfile =
          extractProgramProfile(
            responseData
          );

        if (!normalizedProfile) {
          console.error(
            "Invalid program profile response:",
            {
              responseData,
              responseText,
            }
          );

          throw new Error(
            "ساختار اطلاعات شناسنامه معتبر نیست."
          );
        }

        setProfile(
          normalizedProfile
        );
      } catch (loadError) {
        setProfile(null);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "دریافت اطلاعات شناسنامه انجام نشد."
        );
      } finally {
        setIsLoading(false);
      }
    }, [profileId]);


  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);


  if (isLoading) {
    return (
      <main
        className="min-h-screen bg-gray-50 px-4 py-8"
        dir="rtl"
      >
        <div
          className="mx-auto flex min-h-72 max-w-6xl items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white text-gray-600 shadow-sm"
        >
          <LoaderCircle
            size={25}
            className="animate-spin text-[#007fcf]"
          />

          در حال دریافت اطلاعات شناسنامه...
        </div>
      </main>
    );
  }


  if (error || !profile) {
    return (
      <main
        className="min-h-screen bg-gray-50 px-4 py-8"
        dir="rtl"
      >
        <section
          className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={23}
              className="mt-0.5 shrink-0"
            />

            <div>
              <h1 className="font-bold">
                نمایش شناسنامه امکان‌پذیر نیست
              </h1>

              <p className="mt-2 text-sm leading-7">
                {error ||
                  "اطلاعات شناسنامه دریافت نشد."}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                router.back()
              }
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 font-semibold text-red-700 transition hover:bg-red-100"
            >
              <ArrowRight size={18} />

              بازگشت
            </button>

            <button
              type="button"
              onClick={() =>
                void loadProfile()
              }
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700"
            >
              <RefreshCcw size={18} />

              تلاش مجدد
            </button>
          </div>
        </section>
      </main>
    );
  }


  return (
    <main
      className="min-h-screen min-w-0 bg-gray-50 px-4 py-8"
      dir="rtl"
    >
      <section className="mx-auto w-full max-w-6xl">
        <header
          className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
                <FileText
                  size={25}
                  className="text-[#007fcf]"
                />

                مشاهده شناسنامه برنامه
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                اطلاعات ثبت‌شده شناسنامه به‌صورت فقط‌خواندنی
              </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <ArrowRight size={19} />

            بازگشت به فهرست
          </button>
        </header>


        <DetailsSection
          title="مشخصات شناسنامه"
          icon={
            <FileText size={20} />
          }
        >
          <SpecificationsTable
            items={[
              {
                label: "نام برنامه",
                value: getProgramName(
                  profile
                ),
              },
              {
                label: "موضوع اصلی",
                value: displayText(
                  profile.mainTopic
                ),
              },
              {
                label: "وضعیت",
                value: (
                  <span
                    className={getStatusBadgeClass(
                      profile.status
                    )}
                  >
                    {getProfileStatusTitle(
                      profile
                    )}
                  </span>
                ),
              },
              {
                label: "شبکه",
                value: getNetworkName(
                  profile
                ),
              },
              {
                label: "گروه شبکه",
                value: getNetworkGroupName(
                  profile
                ),
              },
              {
                label: "نوع برنامه",
                value:
                  displayText(
                    profile.programTypeName
                  ) !== "—"
                    ? displayText(
                        profile.programTypeName
                      )
                    : getProgramTypeTitle(
                        profile.programType
                      ),
              },
              {
                label: "نحوه تولید",
                value: displayText(
                  profile.productionMethod
                ),
              },
              {
                label: "مناسبت",
                value: displayText(
                  profile.occasion
                ),
              },
              {
                label: "طبقه برنامه",
                value: displayText(
                  profile.floorName
                ),
              },
              {
                label: "درجه برنامه",
                value: displayText(
                  profile.programDegreeName
                ),
              },
              {
                label: "ساختار برنامه",
                value: displayText(
                  profile.programStructureName
                ),
              },
              {
                label: "دارای کارشناس",
                value:
                  profile.hasExpert
                    ? "بله"
                    : "خیر",
              },
              {
                label: "تاریخ پخش",
                value: formatPersianDate(
                  profile.broadcastDate
                ),
              },
              {
                label: "ساعت شروع",
                value: formatTime(
                  profile.startTime
                ),
                ltr: true,
              },
              {
                label: "مدت برنامه",
                value: formatTime(
                  profile.duration
                ),
                ltr: true,
              },
            ]}
          />
        </DetailsSection>


        <DetailsSection
          title="عوامل برنامه"
          icon={
            <Users size={20} />
          }
        >
          {Array.isArray(
            profile.crewMembers
          ) &&
          profile.crewMembers.length > 0 ? (
            <ResponsiveTable
              headers={[
                "ردیف",
                "نام عامل",
                "نوع فعالیت",
                "وضعیت حضور",
              ]}
            >
              {profile.crewMembers.map(
                (member, index) => (
                  <tr
                    key={
                      member.id ||
                      `${member.personnelId}-${index}`
                    }
                    className="border-t border-gray-200"
                  >
                    <TableCell>
                      {toPersianNumber(
                        index + 1
                      )}
                    </TableCell>

                    <TableCell>
                      {displayText(
                        member.personnelName
                      )}
                    </TableCell>

                    <TableCell>
                      {displayText(
                        member.activityTypeName
                      )}
                    </TableCell>

                    <TableCell>
                      {member.isPresent
                        ? "حاضر"
                        : "غایب"}
                    </TableCell>
                  </tr>
                )
              )}
            </ResponsiveTable>
          ) : (
            <EmptySection text="عاملی برای این شناسنامه ثبت نشده است." />
          )}
        </DetailsSection>


        <DetailsSection
          title="آیتم‌های برنامه"
          icon={
            <Clock3 size={20} />
          }
        >
          {Array.isArray(
            profile.items
          ) &&
          profile.items.length > 0 ? (
            <ResponsiveTable
              headers={[
                "ردیف",
                "عنوان آیتم",
                "نوع تولید",
                "مدت",
              ]}
            >
              {profile.items.map(
                (item, index) => (
                  <tr
                    key={
                      item.id ||
                      `${item.itemName}-${index}`
                    }
                    className="border-t border-gray-200"
                  >
                    <TableCell>
                      {toPersianNumber(
                        index + 1
                      )}
                    </TableCell>

                    <TableCell>
                      {displayText(
                        item.itemName
                      )}
                    </TableCell>

                    <TableCell>
                      {displayText(
                        item.productionType
                      )}
                    </TableCell>

                    <TableCell
                      ltr
                      align="center"
                    >
                      {formatTime(
                        item.duration
                      )}
                    </TableCell>
                  </tr>
                )
              )}
            </ResponsiveTable>
          ) : (
            <EmptySection text="آیتمی برای این شناسنامه ثبت نشده است." />
          )}
        </DetailsSection>


        <DetailsSection
          title="کارشناسان برنامه"
          icon={
            <Users size={20} />
          }
        >
          {Array.isArray(
            profile.experts
          ) &&
          profile.experts.length > 0 ? (
            <ResponsiveTable
              headers={[
                "ردیف",
                "شناسه کارشناس",
                "محور موضوعی",
                "مدت حضور",
                "نحوه حضور",
                "پرداخت",
              ]}
            >
              {profile.experts.map(
                (expert, index) => (
                  <tr
                    key={
                      expert.id ||
                      `${expert.expertId}-${index}`
                    }
                    className="border-t border-gray-200"
                  >
                    <TableCell>
                      {toPersianNumber(
                        index + 1
                      )}
                    </TableCell>

                    <TableCell ltr>
                      {displayText(
                        expert.expertId
                      )}
                    </TableCell>

                    <TableCell ltr>
                      {displayText(
                        expert.topicAxisId
                      )}
                    </TableCell>

                    <TableCell ltr>
                      {formatTime(
                        expert.duration
                      )}
                    </TableCell>

                    <TableCell>
                      {getAttendanceTitle(
                        expert.attendanceType
                      )}
                    </TableCell>

                    <TableCell>
                      {expert.hasPayment
                        ? "دارد"
                        : "ندارد"}
                    </TableCell>
                  </tr>
                )
              )}
            </ResponsiveTable>
          ) : (
            <EmptySection text="کارشناسی برای این شناسنامه ثبت نشده است." />
          )}
        </DetailsSection>


        <DetailsSection
          title="اطلاعات ثبت"
          icon={
            <FileText size={20} />
          }
        >
          <div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <DetailItem
              label="ثبت‌کننده"
              value={displayText(
                profile.createdByUserName
              )}
            />

            <DetailItem
              label="تاریخ ثبت"
              value={formatPersianDateTime(
                profile.createdDate
              )}
            />

            <DetailItem
              label="آخرین تغییر"
              value={formatPersianDateTime(
                profile.lastModifiedDate
              )}
            />
          </div>
        </DetailsSection>
      </section>
    </main>
  );
}


interface DetailsSectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}


function DetailsSection({
  title,
  icon,
  children,
}: DetailsSectionProps) {
  return (
    <section
      className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
    >
      <header
        className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-5 py-4 font-bold text-gray-800"
      >
        <span className="text-[#007fcf]">
          {icon}
        </span>

        {title}
      </header>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
}


interface SpecificationItem {
  label: string;
  value: ReactNode;
  ltr?: boolean;
}


function SpecificationsTable({
  items,
}: {
  items: SpecificationItem[];
}) {
  const rows:
    SpecificationItem[][] = [];

  for (
    let index = 0;
    index < items.length;
    index += 3
  ) {
    rows.push(
      items.slice(
        index,
        index + 3
      )
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[840px] table-fixed border-collapse">
        <tbody>
          {rows.map(
            (row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-t border-gray-200 first:border-t-0"
              >
                {row.map(
                  (item) => (
                    <td
                      key={item.label}
                      className="w-1/3 border-l border-gray-200 px-5 py-4 align-top last:border-l-0"
                    >
                      <p className="text-xs font-semibold text-gray-500">
                        {item.label}
                      </p>

                      <div
                        className="mt-2 break-words text-sm font-semibold leading-7 text-gray-800"
                        dir={
                          item.ltr
                            ? "ltr"
                            : "rtl"
                        }
                      >
                        {item.value}
                      </div>
                    </td>
                  )
                )}

                {Array.from({
                  length:
                    3 - row.length,
                }).map(
                  (_, emptyIndex) => (
                    <td
                      key={`empty-${emptyIndex}`}
                      className="w-1/3 border-l border-gray-200 px-5 py-4 last:border-l-0"
                    />
                  )
                )}
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}


interface DetailItemProps {
  label: string;
  value: string;
  ltr?: boolean;
}


function DetailItem({
  label,
  value,
  ltr = false,
}: DetailItemProps) {
  return (
    <div
      className="rounded-xl border border-gray-100 bg-gray-50 p-4"
    >
      <p className="text-xs font-medium text-gray-500">
        {label}
      </p>

      <p
        className="mt-2 break-words text-sm font-semibold leading-7 text-gray-800"
        dir={ltr ? "ltr" : "rtl"}
      >
        {value}
      </p>
    </div>
  );
}


interface ResponsiveTableProps {
  headers: string[];
  children: ReactNode;
}


function ResponsiveTable({
  headers,
  children,
}: ResponsiveTableProps) {
  return (
    <div
      className="w-full overflow-x-auto rounded-xl border border-gray-200"
    >
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 text-right text-gray-600">
            {headers.map(
              (header) => (
                <th
                  key={header}
                  className="whitespace-nowrap px-4 py-3 font-semibold"
                >
                  {header}
                </th>
              )
            )}
          </tr>
        </thead>

        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );
}


interface TableCellProps {
  children: ReactNode;
  ltr?: boolean;
  align?:
    | "right"
    | "center";
}


function TableCell({
  children,
  ltr = false,
  align = "right",
}: TableCellProps) {
  return (
    <td
      className={`whitespace-nowrap px-4 py-3 text-gray-700 ${
        align === "center"
          ? "text-center"
          : "text-right"
      }`}
      dir={ltr ? "ltr" : "rtl"}
    >
      {children}
    </td>
  );
}


function EmptySection({
  text,
}: {
  text: string;
}) {
  return (
    <div
      className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500"
    >
      {text}
    </div>
  );
}


function readRouteId(
  value: string | string[] | undefined
): string {
  const rawValue =
    Array.isArray(value)
      ? value[0]
      : value;

  if (
    typeof rawValue !== "string"
  ) {
    return "";
  }

  try {
    return decodeURIComponent(
      rawValue
    ).trim();
  } catch {
    return rawValue.trim();
  }
}


function extractProgramProfile(
  value: unknown
): ProgramProfileResponse | null {
  if (
    isProgramProfileResponse(
      value
    )
  ) {
    return value;
  }

  if (!isRecord(value)) {
    return null;
  }

  const candidates = [
    value.profile,
    value.data,
    value.result,
  ];

  for (
    const candidate of
    candidates
  ) {
    if (
      isProgramProfileResponse(
        candidate
      )
    ) {
      return candidate;
    }

    if (isRecord(candidate)) {
      const nestedCandidates = [
        candidate.profile,
        candidate.data,
        candidate.result,
      ];

      for (
        const nestedCandidate of
        nestedCandidates
      ) {
        if (
          isProgramProfileResponse(
            nestedCandidate
          )
        ) {
          return nestedCandidate;
        }
      }
    }
  }

  return null;
}


function isProgramProfileResponse(
  value: unknown
): value is ProgramProfileResponse {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.forecastId === "string" &&
    typeof value.mainTopic === "string"
  );
}


/*
 * طبق مستند ProfileResponse شناسه شبکه و گروه
 * قطعی است؛ با این حال برخی نسخه‌های Backend
 * عنوان نمایشی را نیز در یکی از کلیدهای زیر
 * برمی‌گردانند. در این صفحه فقط عنوان نمایش
 * داده می‌شود و شناسه به‌عنوان جایگزین استفاده
 * نخواهد شد.
 */
function getNetworkName(
  profile: ProgramProfileResponse
): string {
  const source =
    profile as unknown;

  if (!isRecord(source)) {
    return "—";
  }

  return (
    readNonEmptyString(
      source.networkName
    ) ??
    readNonEmptyString(
      source.networkTitle
    ) ??
    readNestedDisplayName(
      source.network
    ) ??
    "—"
  );
}


function getNetworkGroupName(
  profile: ProgramProfileResponse
): string {
  const source =
    profile as unknown;

  if (!isRecord(source)) {
    return "—";
  }

  return (
    readNonEmptyString(
      source.networkGroupName
    ) ??
    readNonEmptyString(
      source.networkGroupTitle
    ) ??
    readNonEmptyString(
      source.groupName
    ) ??
    readNestedDisplayName(
      source.networkGroup
    ) ??
    "—"
  );
}


function readNestedDisplayName(
  value: unknown
): string | null {
  if (!isRecord(value)) {
    return null;
  }

  return (
    readNonEmptyString(
      value.name
    ) ??
    readNonEmptyString(
      value.title
    ) ??
    readNonEmptyString(
      value.text
    )
  );
}


function getProgramName(
  profile: ProgramProfileResponse
): string {
  const programName =
    displayText(
      profile.programName
    );

  if (programName !== "—") {
    return programName;
  }

  return `برنامه شماره ${toPersianNumber(
    profile.planId
  )}`;
}


const STATUS_TITLES:
  Record<ProgramProfileStatus, string> = {
  Draft:
    "پیش‌نویس",

  PendingGroupManager:
    "در انتظار مدیر گروه",

  PendingSupervisor:
    "در انتظار ناظر",

  PendingBroadcastManager:
    "در انتظار مدیر پخش",

  PendingPlanningManager:
    "در انتظار مدیر طرح و برنامه",

  Approved:
    "تأیید نهایی",

  ReturnedForEdit:
    "بازگشت برای اصلاح",
};


function getProfileStatusTitle(
  profile: ProgramProfileResponse
): string {
  const backendTitle =
    displayText(
      profile.statusDisplayName
    );

  if (backendTitle !== "—") {
    return backendTitle;
  }

  return (
    STATUS_TITLES[
      profile.status
    ] ||
    displayText(
      profile.status
    )
  );
}


function getStatusBadgeClass(
  status: ProgramProfileStatus
): string {
  const base =
    "inline-flex shrink-0 rounded-full px-3 py-1.5 text-xs font-bold";

  switch (status) {
    case "Approved":
      return `${base} bg-green-100 text-green-700`;

    case "ReturnedForEdit":
      return `${base} bg-red-100 text-red-700`;

    case "Draft":
      return `${base} bg-gray-100 text-gray-700`;

    case "PendingGroupManager":
    case "PendingSupervisor":
    case "PendingBroadcastManager":
    case "PendingPlanningManager":
      return `${base} bg-amber-100 text-amber-800`;

    default:
      return `${base} bg-gray-100 text-gray-700`;
  }
}


function getProgramTypeTitle(
  value: unknown
): string {
  if (value === 10) {
    return "زنده";
  }

  if (value === 20) {
    return "ضبطی یا تولیدی";
  }

  return displayValue(value);
}


function getAttendanceTitle(
  value: unknown
): string {
  const normalizedValue =
    typeof value === "string" &&
    value.trim()
      ? Number(value)
      : value;

  switch (normalizedValue) {
    case 1:
      return "حضوری";

    case 2:
      return "تلفنی";

    case 3:
      return "تولیدی (ضبط‌شده)";

    case 4:
      return "محل کار";

    default:
      return displayValue(value);
  }
}


function formatPersianDate(
  value: unknown
): string {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return "—";
  }

  const date =
    new Date(
      normalizeDigits(
        value
      )
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
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(date);
}


function formatPersianDateTime(
  value: unknown
): string {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return "—";
  }

  const date =
    new Date(
      normalizeDigits(
        value
      )
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
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}


function formatTime(
  value: unknown
): string {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return "—";
  }

  return value.trim();
}


function displayText(
  value: unknown
): string {
  return (
    typeof value === "string" &&
    value.trim()
  )
    ? value.trim()
    : "—";
}


function displayValue(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  if (
    typeof value === "number"
  ) {
    return toPersianNumber(
      value
    );
  }

  return String(value);
}


function toPersianNumber(
  value: string | number
): string {
  return new Intl.NumberFormat(
    "fa-IR",
    {
      useGrouping: false,
    }
  ).format(
    typeof value === "number"
      ? value
      : Number(value)
  );
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


function getApiErrorMessage(
  value: unknown
): string | null {
  if (!isRecord(value)) {
    return null;
  }

  const directMessage =
    readNonEmptyString(
      value.message
    ) ??
    readNonEmptyString(
      value.description
    ) ??
    readNonEmptyString(
      value.detail
    ) ??
    readNonEmptyString(
      value.title
    );

  if (directMessage) {
    return directMessage;
  }

  if (
    typeof value.errors === "string" &&
    value.errors.trim()
  ) {
    return value.errors.trim();
  }

  if (isRecord(value.errors)) {
    for (
      const errorValue of
      Object.values(
        value.errors
      )
    ) {
      if (
        typeof errorValue === "string" &&
        errorValue.trim()
      ) {
        return errorValue.trim();
      }

      if (Array.isArray(errorValue)) {
        const firstMessage =
          errorValue.find(
            (item) =>
              typeof item === "string" &&
              item.trim()
          );

        if (
          typeof firstMessage === "string"
        ) {
          return firstMessage.trim();
        }
      }
    }
  }

  return null;
}


function getStatusErrorMessage(
  status: number
): string {
  if (status === 401) {
    return "نشست کاربری معتبر نیست. لطفاً دوباره وارد سامانه شوید.";
  }

  if (status === 403) {
    return "شما مجوز مشاهده این شناسنامه را ندارید.";
  }

  if (status === 404) {
    return "شناسنامه موردنظر پیدا نشد.";
  }

  return `دریافت اطلاعات شناسنامه انجام نشد. کد پاسخ: ${status}`;
}


function readNonEmptyString(
  value: unknown
): string | null {
  return (
    typeof value === "string" &&
    value.trim()
  )
    ? value.trim()
    : null;
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
