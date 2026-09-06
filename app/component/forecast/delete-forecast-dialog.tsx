"use client";

import { AlertTriangle, LoaderCircle, X } from "lucide-react";
import type { ForecastResponse } from "@/app/types/forecast";

interface Props {
  forecast: ForecastResponse | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteForecastDialog({ forecast, isDeleting, onCancel, onConfirm }: Props) {
  if (!forecast) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" dir="rtl">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600"><AlertTriangle size={22} /></div>
            <div>
              <h2 className="font-bold text-gray-900">حذف پیش‌بینی</h2>
              <p className="mt-2 text-sm leading-7 text-gray-600">آیا از حذف «{forecast.mainTopic}» مطمئن هستید؟ اطلاعات مرتبط با این پیش‌بینی حذف خواهد شد.</p>
            </div>
          </div>
          <button type="button" onClick={onCancel} disabled={isDeleting} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><X size={20} /></button>
        </div>

        <div className="mt-7 flex gap-3" dir="ltr">
          <button type="button" onClick={onConfirm} disabled={isDeleting} className="flex min-w-36 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
            {isDeleting && <LoaderCircle size={17} className="animate-spin" />}
            بله، حذف شود
          </button>
          <button type="button" onClick={onCancel} disabled={isDeleting} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">خیر</button>
        </div>
      </div>
    </div>
  );
}
