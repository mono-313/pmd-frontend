"use client";

import {
  type ReactNode,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import {
  ATTENDANCE_TYPE_OPTIONS,
} from "@/app/types/program-profile";

import type {
  AttendanceType,
  ProfileExpertData,
} from "@/app/types/program-profile";


export interface ProfileExpertOption {
  id: string;
  firstName: string;
  lastName: string;
}


export interface ProfileTopicAxisOption {
  id: string;
  title: string;
}


interface ProfileExpertsStepProps {
  hasExpert: boolean;
  experts: ProfileExpertData[];
  availableExperts: ProfileExpertOption[];
  topicAxes: ProfileTopicAxisOption[];
  isExpertsLoading?: boolean;
  expertsError?: string;
  onChange: (
    experts: ProfileExpertData[]
  ) => void;
  onBack: () => void;
  onNext: () => void;
}


interface ExpertFormData {
  expertId: string;
  topicAxisId: string;
  duration: string;
  attendanceType: AttendanceType;
  hasPayment: boolean;
}


export default function ProfileExpertsStep({
  hasExpert,
  experts,
  availableExperts,
  topicAxes,
  isExpertsLoading = false,
  expertsError = "",
  onChange,
  onBack,
  onNext,
}: ProfileExpertsStepProps) {
  const [formData, setFormData] =
    useState<ExpertFormData>(() =>
      createEmptyForm(topicAxes)
    );

  const [editingIndex, setEditingIndex] =
    useState<number | null>(null);

  const [validationError, setValidationError] =
    useState("");


  /*
   * ممکن است کارشناس ثبت‌شده در Forecast در صفحه اول
   * availableExperts نباشد. او را برای نمایش و ویرایش نگه می‌داریم.
   */
  const selectableExperts =
    useMemo(
      () =>
        mergeAvailableWithSelected(
          availableExperts,
          experts
        ),
      [availableExperts, experts]
    );


  function resetForm() {
    setFormData(
      createEmptyForm(topicAxes)
    );
    setEditingIndex(null);
    setValidationError("");
  }


  function saveExpert() {
    setValidationError("");

    const validationMessage =
      validateExpertForm(
        formData,
        selectableExperts,
        topicAxes
      );

    if (validationMessage) {
      setValidationError(
        validationMessage
      );
      return;
    }

    const selectedExpert =
      selectableExperts.find(
        (expert) =>
          expert.id ===
          formData.expertId
      );

    const selectedAxis =
      topicAxes.find(
        (axis) =>
          axis.id ===
          formData.topicAxisId
      );

    if (!selectedExpert || !selectedAxis) {
      setValidationError(
        "اطلاعات کارشناس یا محور موضوعی پیدا نشد."
      );
      return;
    }

    const duplicateIndex =
      experts.findIndex(
        (expert, index) =>
          index !== editingIndex &&
          expert.expertId ===
            formData.expertId &&
          expert.topicAxisId ===
            formData.topicAxisId
      );

    if (duplicateIndex !== -1) {
      setValidationError(
        "این کارشناس قبلاً برای محور انتخاب‌شده ثبت شده است."
      );
      return;
    }

    const normalizedExpert:
      ProfileExpertData = {
      expertId:
        selectedExpert.id,
      firstName:
        selectedExpert.firstName,
      lastName:
        selectedExpert.lastName,
      topicAxisId:
        selectedAxis.id,
      topicAxisTitle:
        selectedAxis.title,
      duration:
        normalizeDigits(
          formData.duration.trim()
        ),
      attendanceType:
        formData.attendanceType,
      hasPayment:
        formData.hasPayment,
    };

    if (editingIndex === null) {
      onChange([
        ...experts,
        normalizedExpert,
      ]);
    } else {
      onChange(
        experts.map(
          (expert, index) =>
            index === editingIndex
              ? normalizedExpert
              : expert
        )
      );
    }

    resetForm();
  }


  function startEditing(
    expert: ProfileExpertData,
    index: number
  ) {
    setFormData({
      expertId:
        expert.expertId,
      topicAxisId:
        expert.topicAxisId,
      duration:
        expert.duration ||
        "00:15:00",
      attendanceType:
        expert.attendanceType,
      hasPayment:
        expert.hasPayment,
    });

    setEditingIndex(index);
    setValidationError("");

    document
      .getElementById(
        "profile-expert-form"
      )
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  }


  function deleteExpert(
    index: number
  ) {
    onChange(
      experts.filter(
        (_expert, expertIndex) =>
          expertIndex !== index
      )
    );

    if (editingIndex === index) {
      resetForm();
    } else if (
      editingIndex !== null &&
      index < editingIndex
    ) {
      setEditingIndex(
        editingIndex - 1
      );
    }
  }


  function handleNext() {
    if (
      hasExpert &&
      experts.length === 0
    ) {
      setValidationError(
        "برای این برنامه حداقل یک کارشناس انتخاب کنید."
      );
      return;
    }

    const incompleteExpert =
      experts.find(
        (expert) =>
          !expert.expertId ||
          !expert.topicAxisId ||
          !isTimeSpan(
            normalizeDigits(
              expert.duration
            )
          )
      );

    if (incompleteExpert) {
      setValidationError(
        "اطلاعات محور موضوعی و مدت حضور همه کارشناسان را تکمیل کنید."
      );
      return;
    }

    setValidationError("");
    onNext();
  }


  return (
    <section
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      dir="rtl"
    >
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-[#007fcf]">
            <UsersRound size={23} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-800">
              کارشناسان برنامه
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              کارشناسان پیش‌بینی نمایش داده شده‌اند؛ در صورت نیاز می‌توانید آن‌ها را ویرایش یا جایگزین کنید.
            </p>
          </div>
        </div>

        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#007fcf]">
          {toPersianNumber(
            experts.length
          )}{" "}
          کارشناس
        </span>
      </header>


      {!hasExpert ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">
          طبق اطلاعات پیش‌بینی، این برنامه کارشناس ندارد.
        </div>
      ) : (
        <>
          <section
            id="profile-expert-form"
            className="rounded-xl border border-blue-100 bg-blue-50/40 p-4"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-bold text-gray-800">
                {editingIndex === null
                  ? "افزودن کارشناس"
                  : "ویرایش و جایگزینی کارشناس"}
              </h3>

              {editingIndex !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-white"
                >
                  <X size={16} />
                  انصراف از ویرایش
                </button>
              )}
            </div>


            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label>
                <FieldTitle>کارشناس</FieldTitle>
                <select
                  value={formData.expertId}
                  disabled={isExpertsLoading}
                  onChange={(event) =>
                    setFormData(
                      (previous) => ({
                        ...previous,
                        expertId:
                          event.target.value,
                      })
                    )
                  }
                  className={inputClassName}
                >
                  <option value="">
                    {isExpertsLoading
                      ? "در حال دریافت..."
                      : "انتخاب کارشناس"}
                  </option>

                  {selectableExperts.map(
                    (expert) => (
                      <option
                        key={expert.id}
                        value={expert.id}
                      >
                        {getExpertName(expert)}
                      </option>
                    )
                  )}
                </select>
              </label>


              <label>
                <FieldTitle>محور موضوعی</FieldTitle>
                <select
                  value={formData.topicAxisId}
                  onChange={(event) =>
                    setFormData(
                      (previous) => ({
                        ...previous,
                        topicAxisId:
                          event.target.value,
                      })
                    )
                  }
                  className={inputClassName}
                >
                  <option value="">
                    انتخاب محور
                  </option>

                  {topicAxes.map(
                    (axis) => (
                      <option
                        key={axis.id}
                        value={axis.id}
                      >
                        {axis.title}
                      </option>
                    )
                  )}
                </select>
              </label>


              <label>
                <FieldTitle>مدت حضور</FieldTitle>
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  value={formData.duration}
                  placeholder="00:15:00"
                  onChange={(event) =>
                    setFormData(
                      (previous) => ({
                        ...previous,
                        duration:
                          event.target.value,
                      })
                    )
                  }
                  className={inputClassName}
                />
              </label>


              <label>
                <FieldTitle>نحوه حضور</FieldTitle>
                <select
                  value={formData.attendanceType}
                  onChange={(event) =>
                    setFormData(
                      (previous) => ({
                        ...previous,
                        attendanceType:
                          Number(
                            event.target.value
                          ) as AttendanceType,
                      })
                    )
                  }
                  className={inputClassName}
                >
                  {ATTENDANCE_TYPE_OPTIONS.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.title}
                      </option>
                    )
                  )}
                </select>
              </label>


              <label className="flex min-h-11 items-center gap-3 self-end rounded-lg border border-gray-300 bg-white px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={formData.hasPayment}
                  onChange={(event) =>
                    setFormData(
                      (previous) => ({
                        ...previous,
                        hasPayment:
                          event.target.checked,
                      })
                    )
                  }
                  className="h-4 w-4 accent-[#007fcf]"
                />
                <span className="text-sm font-semibold text-gray-700">
                  شامل هزینه است
                </span>
              </label>


              <button
                type="button"
                onClick={saveExpert}
                className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-lg bg-[#007fcf] px-5 py-2.5 font-semibold text-white transition hover:bg-[#006daf]"
              >
                {editingIndex === null ? (
                  <Plus size={18} />
                ) : (
                  <Check size={18} />
                )}
                {editingIndex === null
                  ? "افزودن کارشناس"
                  : "ذخیره تغییرات"}
              </button>
            </div>


            {expertsError && (
              <ErrorMessage>
                {expertsError}
              </ErrorMessage>
            )}
          </section>


          <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <TableHeader>ردیف</TableHeader>
                  <TableHeader align="right">نام کارشناس</TableHeader>
                  <TableHeader align="right">محور موضوعی</TableHeader>
                  <TableHeader>مدت حضور</TableHeader>
                  <TableHeader>نحوه حضور</TableHeader>
                  <TableHeader>هزینه</TableHeader>
                  <TableHeader>عملیات</TableHeader>
                </tr>
              </thead>

              <tbody>
                {experts.map(
                  (expert, index) => (
                    <tr
                      key={`${expert.expertId}-${expert.topicAxisId}-${index}`}
                      className={`border-t border-gray-100 text-gray-700 transition ${
                        editingIndex === index
                          ? "bg-blue-50"
                          : "hover:bg-blue-50/40"
                      }`}
                    >
                      <TableCell>
                        {toPersianNumber(index + 1)}
                      </TableCell>

                      <TableCell align="right">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[#007fcf]">
                            <UserRound size={16} />
                          </div>
                          <span className="font-semibold text-gray-800">
                            {getProfileExpertName(expert)}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell align="right">
                        {expert.topicAxisTitle || "تکمیل نشده"}
                      </TableCell>

                      <TableCell>
                        {expert.duration
                          ? toPersianNumber(expert.duration)
                          : "تکمیل نشده"}
                      </TableCell>

                      <TableCell>
                        {getAttendanceTitle(expert.attendanceType)}
                      </TableCell>

                      <TableCell>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            expert.hasPayment
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {expert.hasPayment ? "دارد" : "ندارد"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              startEditing(expert, index)
                            }
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 font-semibold text-[#007fcf] transition hover:bg-blue-50"
                          >
                            <Pencil size={16} />
                            ویرایش
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteExpert(index)}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                            حذف
                          </button>
                        </div>
                      </TableCell>
                    </tr>
                  )
                )}


                {experts.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-10 text-center text-gray-500"
                    >
                      کارشناسی در پیش‌بینی ثبت نشده است؛ از فرم بالا کارشناس اضافه کنید.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}


      {validationError && (
        <ErrorMessage>
          {validationError}
        </ErrorMessage>
      )}


      <footer className="mt-8 flex items-center justify-between gap-3 border-t border-gray-200 pt-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowRight size={18} />
          مرحله قبل
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center gap-2 rounded-lg bg-[#007fcf] px-6 py-2.5 font-semibold text-white transition hover:bg-[#006daf]"
        >
          مرحله بعد
          <ArrowLeft size={18} />
        </button>
      </footer>
    </section>
  );
}


function createEmptyForm(
  topicAxes: ProfileTopicAxisOption[]
): ExpertFormData {
  return {
    expertId: "",
    topicAxisId:
      topicAxes.length === 1
        ? topicAxes[0].id
        : "",
    duration: "00:15:00",
    attendanceType: 1,
    hasPayment: false,
  };
}


function validateExpertForm(
  formData: ExpertFormData,
  experts: ProfileExpertOption[],
  topicAxes: ProfileTopicAxisOption[]
): string | null {
  if (!formData.expertId) {
    return "انتخاب کارشناس الزامی است.";
  }

  if (!experts.some(
    (expert) =>
      expert.id === formData.expertId
  )) {
    return "اطلاعات کارشناس انتخاب‌شده پیدا نشد.";
  }

  if (!formData.topicAxisId) {
    return "انتخاب محور موضوعی الزامی است.";
  }

  if (!topicAxes.some(
    (axis) =>
      axis.id === formData.topicAxisId
  )) {
    return "اطلاعات محور موضوعی انتخاب‌شده پیدا نشد.";
  }

  if (!isTimeSpan(
    normalizeDigits(
      formData.duration.trim()
    )
  )) {
    return "مدت حضور باید با فرمت hh:mm:ss وارد شود.";
  }

  return null;
}


function mergeAvailableWithSelected(
  availableExperts: ProfileExpertOption[],
  selectedExperts: ProfileExpertData[]
): ProfileExpertOption[] {
  const result =
    new Map<string, ProfileExpertOption>();

  for (const expert of availableExperts) {
    if (expert.id) {
      result.set(expert.id, expert);
    }
  }

  for (const expert of selectedExperts) {
    if (
      expert.expertId &&
      !result.has(expert.expertId)
    ) {
      result.set(
        expert.expertId,
        {
          id: expert.expertId,
          firstName: expert.firstName,
          lastName: expert.lastName,
        }
      );
    }
  }

  return Array.from(result.values());
}


const inputClassName = `
  min-h-11 w-full rounded-lg border border-gray-300 bg-white
  px-3 py-2.5 outline-none transition
  focus:border-[#007fcf] focus:ring-2 focus:ring-[#007fcf]/10
  disabled:bg-gray-100
`;


function FieldTitle({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className="mb-2 block text-sm font-semibold text-gray-700">
      {children}
      <span className="mr-1 text-red-500">*</span>
    </span>
  );
}


function ErrorMessage({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {children}
    </div>
  );
}


function TableHeader({
  children,
  align = "center",
}: {
  children: ReactNode;
  align?: "right" | "center";
}) {
  return (
    <th
      className={`whitespace-nowrap px-4 py-4 font-bold ${
        align === "right"
          ? "text-right"
          : "text-center"
      }`}
    >
      {children}
    </th>
  );
}


function TableCell({
  children,
  align = "center",
}: {
  children: ReactNode;
  align?: "right" | "center";
}) {
  return (
    <td
      className={`whitespace-nowrap px-4 py-4 ${
        align === "right"
          ? "text-right"
          : "text-center"
      }`}
    >
      {children}
    </td>
  );
}


function getExpertName(
  expert: ProfileExpertOption
): string {
  return (
    `${expert.firstName} ${expert.lastName}`
      .trim() ||
    "کارشناس بدون نام"
  );
}


function getProfileExpertName(
  expert: ProfileExpertData
): string {
  return (
    `${expert.firstName} ${expert.lastName}`
      .trim() ||
    "کارشناس بدون نام"
  );
}


function getAttendanceTitle(
  attendanceType: AttendanceType
): string {
  return (
    ATTENDANCE_TYPE_OPTIONS.find(
      (option) =>
        option.value === attendanceType
    )?.title ?? "نامشخص"
  );
}


function isTimeSpan(
  value: string
): boolean {
  return /^\d{2,}:[0-5]\d:[0-5]\d$/.test(value);
}


function toPersianNumber(
  value: string | number
): string {
  return String(value).replace(
    /\d/g,
    (digit) =>
      "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]
  );
}


function normalizeDigits(
  value: string
): string {
  const persianDigits =
    "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits =
    "٠١٢٣٤٥٦٧٨٩";

  return value
    .replace(
      /[۰-۹]/g,
      (digit) =>
        String(
          persianDigits.indexOf(digit)
        )
    )
    .replace(
      /[٠-٩]/g,
      (digit) =>
        String(
          arabicDigits.indexOf(digit)
        )
    );
}
