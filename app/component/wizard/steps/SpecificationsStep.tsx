"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";

import DatePicker, {
  DateObject,
} from "react-multi-date-picker";

import persian from
  "react-date-object/calendars/persian";

import persianFa from
  "react-date-object/locales/persian_fa";

import gregorian from
  "react-date-object/calendars/gregorian";

import { z } from "zod";

import type {
  Program,
  SpecificationsFormData,
} from "@/app/types/wizard";


const specificationsSchema = z.object({
  planId: z
    .number({
      message:
        "نام برنامه را انتخاب کنید.",
    })
    .int()
    .positive(
      "نام برنامه را انتخاب کنید."
    ),



  mainTopic: z
    .string()
    .trim()
    .min(
      1,
      "موضوع اصلی برنامه الزامی است."
    )
    .min(
      3,
      "موضوع اصلی حداقل سه کاراکتر باشد."
    ),

  broadcastDateJalali: z
    .string()
    .min(
      1,
      "تاریخ پخش را انتخاب کنید."
    ),

  broadcastDate: z
    .string()
    .min(
      1,
      "تاریخ پخش معتبر نیست."
    ),

  hasExpert: z.boolean(),
});

interface SpecificationsStepProps {
  initialData: SpecificationsFormData;

  programs: Program[];

  isProgramsLoading: boolean;

  programsError: string;
  isPlanReadOnly?: boolean;

  onNext: (
    data: SpecificationsFormData
  ) => void;
}

type FormErrors = Partial<
  Record<
    keyof SpecificationsFormData,
    string
  >
>;


