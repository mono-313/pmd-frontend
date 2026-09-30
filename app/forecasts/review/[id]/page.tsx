"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileText,
  LoaderCircle,
  RotateCcw,
  Users,
  X,
  XCircle,
} from "lucide-react";

type Row = Record<string, unknown>;
type ReviewAction = "approve" | "reject" | "return-for-edit";

interface ViewForecast {
  id: string;
  planId: number | null;
  planName: string;
  networkId: number | null;
  networkGroupId: number | null;
  episodeNumber: number | null;
  broadcastDate: string;
  mainTopic: string;
  hasExpert: boolean;
  status: unknown;
  topicAxes: { id: string; title: string; displayOrder: number }[];
  experts: { id: string; name: string }[];
  createdByUserName: string;
  createdDate: string;
}

export default function ForecastReviewDetailsPage() {
  const params = useParams<{ id: string | string[] }>();
  const router = useRouter();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const forecastId = typeof rawId === "string" ? rawId.trim() : "";
  const [forecast, setForecast] = useState<ViewForecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionDialog, setActionDialog] = useState<ReviewAction | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadForecast() {
      if (!forecastId) {
        setError("شناسه پیش‌بینی معتبر نیست.");
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError("");
        const response = await fetch(
          `/api/forecasts/${encodeURIComponent(forecastId)}`,
          { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" }
        );
        const responseData = parseJson(await response.text());
        if (!response.ok) {
          throw new Error(
            errorMessage(responseData) ??
              `دریافت اطلاعات انجام نشد. کد پاسخ: ${response.status}`
          );
        }
        const raw = extractForecast(responseData);
        if (!raw) throw new Error("اطلاعات پیش‌بینی در پاسخ سرور پیدا نشد.");
        if (!cancelled) setForecast(normalizeForecast(raw, forecastId));
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "دریافت اطلاعات پیش‌بینی انجام نشد."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadForecast();
    return () => {
      cancelled = true;
    };
  }, [forecastId]);

  async function executeReviewAction(action: ReviewAction) {
    if (!forecast) {
      setActionError("اطلاعات پیش‌بینی معتبر نیست.");
      return;
    }
    const normalizedReason = reason.trim();
    if (action !== "approve" && !normalizedReason) {
      setActionError("وارد کردن دلیل رد یا بازگشت الزامی است.");
      return;
    }

    try {
      setIsSubmitting(true);
      setActionError("");
      setActionSuccess("");
      const response = await fetch(
        `/api/forecasts/${encodeURIComponent(forecast.id)}/${action}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            ...(action !== "approve" ? { "Content-Type": "application/json" } : {}),
          },
          body:
            action !== "approve"
              ? JSON.stringify({ reason: normalizedReason })
              : undefined,
        }
      );
      const responseData = parseJson(await response.text());
      if (!response.ok) {
        throw new Error(
          errorMessage(responseData) ??
            `عملیات بررسی انجام نشد. کد پاسخ: ${response.status}`
        );
      }

      setActionSuccess(errorMessage(responseData) ?? successMessage(action));
      setActionDialog(null);
      setReason("");
      window.setTimeout(() => router.replace("/forecasts/review"), 900);
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "عملیات بررسی پیش‌بینی انجام نشد."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function openAction(action: ReviewAction) {
    setActionError("");
    setReason("");
    setActionDialog(action);
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8" dir="rtl">
        <div className="mx-auto flex min-h-72 max-w-6xl items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm">
          <LoaderCircle size={24} className="animate-spin text-[#007fcf]" />
          در حال دریافت اطلاعات پیش‌بینی...
        </div>
      </main>
    );
  }

  if (error || !forecast) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8" dir="rtl">
        <section className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle size={22} className="mt-0.5 shrink-0" />
            <div>
              <h1 className="font-bold">نمایش پیش‌بینی امکان‌پذیر نیست</h1>
              <p className="mt-2 text-sm leading-7">
                {error || "پیش‌بینی موردنظر پیدا نشد."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push("/forecasts/review")}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 font-semibold text-red-700 transition hover:bg-red-100"
          >
            <ArrowRight size={18} />
            بازگشت به کارتابل
          </button>
        </section>
      </main>
    );
  }

  const canReview = isPending(forecast.status);

  return (
    <main className="min-h-screen min-w-0 bg-gray-50 px-4 py-8" dir="rtl">
      <section className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
              <FileText size={25} className="text-[#007fcf]" />
              بررسی پیش‌بینی برنامه
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              مشاهده اطلاعات ثبت‌شده و انجام عملیات بررسی
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/forecasts/review")}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <ArrowRight size={19} />
            بازگشت به کارتابل
          </button>
        </header>

        <DetailsSection title="مشخصات پیش‌بینی" icon={<FileText size={20} />}>
          <SpecificationsGrid
            items={[
              {
                label: "نام برنامه",
                value:
                  forecast.planName ||
                  (forecast.planId !== null
                    ? `برنامه شماره ${fa(forecast.planId)}`
                    : "—"),
              },
              { label: "موضوع اصلی", value: display(forecast.mainTopic) },
              {
                label: "وضعیت",
                value: (
                  <span className={statusBadgeClass(forecast.status)}>
                    {canReview ? "در انتظار بررسی" : statusTitle(forecast.status)}
                  </span>
                ),
              },
              {
                label: "شماره قسمت",
                value:
                  forecast.episodeNumber !== null ? fa(forecast.episodeNumber) : "—",
              },
              { label: "تاریخ پخش", value: jalali(forecast.broadcastDate) },
              { label: "دارای کارشناس", value: forecast.hasExpert ? "بله" : "خیر" },
              {
                label: "شناسه شبکه",
                value: forecast.networkId !== null ? fa(forecast.networkId) : "—",
              },
              {
                label: "شناسه گروه برنامه‌ساز",
                value:
                  forecast.networkGroupId !== null
                    ? fa(forecast.networkGroupId)
                    : "—",
              },
            ]}
          />
        </DetailsSection>

        <DetailsSection title="محورهای موضوعی" icon={<FileText size={20} />}>
          {forecast.topicAxes.length ? (
            <CompactList
              items={[...forecast.topicAxes]
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((axis) => axis.title)}
            />
          ) : (
            <EmptySection text="محور موضوعی برای این پیش‌بینی ثبت نشده است." />
          )}
        </DetailsSection>

        <DetailsSection title="کارشناسان برنامه" icon={<Users size={20} />}>
          {!forecast.hasExpert ? (
            <EmptySection text="این برنامه کارشناس ندارد." />
          ) : forecast.experts.length ? (
            <CompactList items={forecast.experts.map((expert) => expert.name || expert.id)} />
          ) : (
            <EmptySection text="اطلاعات کارشناسان در پاسخ سرویس وجود ندارد." />
          )}
        </DetailsSection>

        <DetailsSection title="اطلاعات ثبت" icon={<FileText size={20} />}>
          <SpecificationsGrid
            items={[
              { label: "ثبت‌کننده", value: display(forecast.createdByUserName) },
              { label: "تاریخ ثبت", value: jalaliDateTime(forecast.createdDate) },
            ]}
          />
        </DetailsSection>

        {actionSuccess && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
            <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
            <p className="text-sm font-semibold leading-6">{actionSuccess}</p>
          </div>
        )}

        {actionError && !actionDialog && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <p className="text-sm font-semibold leading-6">{actionError}</p>
          </div>
        )}

        {canReview ? (
          <section className="mb-6 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-800">عملیات گردش‌کار</h2>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                نتیجه بررسی این پیش‌بینی را ثبت کنید.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton onClick={() => openAction("approve")} disabled={isSubmitting} primary icon={<CheckCircle2 size={18} />}>
                تأیید پیش‌بینی
              </ActionButton>
              <ActionButton onClick={() => openAction("return-for-edit")} disabled={isSubmitting} icon={<RotateCcw size={18} />}>
                بازگشت برای اصلاح
              </ActionButton>
              <ActionButton onClick={() => openAction("reject")} disabled={isSubmitting} danger icon={<XCircle size={18} />}>
                رد پیش‌بینی
              </ActionButton>
            </div>
          </section>
        ) : (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            این پیش‌بینی در وضعیت فعلی قابل بررسی نیست.
          </div>
        )}
      </section>

      {actionDialog && (
        <ReviewActionModal
          action={actionDialog}
          reason={reason}
          error={actionError}
          isSubmitting={isSubmitting}
          onReasonChange={(value) => {
            setReason(value);
            setActionError("");
          }}
          onClose={() => {
            if (isSubmitting) return;
            setActionDialog(null);
            setReason("");
            setActionError("");
          }}
          onConfirm={() => void executeReviewAction(actionDialog)}
        />
      )}
    </main>
  );
}

function ActionButton({
  children,
  icon,
  onClick,
  disabled,
  primary = false,
  danger = false,
}: {
  children: ReactNode;
  icon: ReactNode;
  onClick: () => void;
  disabled: boolean;
  primary?: boolean;
  danger?: boolean;
}) {
  const color = primary
    ? "border-[#007fcf] bg-[#007fcf] text-white hover:bg-[#006fb5]"
    : danger
      ? "border-red-200 bg-white text-red-700 hover:bg-red-50"
      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${color}`}
    >
      {icon}
      {children}
    </button>
  );
}

function ReviewActionModal({
  action,
  reason,
  error,
  isSubmitting,
  onReasonChange,
  onClose,
  onConfirm,
}: {
  action: ReviewAction;
  reason: string;
  error: string;
  isSubmitting: boolean;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const needsReason = action !== "approve";
  const title = actionTitle(action);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 p-4 backdrop-blur-[1px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="forecast-action-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#007fcf]">
              {action === "approve" ? <CheckCircle2 size={21} /> : action === "reject" ? <XCircle size={21} /> : <RotateCcw size={21} />}
            </span>
            <div>
              <h2 id="forecast-action-title" className="font-bold text-gray-900">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                {action === "approve"
                  ? "آیا از تأیید این پیش‌بینی مطمئن هستید؟"
                  : "دلیل این تصمیم را وارد کنید تا همراه عملیات ثبت شود."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="بستن"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </header>
        <div className="px-5 py-4">
          {needsReason && (
            <div>
              <label htmlFor="forecast-action-reason" className="mb-2 block text-sm font-semibold text-gray-700">
                دلیل <span className="text-red-500">*</span>
              </label>
              <textarea
                id="forecast-action-reason"
                autoFocus
                value={reason}
                onChange={(event) => onReasonChange(event.target.value)}
                rows={4}
                disabled={isSubmitting}
                placeholder="دلیل را وارد کنید..."
                className="w-full resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm leading-7 outline-none transition focus:border-[#007fcf] focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />
            </div>
          )}
          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p className="leading-6">{error}</p>
            </div>
          )}
        </div>
        <footer className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50">
            انصراف
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting || (needsReason && !reason.trim())}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#007fcf] px-4 text-sm font-semibold text-white transition hover:bg-[#006fb5] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : action === "approve" ? <CheckCircle2 size={18} /> : action === "reject" ? <XCircle size={18} /> : <RotateCcw size={18} />}
            {isSubmitting ? "در حال ارسال..." : `ثبت ${title}`}
          </button>
        </footer>
      </section>
    </div>
  );
}

