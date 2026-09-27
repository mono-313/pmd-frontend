"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
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

interface NetworkOption {
  id: number;
  name: string;
}

interface BusinessTypeOption {
  id: number;
  name: string;
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
  const [allowedNetworks, setAllowedNetworks] = useState<NetworkOption[]>([]);
  const [isLoadingNetworks, setIsLoadingNetworks] = useState(false);
  const [networkError, setNetworkError] = useState("");
  const [businessTypes, setBusinessTypes] = useState<BusinessTypeOption[]>([]);
  const [isLoadingBusinessTypes, setIsLoadingBusinessTypes] = useState(false);
  const [businessTypesError, setBusinessTypesError] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    const networkIds = normalizeNetworkIds(getUserSession()?.networkIds);
    const controller = new AbortController();

    setAllowedNetworks([]);
    setIsLoadingNetworks(false);
    setNetworkError("");
    setBusinessTypes([]);
    setIsLoadingBusinessTypes(false);
    setBusinessTypesError("");
    setFormData({
      ...emptyForm,
      networkIds: networkIds.length === 1 ? [networkIds[0]] : [],
    });
    setError("");

    if (networkIds.length === 0) {
      setNetworkError("هیچ شبکه‌ای در نشست کاربر تعریف نشده است.");
      return () => controller.abort();
    }

    async function loadNetworks() {
      try {
        setIsLoadingNetworks(true);

        const response = await fetch("/api/networks", {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });
        const responseData = parseJsonResponse(await response.text());

        if (!response.ok) {
          throw new Error(
            getMessage(responseData) ??
              `دریافت شبکه‌ها انجام نشد. کد پاسخ: ${response.status}`
          );
        }

        const allowedIds = new Set(networkIds);
        const networks = getNetworkOptions(responseData).filter((network) =>
          allowedIds.has(network.id)
        );

        if (networks.length === 0) {
          throw new Error("نام شبکه‌های مجاز کاربر از وب‌سرویس دریافت نشد.");
        }

        setAllowedNetworks(networks);
      } catch (loadError) {
        if (controller.signal.aborted) return;

        setNetworkError(
          loadError instanceof Error
            ? loadError.message
            : "دریافت شبکه‌ها انجام نشد."
        );
      } finally {
        if (!controller.signal.aborted) setIsLoadingNetworks(false);
      }
    }

    async function loadBusinessTypes() {
      try {
        setIsLoadingBusinessTypes(true);

        const response = await fetch("/api/business-types", {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });
        const responseData = parseJsonResponse(await response.text());

        if (!response.ok) {
          throw new Error(
            getMessage(responseData) ??
              `دریافت عناوین شغلی انجام نشد. کد پاسخ: ${response.status}`
          );
        }

        const options = getBusinessTypeOptions(responseData);
        if (options.length === 0) {
          throw new Error("هیچ عنوان شغلی فعالی از وب‌سرویس دریافت نشد.");
        }

        setBusinessTypes(options);
      } catch (loadError) {
        if (controller.signal.aborted) return;

        setBusinessTypesError(
          loadError instanceof Error
            ? loadError.message
            : "دریافت عناوین شغلی انجام نشد."
        );
      } finally {
        if (!controller.signal.aborted) setIsLoadingBusinessTypes(false);
      }
    }

    void loadNetworks();
    void loadBusinessTypes();

    return () => controller.abort();
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
    const mobilePhone = normalizeDigits(formData.mobilePhone.trim());
    const nationalCode = normalizeDigits(formData.nationalCode.trim());
    const workPhone = formData.workPhone.trim();

    if (!firstName) return setError("نام الزامی است.");
    if (!lastName) return setError("نام خانوادگی الزامی است.");
    if (!specialty) return setError("تخصص یا سمت الزامی است.");
    if (formData.education === null) return setError("مقطع تحصیلی را انتخاب کنید.");
    if (!workplace) return setError("محل کار الزامی است.");
    if (!mobilePhone) return setError("تلفن همراه الزامی است.");
    if (!/^09\d{9}$/.test(mobilePhone)) {
      return setError("شماره تلفن همراه باید ۱۱ رقم و با 09 شروع شود.");
    }
    if (nationalCode && !isValidIranianNationalCode(nationalCode)) {
      return setError("کد ملی واردشده معتبر نیست.");
    }
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

      const createdExpert = getCreatedExpert(responseData);

      if (!createdExpert) {
        console.error("Invalid create expert response:", responseData);
        throw new Error(
          "کارشناس ثبت شد، اما اطلاعات آن از پاسخ سرور دریافت نشد."
        );
      }

