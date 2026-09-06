"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, Pencil, Save, X } from "lucide-react";

import type { UpdateForecastRequest } from "@/app/types/forecast";
import type { Program, WizardFormData } from "@/app/types/wizard";

interface EditFinalReviewStepProps {
  forecastId: string;
  episodeNumber: number;
  wizardData: WizardFormData;
  programs: Program[];
  onBack: () => void;
  onEditStep: (step: number) => void;
}

export default function EditFinalReviewStep({
  forecastId,
  episodeNumber,
  wizardData,
  programs,
  onBack,
  onEditStep,
}: EditFinalReviewStepProps) {
  const router = useRouter();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedProgram = programs.find(
    (program) => program.id === wizardData.specifications.planId
  );

  function openConfirmation() {
    setError("");

    if (!wizardData.specifications.mainTopic.trim()) {
      return setError("موضوع اصلی الزامی است.");
    }

    if (!wizardData.specifications.broadcastDate.trim()) {
      return setError("تاریخ پخش الزامی است.");
    }

    if (wizardData.topics.length === 0) {
      return setError("حداقل یک محور موضوعی الزامی است.");
    }

    if (
      wizardData.specifications.hasExpert &&
      wizardData.experts.length === 0
    ) {
      return setError("حداقل یک کارشناس انتخاب کنید.");
    }

    setShowConfirmation(true);
  }

  async function submitUpdate() {
    const body: UpdateForecastRequest = {
      id: forecastId,
      broadcastDate: wizardData.specifications.broadcastDate,
      mainTopic: wizardData.specifications.mainTopic.trim(),
      hasExpert: wizardData.specifications.hasExpert,
      topicAxes: wizardData.topics.map((topic) => topic.title.trim()),
      expertIds: wizardData.specifications.hasExpert
        ? wizardData.experts.map((expert) => expert.id)
        : [],
    };

    try {
      setIsSubmitting(true);
      setError("");
      setSuccess("");

      const response = await fetch(`/api/forecasts/${forecastId}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = parseJson(await response.text());

      if (!response.ok) {
        throw new Error(
          getMessage(data) ??
            `ویرایش پیش‌بینی انجام نشد. کد پاسخ: ${response.status}`
        );
      }

      setShowConfirmation(false);
      setSuccess("تغییرات پیش‌بینی با موفقیت ثبت شد.");

      setTimeout(() => {
        router.replace("/forecasts");
        router.refresh();
      }, 900);
    } catch (submitError) {
      setShowConfirmation(false);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "ویرایش پیش‌بینی انجام نشد."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <section className="mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">بازبینی تغییرات</h2>
            <p className="mt-2 text-sm text-gray-500">
              اطلاعات را بررسی و تغییرات را ثبت کنید.
            </p>
          </div>
          <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-[#007fcf]">
            قسمت {episodeNumber}
          </span>
        </header>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <CheckCircle2 size={20} />
            {success}
          </div>
        )}

        <ReviewSection title="مشخصات" onEdit={() => onEditStep(1)}>
          <Info label="برنامه" value={selectedProgram?.name ?? `برنامه ${wizardData.specifications.planId}`} />
          <Info label="موضوع اصلی" value={wizardData.specifications.mainTopic} />
          <Info label="تاریخ پخش" value={wizardData.specifications.broadcastDateJalali} />
          <Info label="دارای کارشناس" value={wizardData.specifications.hasExpert ? "بله" : "خیر"} />
        </ReviewSection>

        <ReviewSection title="محورهای موضوعی" onEdit={() => onEditStep(2)}>
          <div className="md:col-span-2">
            {wizardData.topics.map((topic, index) => (
              <div key={topic.id} className="mb-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                {index + 1}. {topic.title}
              </div>
            ))}
          </div>
        </ReviewSection>

        <ReviewSection title="کارشناسان" onEdit={() => onEditStep(3)}>
          <div className="md:col-span-2">
            {!wizardData.specifications.hasExpert ? (
              <p className="text-sm text-gray-500">این برنامه کارشناس ندارد.</p>
            ) : (
              wizardData.experts.map((expert, index) => (
                <div key={expert.id} className="mb-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  {index + 1}. {expert.firstName} {expert.lastName}
                </div>
              ))
            )}
          </div>
        </ReviewSection>

        <footer className="mt-7 flex items-center justify-between border-t pt-5">
          <button type="button" onClick={onBack} className={secondaryButtonClass}>
            مرحله قبل
          </button>
          <button type="button" onClick={openConfirmation} disabled={isSubmitting || Boolean(success)} className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-60">
            <Save size={18} />
            ثبت تغییرات
          </button>
        </footer>
      </section>

      {showConfirmation && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-4" dir="rtl">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <header className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">تأیید ویرایش</h3>
              <button type="button" onClick={() => setShowConfirmation(false)} disabled={isSubmitting} className="p-1 text-gray-400">
                <X size={20} />
              </button>
            </header>
            <p className="mt-4 text-sm leading-7 text-gray-600">
              آیا از ثبت تغییرات این پیش‌بینی اطمینان دارید؟ وضعیت پس از ویرایش به پیش‌نویس برمی‌گردد.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 border-t pt-5">
              <button type="button" onClick={() => setShowConfirmation(false)} disabled={isSubmitting} className={secondaryButtonClass}>
                انصراف
              </button>
              <button type="button" onClick={submitUpdate} disabled={isSubmitting} className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60">
                {isSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}
                بله، ثبت شود
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ReviewSection({ title, onEdit, children }: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5 rounded-xl border border-gray-200 p-4">
      <header className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-gray-800">{title}</h3>
        <button type="button" onClick={onEdit} className="flex items-center gap-1 text-sm font-semibold text-[#007fcf]">
          <Pencil size={15} />
          ویرایش
        </button>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 font-semibold text-gray-800">{value ?? "—"}</p>
    </div>
  );
}

function parseJson(text: string): unknown | null {
  if (!text.trim()) return null;
  try { return JSON.parse(text) as unknown; } catch { return null; }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getMessage(value: unknown): string | null {
  if (!isRecord(value)) return null;
  if (typeof value.message === "string") return value.message;
  if (typeof value.description === "string") return value.description;
  return null;
}

const secondaryButtonClass = "rounded-lg border border-gray-300 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60";
