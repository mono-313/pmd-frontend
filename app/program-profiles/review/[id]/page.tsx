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
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  RefreshCcw,
  RotateCcw,
  Users,
} from "lucide-react";

import type {
  ProgramProfileResponse,
  ProgramProfileStatus,
} from "@/app/types/program-profile";


export default function ProgramProfileReviewDetailsPage() {
  const router = useRouter();
  const params =
    useParams<{
      id: string | string[];
    }>();

  const profileId =
    readRouteId(
      params?.id
    );

  const [profile, setProfile] =
    useState<ProgramProfileResponse | null>(null);
  const [reason, setReason] =
    useState("");
  const [isLoading, setIsLoading] =
    useState(true);
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [error, setError] =
    useState("");


  const loadProfile =
    useCallback(async () => {
      if (!profileId) {
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
              `دریافت شناسنامه انجام نشد. کد پاسخ: ${response.status}`
          );
        }

        const normalizedProfile =
          extractProfile(
            responseData
          );

        if (!normalizedProfile) {
          throw new Error(
            "ساختار پاسخ شناسنامه معتبر نیست."
          );
        }

        console.info(
          "PROGRAM PROFILE REVIEW DETAILS:",
          {
            profileId:
              normalizedProfile.id,
            status:
              normalizedProfile.status,
          }
        );

        setProfile(
          normalizedProfile
        );
      } catch (loadError) {
        setProfile(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "دریافت شناسنامه انجام نشد."
        );
      } finally {
        setIsLoading(false);
      }
    }, [profileId]);


  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);


  async function sendAction(
    action: "approve" | "return"
  ) {
    if (!profile) {
      return;
    }

    if (
      action === "return" &&
      !reason.trim()
    ) {
      setError(
        "وارد کردن دلیل بازگشت الزامی است."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const response =
        await fetch(
          `/api/program-profiles/${encodeURIComponent(
            profile.id
          )}/${action}`,
          {
            method: "POST",
            headers:
              action === "return"
                ? {
                    Accept:
                      "application/json",
                    "Content-Type":
                      "application/json",
                  }
                : {
                    Accept:
                      "application/json",
                  },
            body:
              action === "return"
                ? JSON.stringify({
                    reason:
                      reason.trim(),
                  })
                : undefined,
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
            `عملیات انجام نشد. کد پاسخ: ${response.status}`
        );
      }

      router.push(
        "/program-profiles/review"
      );
      router.refresh();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "عملیات بررسی شناسنامه انجام نشد."
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  if (isLoading) {
    return (
      <PageShell>
        <div className="flex min-h-72 items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white text-gray-600 shadow-sm">
          <LoaderCircle
            size={25}
            className="animate-spin text-[#007fcf]"
          />
          در حال دریافت اطلاعات شناسنامه...
        </div>
      </PageShell>
    );
  }


  if (!profile) {
    return (
      <PageShell>
        <ErrorBox
          message={
            error ||
            "شناسنامه موردنظر دریافت نشد."
          }
          onBack={() =>
            router.push(
              "/program-profiles/review"
            )
          }
          onRetry={() =>
            void loadProfile()
          }
        />
      </PageShell>
    );
  }


  const networkName =
    readStringField(
      profile,
      "networkName"
    );
  const networkGroupName =
    readStringField(
      profile,
      "networkGroupName"
    );
  const canReturn =
    profile.status !==
      "PendingSupervisor" &&
    profile.status !==
      "Approved";
  const isPending =
    profile.status.startsWith(
      "Pending"
    );


  return (
    <PageShell>
      <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/program-profiles/review"
              )
            }
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-700 transition hover:border-[#007fcf] hover:text-[#007fcf]"
            aria-label="بازگشت به کارتابل"
          >
            <ArrowRight size={21} />
          </button>

          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              بررسی شناسنامه برنامه
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              مشاهده اطلاعات کامل و ثبت تصمیم مرحله جاری
            </p>
          </div>
        </div>

        <StatusBadge
          status={profile.status}
          title={getStatusLabel(profile)}
        />
      </header>


      <div className="space-y-5">
        <Section
          title="مشخصات شناسنامه"
          icon={
            <FileText size={20} />
          }
        >
          <div className="grid grid-cols-1 border-t border-r border-gray-200 md:grid-cols-2 xl:grid-cols-3">
            <InfoCell
              label="نام برنامه"
              value={
                displayText(
                  profile.programName
                )
              }
            />
            <InfoCell
              label="موضوع اصلی"
              value={
                displayText(
                  profile.mainTopic
                )
              }
            />
            <InfoCell
              label="نوع برنامه"
              value={
                displayText(
                  profile.programTypeName
                ) !== "—"
                  ? displayText(
                      profile.programTypeName
                    )
                  : getProgramTypeLabel(
                      profile.programType
                    )
              }
            />
            <InfoCell
              label="شبکه"
              value={networkName}
            />
            <InfoCell
              label="گروه برنامه‌ساز"
              value={networkGroupName}
            />
            <InfoCell
              label="تاریخ پخش"
              value={
                formatPersianDate(
                  profile.broadcastDate
                )
              }
            />
            <InfoCell
              label="مدت برنامه"
              value={
                displayText(
                  profile.duration
                )
              }
            />
            <InfoCell
              label="ساعت شروع"
              value={
                displayText(
                  profile.startTime
                )
              }
            />
            <InfoCell
              label="شیوه تولید"
              value={
                displayText(
                  profile.productionMethod
                )
              }
            />
            <InfoCell
              label="مناسبت"
              value={
                displayText(
                  profile.occasion
                )
              }
            />
            <InfoCell
              label="طبقه"
              value={
                displayText(
                  profile.floorName
                )
              }
            />
            <InfoCell
              label="درجه برنامه"
              value={
                displayText(
                  profile.programDegreeName
                )
              }
            />
            <InfoCell
              label="ساختار برنامه"
              value={
                displayText(
                  profile.programStructureName
                )
              }
            />
            <InfoCell
              label="دارای کارشناس"
              value={
                profile.hasExpert
                  ? "بله"
                  : "خیر"
              }
            />
          </div>
        </Section>


        <Section
          title="عوامل برنامه"
          icon={<Users size={20} />}
        >
          <DataTable
            headers={[
              "ردیف",
              "نام عامل",
              "نوع فعالیت",
              "حضور",
            ]}
            emptyMessage="عاملی برای این شناسنامه ثبت نشده است."
            rows={profile.crewMembers.map(
              (member, index) => [
                toPersianNumber(
                  index + 1
                ),
                displayText(
                  member.personnelName
                ),
                displayText(
                  member.activityTypeName
                ),
                member.isPresent
                  ? "حاضر"
                  : "غایب",
              ]
            )}
          />
        </Section>


        <Section
          title="آیتم‌های برنامه"
          icon={<Clock3 size={20} />}
        >
          <DataTable
            headers={[
              "ردیف",
              "عنوان آیتم",
              "نوع تولید",
              "مدت",
            ]}
            emptyMessage="آیتمی برای این شناسنامه ثبت نشده است."
            centerLastColumn
            rows={profile.items.map(
              (item, index) => [
                toPersianNumber(
                  index + 1
                ),
                displayText(
                  item.itemName
                ),
                displayText(
                  item.productionType
                ),
                displayText(
                  item.duration
                ),
              ]
            )}
          />
        </Section>


        <Section
          title="کارشناسان برنامه"
          icon={<Users size={20} />}
        >
          <DataTable
            headers={[
              "ردیف",
              "کارشناس",
              "محور موضوعی",
              "مدت حضور",
              "نحوه حضور",
              "حق‌الزحمه",
            ]}
            emptyMessage="کارشناسی برای این شناسنامه ثبت نشده است."
            rows={profile.experts.map(
              (expert, index) => [
                toPersianNumber(
                  index + 1
                ),
                readExpertName(
                  expert
                ),
                readStringField(
                  expert,
                  "topicAxisTitle"
                ),
                displayText(
                  expert.duration
                ),
                getAttendanceLabel(
                  expert.attendanceType
                ),
                expert.hasPayment
                  ? "دارد"
                  : "ندارد",
              ]
            )}
          />
        </Section>


        <Section
          title="اطلاعات ثبت"
          icon={<Clock3 size={20} />}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetaBox
              label="ثبت‌کننده"
              value={
                displayText(
                  profile.createdByUserName
                )
              }
            />
            <MetaBox
              label="تاریخ ثبت"
              value={
                formatPersianDateTime(
                  profile.createdDate
                )
              }
            />
            <MetaBox
              label="آخرین تغییر"
              value={
                profile.lastModifiedDate
                  ? formatPersianDateTime(
                      profile.lastModifiedDate
                    )
                  : "—"
              }
            />
          </div>
        </Section>


        {isPending && (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-gray-900">
              تصمیم مدیر
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              برای بازگشت شناسنامه، نوشتن دلیل الزامی است.
            </p>

            {canReturn && (
              <textarea
                value={reason}
                onChange={(event) =>
                  setReason(
                    event.target.value
                  )
                }
                rows={4}
                disabled={isSubmitting}
                placeholder="دلیل بازگشت شناسنامه را وارد کنید..."
                className="mt-4 w-full rounded-xl border border-gray-300 p-3 text-sm leading-7 outline-none transition focus:border-[#007fcf] focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
              />
            )}

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle
                  size={19}
                  className="mt-0.5 shrink-0"
                />
                {error}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() =>
                  void sendAction(
                    "approve"
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <LoaderCircle
                    size={19}
                    className="animate-spin"
                  />
                ) : (
                  <CheckCircle2 size={19} />
                )}
                تأیید و ارسال به مرحله بعد
              </button>

              {canReturn && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() =>
                    void sendAction(
                      "return"
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw size={19} />
                  بازگشت شناسنامه
                </button>
              )}

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() =>
                  void loadProfile()
                }
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCcw size={18} />
                بارگذاری مجدد
              </button>
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}


function PageShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main
      className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6"
      dir="rtl"
    >
      <div className="mx-auto max-w-7xl">
        {children}
      </div>
    </main>
  );
}


