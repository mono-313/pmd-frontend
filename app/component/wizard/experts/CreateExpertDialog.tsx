"use client";

import { FormEvent, useEffect, useState } from "react";
import { LoaderCircle, UserPlus, X } from "lucide-react";
import { getUserSession } from "@/app/lib/storage";
import { EDUCATION_LEVEL_OPTIONS } from "@/app/types/expert";
import type {
  CreateExpertRequest,
  EducationLevel,
  ExpertOption,
} from "@/app/types/expert";

interface CreateExpertDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (expert: ExpertOption) => void;
}

interface ExpertFormData {
  firstName: string;
  lastName: string;
  specialty: string;
  education: EducationLevel | null;
  workplace: string;
  mobilePhone: string;
  nationalCode: string;
  workPhone: string;
  networkIds: number[];
}

const emptyForm: ExpertFormData = {
  firstName: "",
  lastName: "",
  specialty: "",
  education: null,
  workplace: "",
  mobilePhone: "",
  nationalCode: "",
  workPhone: "",
  networkIds: [],
};

export default function CreateExpertDialog({
  open,
  onClose,
  onCreated,
}: CreateExpertDialogProps) {
  const [formData, setFormData] = useState<ExpertFormData>(emptyForm);
  const [allowedNetworkIds, setAllowedNetworkIds] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    const networkIds = getUserSession()?.networkIds ?? [];
    setAllowedNetworkIds(networkIds);
    setFormData({
      ...emptyForm,
      networkIds: networkIds.length === 1 ? [networkIds[0]] : [],
    });
    setError("");
  }, [open]);

  if (!open) return null;

  function updateText(
    field: Exclude<keyof ExpertFormData, "education" | "networkIds">,
    value: string
  ) {
    setFormData((previous) => ({ ...previous, [field]: value }));
  }

  function toggleNetwork(networkId: number) {
    setFormData((previous) => ({
      ...previous,
      networkIds: previous.networkIds.includes(networkId)
        ? previous.networkIds.filter((id) => id !== networkId)
        : [...previous.networkIds, networkId],
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const specialty = formData.specialty.trim();
    const workplace = formData.workplace.trim();
    const mobilePhone = formData.mobilePhone.trim();
    const nationalCode = formData.nationalCode.trim();
    const workPhone = formData.workPhone.trim();

    if (!firstName) return setError("نام الزامی است.");
    if (!lastName) return setError("نام خانوادگی الزامی است.");
    if (!specialty) return setError("تخصص یا سمت الزامی است.");
    if (formData.education === null) return setError("مقطع تحصیلی را انتخاب کنید.");
    if (!workplace) return setError("محل کار الزامی است.");
    if (!mobilePhone) return setError("تلفن همراه الزامی است.");
    if (!nationalCode) return setError("کد ملی الزامی است.");
    if (formData.networkIds.length === 0) {
      return setError("حداقل یک شبکه را انتخاب کنید.");
    }

    const body: CreateExpertRequest = {
      firstName,
      lastName,
      specialty,
      education: formData.education,
      workplace,
      mobilePhone,
      nationalCode,
      ...(workPhone ? { workPhone } : {}),
      networkIds: formData.networkIds,
    };

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/experts", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const responseData = parseJsonResponse(await response.text());
      if (!response.ok) {
        throw new Error(
          getMessage(responseData) ??
            `ثبت کارشناس انجام نشد. کد پاسخ: ${response.status}`
        );
      }


const createdExpert =
  getCreatedExpert(
    responseData
  );

if (!createdExpert) {
  console.error(
    "Invalid create expert response:",
    responseData
  );

  throw new Error(
    "کارشناس ثبت شد، اما اطلاعات آن از پاسخ سرور دریافت نشد."
  );
}

onCreated(
  createdExpert
);





      
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "ثبت کارشناس انجام نشد."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8"
      dir="rtl"
    >
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b pb-4">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-[#007fcf]">
              <UserPlus size={21} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">تعریف کارشناس جدید</h2>
              <p className="mt-1 text-sm text-gray-500">
                پس از ثبت، کارشناس به‌صورت خودکار انتخاب می‌شود.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
            aria-label="بستن"
          >
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="mt-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="نام" required>
              <input value={formData.firstName} onChange={(e) => updateText("firstName", e.target.value)} className={inputClass} />
            </Field>
            <Field label="نام خانوادگی" required>
              <input value={formData.lastName} onChange={(e) => updateText("lastName", e.target.value)} className={inputClass} />
            </Field>
            <Field label="تخصص / سمت" required>
              <input value={formData.specialty} onChange={(e) => updateText("specialty", e.target.value)} className={inputClass} />
            </Field>
            <Field label="مقطع تحصیلی" required>
              <select
                value={formData.education ?? ""}
                onChange={(e) =>
                  setFormData((previous) => ({
                    ...previous,
                    education: e.target.value
                      ? (Number(e.target.value) as EducationLevel)
                      : null,
                  }))
                }
                className={inputClass}
              >
                <option value="">انتخاب مقطع تحصیلی</option>
                {EDUCATION_LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </Field>
            <Field label="محل کار" required>
              <input value={formData.workplace} onChange={(e) => updateText("workplace", e.target.value)} className={inputClass} />
            </Field>
            <Field label="تلفن همراه" required>
              <input value={formData.mobilePhone} onChange={(e) => updateText("mobilePhone", e.target.value)} inputMode="tel" placeholder="09121234567" className={inputClass} />
            </Field>
            <Field label="کد ملی" required>
              <input value={formData.nationalCode} onChange={(e) => updateText("nationalCode", e.target.value)} inputMode="numeric" placeholder="1234567890" className={inputClass} />
            </Field>
            <Field label="تلفن محل کار">
              <input value={formData.workPhone} onChange={(e) => updateText("workPhone", e.target.value)} inputMode="tel" placeholder="02188888888" className={inputClass} />
            </Field>
          </div>

          <Field label="شبکه‌ها" required className="mt-5">
            {allowedNetworkIds.length > 0 ? (
              <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 p-4">
                {allowedNetworkIds.map((networkId) => (
                  <label key={networkId} className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={formData.networkIds.includes(networkId)}
                      onChange={() => toggleNetwork(networkId)}
                      className="h-4 w-4 accent-[#007fcf]"
                    />
                    شبکه {networkId}
                  </label>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                هیچ شبکه‌ای در نشست کاربر تعریف نشده است.
              </div>
            )}
          </Field>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <footer className="mt-7 flex justify-end gap-3 border-t pt-5">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-lg border border-gray-300 px-5 py-2.5 font-semibold text-gray-700">
              انصراف
            </button>
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 rounded-lg bg-[#007fcf] px-5 py-2.5 font-semibold text-white hover:bg-[#006fb5] disabled:opacity-60">
              {isSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : <UserPlus size={18} />}
              ثبت و انتخاب کارشناس
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required = false, className = "", children }: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}{required && <span className="mr-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function parseJsonResponse(text: string): unknown | null {
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
  if (typeof value.title === "string") return value.title;
  return null;
}

function getCreatedExpert(
  value: unknown
): ExpertOption | null {
  /*
   * حالت اول:
   * Backend مستقیماً ExpertResponse
   * برگردانده است.
   */
  if (
    isExpertOption(value)
  ) {
    return value;
  }

  if (!isRecord(value)) {
    return null;
  }

  /*
   * حالت دوم:
   * Route داخلی پاسخ را داخل
   * expert قرار داده است.
   */
  if (
    isExpertOption(
      value.expert
    )
  ) {
    return value.expert;
  }

  /*
   * پشتیبانی از Wrapperهای احتمالی
   */
  if (
    isExpertOption(
      value.data
    )
  ) {
    return value.data;
  }

  if (
    isExpertOption(
      value.result
    )
  ) {
    return value.result;
  }

  return null;
}

function isExpertOption(
  value: unknown
): value is ExpertOption {
  if (!isRecord(value)) {
    return false;
  }

  /*
   * برای انتخاب کارشناس در ویزارد
   * وجود این سه فیلد کافی است.
   */
  return (
    typeof value.id ===
      "string" &&

    value.id.length > 0 &&

    typeof value.firstName ===
      "string" &&

    typeof value.lastName ===
      "string"
  );
}
const inputClass = "h-12 w-full rounded-lg border border-gray-300 bg-white px-3 outline-none focus:border-[#007fcf]";

