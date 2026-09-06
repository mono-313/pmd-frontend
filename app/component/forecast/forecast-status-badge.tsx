import type {
  ForecastStatus,
} from "@/app/types/forecast";


interface ForecastStatusBadgeProps {
  /*
   * در زمان اجرا ممکن است Backend
   * مقدار عددی یا مقدار ناشناخته برگرداند.
   */
  status:
    | ForecastStatus
    | string
    | number
    | null
    | undefined;
}


interface StatusConfig {
  title: string;

  className: string;
}


const statusConfig:
  Record<
    ForecastStatus,
    StatusConfig
  > = {
  Draft: {
    title:
      "پیش‌نویس",

    className:
      "bg-gray-100 text-gray-700",
  },

  PendingReview: {
    title:
      "در انتظار بررسی",

    className:
      "bg-amber-100 text-amber-700",
  },

  Approved: {
    title:
      "تأیید شده",

    className:
      "bg-green-100 text-green-700",
  },

  Rejected: {
    title:
      "رد شده",

    className:
      "bg-red-100 text-red-700",
  },

  ReturnedForEdit: {
    title:
      "برگشت برای اصلاح",

    className:
      "bg-orange-100 text-orange-700",
  },
};


/*
 * تنظیمات مقدار ناشناخته
 *
 * جلوگیری از خطای:
 * Cannot read properties of undefined
 */
const unknownStatusConfig:
  StatusConfig = {
  title:
    "نامشخص",

  className:
    "bg-slate-100 text-slate-600",
};


export default function ForecastStatusBadge({
  status,
}: ForecastStatusBadgeProps) {
  /*
   * تبدیل مقدار عددی یا متنی Backend
   * به ForecastStatus استاندارد
   */
  const normalizedStatus =
    normalizeForecastStatus(
      status
    );


  /*
   * اگر وضعیت معتبر نبود،
   * از حالت پیش‌فرض استفاده می‌شود.
   */
  const config =
    normalizedStatus
      ? statusConfig[
          normalizedStatus
        ]
      : unknownStatusConfig;


  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        px-3 py-1
        text-xs font-bold
        ${config.className}
      `}
      title={
        status === null ||
        status === undefined
          ? "وضعیت ارسال نشده است"
          : `مقدار Backend: ${String(
              status
            )}`
      }
    >
      {config.title}
    </span>
  );
}


/*
 * پشتیبانی از:
 *
 * 1 تا 5
 * Draft
 * PendingReview
 * Approved
 * Rejected
 * ReturnedForEdit
 *
 * و حالت‌های متفاوت حروف کوچک و بزرگ
 */
function normalizeForecastStatus(
  status:
    | ForecastStatus
    | string
    | number
    | null
    | undefined
): ForecastStatus | null {
  /*
   * پشتیبانی از Enum عددی
   */
  if (
    status === 1 ||
    status === "1"
  ) {
    return "Draft";
  }

  if (
    status === 2 ||
    status === "2"
  ) {
    return "PendingReview";
  }

  if (
    status === 3 ||
    status === "3"
  ) {
    return "Approved";
  }

  if (
    status === 4 ||
    status === "4"
  ) {
    return "Rejected";
  }

  if (
    status === 5 ||
    status === "5"
  ) {
    return "ReturnedForEdit";
  }


  if (typeof status !== "string") {
    return null;
  }


  /*
   * حذف فاصله و یکسان‌سازی حروف
   */
  const normalized =
    status
      .trim()
      .toLowerCase()
      .replace(
        /[\s_-]/g,
        ""
      );


  switch (normalized) {
    case "draft":
      return "Draft";

    case "pendingreview":
    case "pending":
      return "PendingReview";

    case "approved":
    case "approve":
      return "Approved";

    case "rejected":
    case "reject":
      return "Rejected";

    case "returnedforedit":
    case "returnforedit":
    case "returned":
      return "ReturnedForEdit";

    default:
      /*
       * مقدار ناشناخته باعث Crash نمی‌شود.
       */
      console.warn(
        "Unknown forecast status:",
        status
      );

      return null;
  }
}