function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-4 text-gray-900">
        <span className="text-[#007fcf]">
          {icon}
        </span>
        <h2 className="font-bold">
          {title}
        </h2>
      </div>
      <div className="p-5">
        {children}
      </div>
    </section>
  );
}


function InfoCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-h-24 border-b border-l border-gray-200 p-4">
      <p className="text-xs font-semibold text-gray-500">
        {label}
      </p>
      <p className="mt-2 break-words font-bold leading-7 text-gray-800">
        {value}
      </p>
    </div>
  );
}


function MetaBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-semibold text-gray-500">
        {label}
      </p>
      <p className="mt-2 font-bold text-gray-800">
        {value}
      </p>
    </div>
  );
}


function DataTable({
  headers,
  rows,
  emptyMessage,
  centerLastColumn = false,
}: {
  headers: string[];
  rows: string[][];
  emptyMessage: string;
  centerLastColumn?: boolean;
}) {
  if (!rows.length) {
    return (
      <p className="py-7 text-center text-sm text-gray-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            {headers.map(
              (header, index) => (
                <th
                  key={header}
                  className={`px-4 py-3 font-bold ${
                    centerLastColumn &&
                    index ===
                      headers.length - 1
                      ? "text-center"
                      : "text-right"
                  }`}
                >
                  {header}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map(
            (row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-blue-50/40"
              >
                {row.map(
                  (cell, cellIndex) => (
                    <td
                      key={`${rowIndex}-${cellIndex}`}
                      className={`px-4 py-3 text-gray-700 ${
                        centerLastColumn &&
                        cellIndex ===
                          row.length - 1
                          ? "text-center"
                          : "text-right"
                      }`}
                    >
                      {cell}
                    </td>
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


function StatusBadge({
  status,
  title,
}: {
  status: ProgramProfileStatus;
  title: string;
}) {
  const className =
    status === "Approved"
      ? "bg-green-100 text-green-700"
      : status === "ReturnedForEdit"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-800";

  return (
    <span
      className={`inline-flex w-fit rounded-full px-4 py-2 text-xs font-bold ${className}`}
    >
      {title}
    </span>
  );
}


function ErrorBox({
  message,
  onBack,
  onRetry,
}: {
  message: string;
  onBack: () => void;
  onRetry: () => void;
}) {
  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
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
            {message}
          </p>
        </div>
      </div>
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-red-300 bg-white px-4 py-2 font-semibold"
        >
          بازگشت
        </button>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white"
        >
          تلاش مجدد
        </button>
      </div>
    </section>
  );
}


const STATUS_LABELS:
  Record<ProgramProfileStatus, string> = {
  Draft: "پیش‌نویس",
  PendingGroupManager: "در انتظار مدیر گروه",
  PendingSupervisor: "در انتظار ناظر",
  PendingBroadcastManager: "در انتظار مدیر پخش",
  PendingPlanningManager: "در انتظار مدیر طرح و برنامه",
  Approved: "تأیید نهایی",
  ReturnedForEdit: "بازگشت برای اصلاح",
};


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


function extractProfile(
  value: unknown
): ProgramProfileResponse | null {
  if (isProgramProfile(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return null;
  }

  for (
    const candidate of [
      value.profile,
      value.data,
      value.result,
    ]
  ) {
    if (isProgramProfile(candidate)) {
      return candidate;
    }

    if (isRecord(candidate)) {
      const nested =
        extractProfile(candidate);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}


function isProgramProfile(
  value: unknown
): value is ProgramProfileResponse {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.mainTopic === "string" &&
    typeof value.status === "string" &&
    Array.isArray(
      value.crewMembers
    ) &&
    Array.isArray(value.items) &&
    Array.isArray(value.experts)
  );
}


function readRouteId(
  value: string | string[] | undefined
): string {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}


function readStringField(
  value: unknown,
  key: string
): string {
  if (!isRecord(value)) {
    return "—";
  }

  return displayText(
    value[key]
  );
}


function readExpertName(
  value: unknown
): string {
  if (!isRecord(value)) {
    return "—";
  }

  const directName =
    displayText(
      value.expertName
    );

  if (directName !== "—") {
    return directName;
  }

  const fullName = [
    displayText(
      value.firstName
    ),
    displayText(
      value.lastName
    ),
  ]
    .filter(
      (part) => part !== "—"
    )
    .join(" ");

  return fullName || "—";
}


function getProgramTypeLabel(
  value: unknown
): string {
  if (value === 10) {
    return "زنده";
  }

  if (value === 20) {
    return "ضبطی یا تولیدی";
  }

  return "—";
}


function getAttendanceLabel(
  value: unknown
): string {
  const normalized =
    typeof value === "string"
      ? Number(value)
      : value;

  switch (normalized) {
    case 1:
      return "حضوری";
    case 2:
      return "تلفنی";
    case 3:
      return "تولیدی (ضبط‌شده)";
    case 4:
      return "محل کار";
    default:
      return displayText(value);
  }
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
  return formatDate(
    value,
    false
  );
}


function formatPersianDateTime(
  value: string
): string {
  return formatDate(
    value,
    true
  );
}


function formatDate(
  value: string,
  includeTime: boolean
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
      ...(includeTime
        ? {
            hour: "2-digit" as const,
            minute: "2-digit" as const,
          }
        : {}),
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