function DetailsSection({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <header className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-800">
        <span className="text-[#007fcf]">{icon}</span>
        {title}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function SpecificationsGrid({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="flex min-h-11 items-center gap-2 bg-white px-3 py-2.5">
          <span className="shrink-0 text-xs font-medium text-gray-500">{item.label}:</span>
          <div className="min-w-0 break-words text-sm font-semibold leading-6 text-gray-800">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function CompactList({ items }: { items: string[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      {items.map((item, index) => (
        <div key={`${item}-${index}`} className="flex items-center gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-700 first:border-t-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-[#007fcf]">{fa(index + 1)}</span>
          <span className="font-medium">{item}</span>
        </div>
      ))}
    </div>
  );
}

function EmptySection({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-7 text-center text-sm text-gray-500">{text}</div>;
}

function extractForecast(value: unknown): Row | null {
  if (!record(value)) return null;
  const candidates: unknown[] = [value, value.forecast, value.data, value.result];
  if (record(value.data)) candidates.push(value.data.forecast, value.data.data, value.data.result);
  return candidates.find((item): item is Row => record(item) && typeof item.id === "string") ?? null;
}

function normalizeForecast(v: Row, fallbackId: string): ViewForecast {
  return {
    id: str(v.id) || fallbackId,
    planId: num(v.planId),
    planName: str(v.planName) || str(v.programName),
    networkId: num(v.networkId),
    networkGroupId: num(v.networkGroupId),
    episodeNumber: num(v.episodeNumber),
    broadcastDate: str(v.broadcastDate),
    mainTopic: str(v.mainTopic) || "—",
    hasExpert: bool(v.hasExpert),
    status: v.status,
    topicAxes: axes(v.topicAxes),
    experts: experts(v),
    createdByUserName: str(v.createdByUserName) || str(v.createdByName),
    createdDate: str(v.createdDate) || str(v.createdAt),
  };
}

function axes(value: unknown): ViewForecast["topicAxes"] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (typeof item === "string") return item.trim() ? [{ id: `axis-${index}`, title: item.trim(), displayOrder: index + 1 }] : [];
    if (!record(item)) return [];
    const title = str(item.title) || str(item.name);
    return title ? [{ id: str(item.id) || `axis-${index}`, title, displayOrder: num(item.displayOrder) ?? index + 1 }] : [];
  });
}

function experts(v: Row): ViewForecast["experts"] {
  if (Array.isArray(v.experts)) {
    const rows = v.experts.flatMap((item, index) =>
      record(item)
        ? [{ id: str(item.id) || `expert-${index}`, name: str(item.name) || str(item.fullName) || `${str(item.firstName)} ${str(item.lastName)}`.trim() }]
        : []
    );
    if (rows.length) return rows;
  }
  return Array.isArray(v.expertIds)
    ? v.expertIds.flatMap((id, index) => (typeof id === "string" ? [{ id, name: `کارشناس ${fa(index + 1)}` }] : []))
    : [];
}

function isPending(value: unknown) {
  return value === 2 || value === "2" || value === "PendingReview";
}

function statusTitle(value: unknown) {
  const key = String(value ?? "");
  return ({ "1": "پیش‌نویس", Draft: "پیش‌نویس", "3": "تأییدشده", Approved: "تأییدشده", "4": "ردشده", Rejected: "ردشده", "5": "بازگشت برای اصلاح", ReturnedForEdit: "بازگشت برای اصلاح" } as Record<string, string>)[key] ?? key ?? "نامشخص";
}

function statusBadgeClass(value: unknown) {
  const base = "inline-flex rounded-full px-2.5 py-1 text-xs font-bold";
  const title = statusTitle(value);
  if (title === "تأییدشده") return `${base} bg-green-100 text-green-700`;
  if (title === "ردشده") return `${base} bg-red-100 text-red-700`;
  if (title === "بازگشت برای اصلاح") return `${base} bg-amber-100 text-amber-800`;
  return `${base} bg-blue-100 text-blue-700`;
}

function actionTitle(action: ReviewAction) {
  if (action === "approve") return "تأیید پیش‌بینی";
  if (action === "reject") return "رد پیش‌بینی";
  return "بازگشت برای اصلاح";
}

function successMessage(action: ReviewAction) {
  if (action === "approve") return "پیش‌بینی با موفقیت تأیید شد.";
  if (action === "reject") return "پیش‌بینی با موفقیت رد شد.";
  return "پیش‌بینی با موفقیت برای اصلاح بازگردانده شد.";
}

function jalali(value: string) {
  if (!value) return "—";
  const date = new Date(normalizeDigits(value));
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC" }).format(date);
}

function jalaliDateTime(value: string) {
  if (!value) return "—";
  const date = new Date(normalizeDigits(value));
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}

function fa(value: string | number) {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}

function normalizeDigits(value: string) {
  return value.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function parseJson(text: string): unknown | null {
  try {
    return text.trim() ? (JSON.parse(text) as unknown) : null;
  } catch {
    return null;
  }
}

function errorMessage(value: unknown) {
  if (!record(value)) return null;
  return str(value.message) || str(value.description) || str(value.detail) || (record(value.details) ? str(value.details.detail) || str(value.details.message) : "") || null;
}

function display(value: string) {
  return value.trim() || "—";
}

function str(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function num(value: unknown): number | null {
  const result = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(normalizeDigits(value)) : Number.NaN;
  return Number.isFinite(result) ? result : null;
}

function bool(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function record(value: unknown): value is Row {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