export default function SpecificationsStep({
  initialData,
  programs,
  isProgramsLoading,
  programsError,
  isPlanReadOnly=false,
  onNext,
}: SpecificationsStepProps) {
  const [formData, setFormData] =
    useState<SpecificationsFormData>(
      {
    planId:
      initialData.planId,
     
    mainTopic:
      initialData.mainTopic,

    broadcastDateJalali:
      initialData.broadcastDateJalali,

    broadcastDate:
      initialData.broadcastDate,

    hasExpert:
      initialData.hasExpert,
  }
    );

  


  const [errors, setErrors] =
    useState<FormErrors>({});

  const [
    selectedDate,
    setSelectedDate,
  ] = useState<DateObject | null>(
    initialData.broadcastDateJalali
      ? new DateObject({
          date:
            initialData.broadcastDateJalali,

          calendar: persian,
          locale: persianFa,
          format: "YYYY/MM/DD",
        })
      : null
  );

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  function handleInputChange(
    event:
      ChangeEvent<
        HTMLInputElement |
        HTMLSelectElement
      >
  ) {
    const {
      name,
      value,
      type,
    } = event.target;

    if (type === "checkbox") {
      const checkbox =
        event.target as HTMLInputElement;

      setFormData((previous) => ({
        ...previous,
        [name]: checkbox.checked,
      }));
    } else if (
  name === "planId"
) {
  setFormData(
    (previous) => ({
      ...previous,

      planId:
        value
          ? Number(value)
          : null,
      })
    );
    } else {
      setFormData((previous) => ({
        ...previous,
        [name]: value,
      }));
    }

    setErrors((previous) => ({
      ...previous,
      [name]: undefined,
    }));
  }

  function handleDateChange(
    date: DateObject | null
  ) {
    setSelectedDate(date);

    if (!date) {
      setFormData((previous) => ({
        ...previous,
        broadcastDateJalali: "",
        broadcastDate: "",
      }));

      return;
    }

    const jalaliDate = date.format(
      "YYYY/MM/DD"
    );

    /*
     * تبدیل یک کپی از تاریخ شمسی به میلادی
     */
    const gregorianDate =
      new DateObject(date)
        .convert(gregorian)
        .format("YYYY-MM-DD");

    setFormData((previous) => ({
      ...previous,

      broadcastDateJalali:
        jalaliDate,

      /*
       * Backend طبق داکیومنت تاریخ ISO می‌خواهد.
       */
      broadcastDate:
        `${gregorianDate}T00:00:00Z`,
    }));

    setErrors((previous) => ({
      ...previous,

      broadcastDateJalali:
        undefined,

      broadcastDate:
        undefined,
    }));
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const validationResult =
      specificationsSchema.safeParse(
        formData
      );

    if (!validationResult.success) {
      const nextErrors: FormErrors = {};

      for (
        const issue of
          validationResult.error.issues
      ) {
        const field =
          issue.path[0] as keyof
            SpecificationsFormData;

        if (!nextErrors[field]) {
          nextErrors[field] =
            issue.message;
        }
      }

      setErrors(nextErrors);

      return;
    }

    setErrors({});
    onNext(validationResult.data);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="
        max-w-4xl mx-auto
        bg-white
        border border-gray-200
        rounded-2xl
        shadow-sm
        p-6
      "
      noValidate
    >
      <div className="mb-7">
        <h2 className="text-xl font-bold text-gray-800">
          مشخصات برنامه
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          اطلاعات اولیه برنامه را وارد کنید.
        </p>
      </div>

      <div
        className="
          grid grid-cols-1
          md:grid-cols-2
          gap-5
        "
      >
        {/* نام برنامه */}
        <div>
          <label
            htmlFor="planId"
            className="
              block mb-2
              text-sm font-semibold
              text-gray-700
            "
          >
            نام برنامه

            <span className="text-red-500 mr-1">
              *
            </span>
          </label>

          <select
            id="planId"
            name="planId"
            value={
              formData.planId ?? ""
            }
            onChange={handleInputChange}
            disabled={
              isPlanReadOnly ||
              isProgramsLoading ||
              Boolean(programsError)
            }
            className={`
              w-full h-12
              px-3
              border rounded-lg
              outline-none
              bg-white
              ${
                errors.planId
                  ? "border-red-500"
                  : "border-gray-300 focus:border-[#007fcf]"
              }
            `}
          >
            <option value="">
              {isProgramsLoading
                ? "در حال دریافت برنامه‌ها..."
                : "انتخاب برنامه"}
            </option>

            {programs.map((program) => (
              <option
                key={program.id}
                value={program.id}
              >
                {program.name}
              </option>
            ))}
          </select>

          {errors.planId && (
            <p className="mt-1 text-xs text-red-500">
              {errors.planId}
            </p>
          )}

          {programsError && (
            <p className="mt-1 text-xs text-red-500">
              {programsError}
            </p>
          )}
        </div>

        {/* تاریخ پخش */}
        <div>
          <label
            className="
              block mb-2
              text-sm font-semibold
              text-gray-700
            "
          >
            تاریخ پخش

            <span className="text-red-500 mr-1">
              *
            </span>
          </label>

          <DatePicker
            value={selectedDate}
            onChange={handleDateChange}
            calendar={persian}
            locale={persianFa}
            format="YYYY/MM/DD"
            calendarPosition="bottom-right"
            placeholder="انتخاب تاریخ پخش"
            inputClass={`
              w-full h-12
              px-3
              border rounded-lg
              outline-none
              ${
                errors.broadcastDateJalali
                  ? "border-red-500"
                  : "border-gray-300 focus:border-[#007fcf]"
              }
            `}
            containerClassName="w-full"
          />

          {errors.broadcastDateJalali && (
            <p className="mt-1 text-xs text-red-500">
              {errors.broadcastDateJalali}
            </p>
          )}
        </div>
      </div>

      {/* موضوع اصلی */}
      <div className="mt-5">
        <label
          htmlFor="mainTopic"
          className="
            block mb-2
            text-sm font-semibold
            text-gray-700
          "
        >
          موضوع اصلی برنامه

          <span className="text-red-500 mr-1">
            *
          </span>
        </label>

        <textarea
          id="mainTopic"
          name="mainTopic"
          value={formData.mainTopic}
          onChange={(event) => {
            setFormData((previous) => ({
              ...previous,

              mainTopic:
                event.target.value,
            }));

            setErrors((previous) => ({
              ...previous,

              mainTopic: undefined,
            }));
          }}
          rows={4}
          placeholder="موضوع اصلی برنامه را وارد کنید."
          className={`
            w-full
            px-3 py-3
            border rounded-lg
            outline-none
            resize-none
            ${
              errors.mainTopic
                ? "border-red-500"
                : "border-gray-300 focus:border-[#007fcf]"
            }
          `}
        />

        {errors.mainTopic && (
          <p className="mt-1 text-xs text-red-500">
            {errors.mainTopic}
          </p>
        )}
      </div>

      {/* دارای کارشناس */}
      <label
        className="
          inline-flex
          items-center
          gap-2
          mt-5
          cursor-pointer
        "
      >
        <input
          name="hasExpert"
          type="checkbox"
          checked={formData.hasExpert}
          onChange={handleInputChange}
          className="
            w-4 h-4
            accent-[#007fcf]
          "
        />

        <span className="text-sm text-gray-700">
          این برنامه دارای کارشناس است
        </span>
      </label>

      {/* دکمه بعدی */}
      <div
        className="
          flex justify-end
          mt-8 pt-5
          border-t border-gray-200
        "
      >
        <button
          type="submit"
          className="
            px-7 py-3
            rounded-lg
            bg-[#007fcf]
            text-white
            font-semibold
            hover:bg-[#006fb5]
            transition
          "
        >
          مرحله بعد
        </button>
      </div>
    </form>
  );
}