      onCreated(createdExpert);
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
              <input
                required
                value={formData.firstName}
                onChange={(event) => updateText("firstName", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="نام خانوادگی" required>
              <input
                required
                value={formData.lastName}
                onChange={(event) => updateText("lastName", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="تخصص / سمت" required>
              <select
                required
                value={formData.specialty}
                onChange={(event) => updateText("specialty", event.target.value)}
                disabled={isLoadingBusinessTypes || businessTypes.length === 0}
                className={inputClass}
              >
                <option value="">
                  {isLoadingBusinessTypes
                    ? "در حال دریافت عناوین شغلی..."
                    : "انتخاب سمت / تخصص"}
                </option>
                {businessTypes.map((option) => (
                  <option key={option.id} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </select>
              {businessTypesError && (
                <p className="mt-1.5 text-xs text-red-600">
                  {businessTypesError}
                </p>
              )}
            </Field>
            <Field label="مقطع تحصیلی" required>
              <select
                required
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
              <input
                required
                value={formData.workplace}
                onChange={(event) => updateText("workplace", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="تلفن همراه" required>
              <input
                required
                value={formData.mobilePhone}
                onChange={(event) => updateText("mobilePhone", event.target.value)}
                inputMode="numeric"
                maxLength={11}
                placeholder="09121234567"
                className={inputClass}
              />
            </Field>
            <Field label="کد ملی" required>
              <input
                required
                value={formData.nationalCode}
                onChange={(event) => updateText("nationalCode", event.target.value)}
                inputMode="numeric"
                maxLength={10}
                placeholder="1234567890"
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-gray-500">
                اختیاری؛ در صورت ورود باید معتبر باشد.
              </p>
            </Field>
            <Field label="تلفن محل کار">
              <input
                value={formData.workPhone}
                onChange={(event) => updateText("workPhone", event.target.value)}
                inputMode="tel"
                placeholder="02188888888"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="شبکه‌ها" required className="mt-5">
            {isLoadingNetworks ? (
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 p-4 text-sm text-gray-500">
                <LoaderCircle size={17} className="animate-spin" />
                در حال دریافت نام شبکه‌ها...
              </div>
            ) : allowedNetworks.length > 0 ? (
              <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 p-4">
                {allowedNetworks.map((network) => (
                  <label
                    key={network.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={formData.networkIds.includes(network.id)}
                      onChange={() => toggleNetwork(network.id)}
                      className="h-4 w-4 accent-[#007fcf]"
                    />
                    {network.name}
                  </label>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                {networkError || "شبکه‌ای برای انتخاب در دسترس نیست."}
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
            <button
              type="submit"
              disabled={
                isSubmitting ||
                isLoadingNetworks ||
                isLoadingBusinessTypes ||
                allowedNetworks.length === 0 ||
                businessTypes.length === 0
              }
              className="flex items-center gap-2 rounded-lg bg-[#007fcf] px-5 py-2.5 font-semibold text-white hover:bg-[#006fb5] disabled:opacity-60"
            >
              {isSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : <UserPlus size={18} />}
              ثبت و انتخاب کارشناس
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required = false,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="mr-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function parseJsonResponse(text: string): unknown | null {
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
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

function normalizeNetworkIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item > 0)
    )
  );
}

function getNetworkOptions(value: unknown): NetworkOption[] {
  const items = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.networks)
      ? value.networks
      : [];

  const options: NetworkOption[] = [];

  for (const item of items) {
    if (!isRecord(item)) continue;

    const id = Number(item.id);
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const disabled = item.disabled === true;

    if (Number.isInteger(id) && id > 0 && name && !disabled) {
      options.push({ id, name });
    }
  }

  return options;
}

function getBusinessTypeOptions(value: unknown): BusinessTypeOption[] {
  const items = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.businessTypes)
      ? value.businessTypes
      : [];

  const options: BusinessTypeOption[] = [];
  const names = new Set<string>();

  for (const item of items) {
    if (!isRecord(item)) continue;

    const id = Number(item.id);
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const disabled = item.disabled === true;

    if (
      Number.isInteger(id) &&
      id > 0 &&
      name &&
      !disabled &&
      !names.has(name)
    ) {
      names.add(name);
      options.push({ id, name });
    }
  }

  return options.sort((first, second) =>
    first.name.localeCompare(second.name, "fa")
  );
}

function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function isValidIranianNationalCode(value: string): boolean {
  if (!/^\d{10}$/.test(value) || /^(\d)\1{9}$/.test(value)) return false;

  const checkDigit = Number(value[9]);
  const sum = value
    .slice(0, 9)
    .split("")
    .reduce((total, digit, index) => total + Number(digit) * (10 - index), 0);
  const remainder = sum % 11;
  const expectedCheckDigit = remainder < 2 ? remainder : 11 - remainder;

  return checkDigit === expectedCheckDigit;
}

function getCreatedExpert(value: unknown): ExpertOption | null {
  /*
   * حالت اول:
   * Backend مستقیماً ExpertResponse
   * برگردانده است.
   */
  if (isExpertOption(value)) {
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
  if (isExpertOption(value.expert)) {
    return value.expert;
  }

  /*
   * پشتیبانی از Wrapperهای احتمالی
   */
  if (isExpertOption(value.data)) {
    return value.data;
  }

  if (isExpertOption(value.result)) {
    return value.result;
  }

  return null;
}

function isExpertOption(value: unknown): value is ExpertOption {
  if (!isRecord(value)) {
    return false;
  }

  /*
   * برای انتخاب کارشناس در ویزارد
   * وجود این سه فیلد کافی است.
   */
  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.firstName === "string" &&
    typeof value.lastName === "string"
  );
}

const inputClass = "h-12 w-full rounded-lg border border-gray-300 bg-white px-3 outline-none focus:border-[#007fcf]";
