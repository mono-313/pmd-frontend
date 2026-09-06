"use client";

import { LoaderCircle, Send, Trash2, X } from "lucide-react";

type ConfirmDialogVariant = "delete" | "submit";

interface ForecastConfirmDialogProps {
  open: boolean;
  variant: ConfirmDialogVariant;
  forecastTitle: string;
  error: string;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const dialogContent = {
  delete: {
    title: "حذف پیش‌بینی",
    description:
      "",
    confirmTitle: "بله، حذف شود",
    confirmClass: "bg-red-600 hover:bg-red-700",
  },
  submit: {
    title: "ارسال برای مدیر گروه",
    description:
      "",
    confirmTitle: "بله، ارسال شود",
    confirmClass: "bg-[#007fcf] hover:bg-[#006fb5]",
  },
} as const;

export default function ForecastConfirmDialog({
  open,
  variant,
  forecastTitle,
  error,
  isLoading,
  onCancel,
  onConfirm,
}: ForecastConfirmDialogProps) {
  if (!open) return null;

  const content = dialogContent[variant];
  const Icon = variant === "delete" ? Trash2 : Send;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-4"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forecast-confirm-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                variant === "delete"
                  ? "bg-red-100 text-red-600"
                  : "bg-blue-100 text-[#007fcf]"
              }`}
            >
              <Icon size={21} />
            </div>

            <div>
              <h2 id="forecast-confirm-title" className="font-bold text-gray-900">
                {content.title}
              </h2>
              <p className="mt-2 text-sm leading-7 text-gray-600">
                {content.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
            aria-label="بستن"
          >
            <X size={19} />
          </button>
        </header>

        <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
          موضوع: <strong>{forecastTitle}</strong>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

      
        <footer className="mt-6 grid grid-cols-2 gap-3 border-t pt-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 px-4 py-2.5 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            انصراف
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold text-white disabled:opacity-60 ${content.confirmClass}`}
          >
            {isLoading ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <Icon size={18} />
            )}
            {content.confirmTitle}
          </button>
        </footer>
      </div>
    </div>
  );
}
