"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";
import { Import } from "lucide-react";



interface ReviewActionsProps {
  forecastId: string;
}

export default function ReviewActions({
  forecastId,
}: ReviewActionsProps) {
  const router =
    useRouter();

  const [
    reason,
    setReason,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  async function sendAction(
    action:
      | "approve"
      | "reject"
      | "return-for-edit"
  ) {
    if (
      action !== "approve" &&
      !reason.trim()
    ) {
      setError(
        "وارد کردن دلیل الزامی است."
      );

      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const response = await fetch(
        `/api/forecasts/${forecastId}/${action}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            action === "approve"
              ? undefined
              : JSON.stringify({
                  reason:
                    reason.trim(),
                }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "عملیات انجام نشد."
        );
      }

      router.push(
        "/forecasts/review"
      );

      router.refresh();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "عملیات انجام نشد."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border p-4">
      <label className="mb-2 block text-sm font-medium">
        توضیحات مدیر گروه
      </label>

      <textarea
        value={reason}
        onChange={(event) =>
          setReason(
            event.target.value
          )
        }
        rows={4}
        className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
        placeholder="دلیل بازگشت یا رد موضوع را وارد کنید."
      />

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={
            isSubmitting
          }
          onClick={() =>
            void sendAction(
              "approve"
            )
          }
          className="rounded-lg bg-green-600 px-4 py-2 text-white disabled:opacity-50"
        >
          تأیید نهایی
        </button>

        <button
          type="button"
          disabled={
            isSubmitting
          }
          onClick={() =>
            void sendAction(
              "return-for-edit"
            )
          }
          className="rounded-lg bg-amber-500 px-4 py-2 text-white disabled:opacity-50"
        >
          بازگشت برای اصلاح
        </button>

        <button
          type="button"
          disabled={
            isSubmitting
          }
          onClick={() =>
            void sendAction(
              "reject"
            )
          }
          className="rounded-lg bg-red-600 px-4 py-2 text-white disabled:opacity-50"
        >
          رد نهایی
        </button>
      </div>
    </section>
  );
}