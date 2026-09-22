import {
  CircleAlert,
  RotateCcw,
  XCircle,
} from "lucide-react";

import type {
  ForecastStatus,
} from "@/app/types/forecast";


interface ForecastReviewFeedbackProps {
  status:
    ForecastStatus;

  reason?:
    string | null;
}


export default function ForecastReviewFeedback({
  status,
  reason,
}: ForecastReviewFeedbackProps) {
  const normalizedReason =
    reason?.trim() ?? "";

  /*
   * فقط برای وضعیت ردشده یا
   * بازگشت برای اصلاح نمایش داده می‌شود.
   */
  if (
    status !== "Rejected" &&
    status !== "ReturnedForEdit"
  ) {
    return null;
  }


  const isRejected =
    status === "Rejected";


  return (
    <section
      className={`
        mt-5
        rounded-xl
        border
        p-4
        ${
          isRejected
            ? `
                border-red-200
                bg-red-50
                text-red-800
              `
            : `
                border-amber-200
                bg-amber-50
                text-amber-800
              `
        }
      `}
      dir="rtl"
    >
      <div
        className="
          flex
          items-start
          gap-3
        "
      >
        <div
          className={`
            mt-0.5
            flex h-9 w-9
            shrink-0
            items-center
            justify-center
            rounded-full
            ${
              isRejected
                ? "bg-red-100"
                : "bg-amber-100"
            }
          `}
        >
          {isRejected ? (
            <XCircle
              size={20}
            />
          ) : (
            <RotateCcw
              size={20}
            />
          )}
        </div>

        <div className="min-w-0">
          <h3 className="font-bold">
            {isRejected
              ? "دلیل رد پیش‌بینی"
              : "توضیحات بازگشت برای اصلاح"}
          </h3>

          {normalizedReason ? (
            <p
              className="
                mt-2
                whitespace-pre-wrap
                break-words
                text-sm
                leading-7
              "
            >
              {normalizedReason}
            </p>
          ) : (
            <div
              className="
                mt-2
                flex
                items-center
                gap-2
                text-sm
              "
            >
              <CircleAlert
                size={16}
              />

              توضیحی از طرف مدیر ثبت نشده است.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}