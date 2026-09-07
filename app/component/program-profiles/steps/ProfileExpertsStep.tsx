"use client";

import {
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  ATTENDANCE_TYPE_OPTIONS,
} from "@/app/types/program-profile";

import type {
  AttendanceType,
  ProfileExpertData,
} from "@/app/types/program-profile";


/*
 * گزینه کارشناس برای Dropdown
 */
export interface ProfileExpertOption {
  id:
    string;

  firstName:
    string;

  lastName:
    string;
}


/*
 * گزینه محور موضوعی Forecast
 */
export interface ProfileTopicAxisOption {
  id:
    string;

  title:
    string;
}


interface ProfileExpertsStepProps {
  hasExpert:
    boolean;

  experts:
    ProfileExpertData[];

  availableExperts:
    ProfileExpertOption[];

  topicAxes:
    ProfileTopicAxisOption[];

  isExpertsLoading?:
    boolean;

  expertsError?:
    string;

  onChange: (
    experts:
      ProfileExpertData[]
  ) => void;

  onBack:
    () => void;

  onNext:
    () => void;
}


interface ExpertFormData {
  expertId:
    string;

  topicAxisId:
    string;

  duration:
    string;

  attendanceType:
    AttendanceType;

  hasPayment:
    boolean;
}


const initialExpertForm:
  ExpertFormData = {
  expertId: "",

  topicAxisId: "",

  duration:
    "00:15:00",

  attendanceType: 1,

  hasPayment:
    false,
};


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
  const [
    formData,
    setFormData,
  ] =
    useState<ExpertFormData>(
      initialExpertForm
    );

  const [
    validationError,
    setValidationError,
  ] = useState("");


  /*
   * افزودن کارشناس به FormData اصلی
   */
  function addExpert() {
    setValidationError("");


    if (!formData.expertId) {
      setValidationError(
        "انتخاب کارشناس الزامی است."
      );

      return;
    }


    if (!formData.topicAxisId) {
      setValidationError(
        "انتخاب محور موضوعی الزامی است."
      );

      return;
    }


    const normalizedDuration =
      normalizeDigits(
        formData.duration.trim()
      );


    if (
      !isTimeSpan(
        normalizedDuration
      )
    ) {
      setValidationError(
        "مدت حضور باید با فرمت hh:mm:ss وارد شود."
      );

      return;
    }


    const selectedExpert =
      availableExperts.find(
        (expert) =>
          expert.id ===
          formData.expertId
      );


    if (!selectedExpert) {
      setValidationError(
        "اطلاعات کارشناس انتخاب‌شده پیدا نشد."
      );

      return;
    }


    const selectedAxis =
      topicAxes.find(
        (axis) =>
          axis.id ===
          formData.topicAxisId
      );


    if (!selectedAxis) {
      setValidationError(
        "اطلاعات محور موضوعی انتخاب‌شده پیدا نشد."
      );

      return;
    }


    /*
     * جلوگیری از ثبت یک کارشناس
     * برای یک محور به‌صورت تکراری
     */
    const alreadyExists =
      experts.some(
        (expert) =>
          expert.expertId ===
            formData.expertId &&
          expert.topicAxisId ===
            formData.topicAxisId
      );


    if (alreadyExists) {
      setValidationError(
        "این کارشناس قبلاً برای محور انتخاب‌شده اضافه شده است."
      );

      return;
    }


    const newExpert:
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
        normalizedDuration,

      attendanceType:
        formData.attendanceType,

      hasPayment:
        formData.hasPayment,
    };


    onChange([
      ...experts,
      newExpert,
    ]);


    /*
     * پاک‌کردن فرم افزودن
     */
    setFormData(
      initialExpertForm
    );
  }


  /*
   * حذف کارشناس
   */
  function deleteExpert(
    index: number
  ) {
    onChange(
      experts.filter(
        (
          _expert,
          expertIndex
        ) =>
          expertIndex !== index
      )
    );
  }


  /*
   * رفتن به مرحله نهایی
   */
  function handleNext() {
    /*
     * اگر Forecast دارای کارشناس است،
     * حداقل یک کارشناس باید وجود داشته باشد.
     */
    if (
      hasExpert &&
      experts.length === 0
    ) {
      setValidationError(
        "برای این برنامه حداقل یک کارشناس انتخاب کنید."
      );

      return;
    }


    setValidationError("");

    onNext();
  }


  return (
    <section
      className="
        rounded-xl
        border border-gray-200
        bg-white
        p-5
        shadow-sm
      "
      dir="rtl"
    >
      {/* عنوان مرحله */}
      <header
        className="
          mb-6
          flex
          flex-wrap
          items-center
          justify-between
          gap-4
          border-b
          border-gray-200
          pb-4
        "
      >
        <div
          className="
            flex
            items-center
            gap-3
          "
        >
          <div
            className="
              flex
              h-11 w-11
              items-center
              justify-center
              rounded-full
              bg-blue-50
              text-[#007fcf]
            "
          >
            <UsersRound
              size={23}
            />
          </div>


          <div>
            <h2
              className="
                text-lg
                font-bold
                text-gray-800
              "
            >
              کارشناسان برنامه
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-gray-500
              "
            >
              کارشناسان، محور مرتبط و اطلاعات حضور آن‌ها را مشخص کنید.
            </p>
          </div>
        </div>


        <span
          className="
            rounded-full
            bg-blue-50
            px-3 py-1
            text-xs
            font-bold
            text-[#007fcf]
          "
        >
          {toPersianNumber(
            experts.length
          )}{" "}
          کارشناس
        </span>
      </header>


      {!hasExpert ? (
        <div
          className="
            rounded-xl
            border border-gray-200
            bg-gray-50
            p-6
            text-center
            text-sm
            text-gray-600
          "
        >
          طبق اطلاعات Forecast، این برنامه کارشناس ندارد.
        </div>
      ) : (
        <>
          {/* فرم افزودن کارشناس */}
          <section
            className="
              rounded-xl
              border border-blue-100
              bg-blue-50/40
              p-4
            "
          >
            <h3
              className="
                mb-4
                font-bold
                text-gray-800
              "
            >
              افزودن کارشناس
            </h3>


            <div
              className="
                grid
                grid-cols-1
                gap-4
                md:grid-cols-2
                xl:grid-cols-3
              "
            >
              {/* کارشناس */}
              <label>
                <FieldTitle>
                  کارشناس
                </FieldTitle>

                <select
                  value={
                    formData.expertId
                  }
                  disabled={
                    isExpertsLoading
                  }
                  onChange={(event) =>
                    setFormData(
                      (previous) => ({
                        ...previous,

                        expertId:
                          event.target
                            .value,
                      })
                    )
                  }
                  className={
                    inputClassName
                  }
                >
                  <option value="">
                    {isExpertsLoading
                      ? "در حال دریافت..."
                      : "انتخاب کارشناس"}
                  </option>

                  {availableExperts.map(
                    (expert) => (
                      <option
                        key={
                          expert.id
                        }
                        value={
                          expert.id
                        }
                      >
                        {getExpertName(
                          expert
                        )}
                      </option>
                    )
                  )}
                </select>
              </label>


              {/* محور موضوعی */}
              <label>
                <FieldTitle>
                  محور موضوعی
                </FieldTitle>

                <select
                  value={
                    formData
                      .topicAxisId
                  }
                  onChange={(event) =>
                    setFormData(
                      (previous) => ({
                        ...previous,

                        topicAxisId:
                          event.target
                            .value,
                      })
                    )
                  }
                  className={
                    inputClassName
                  }
                >
                  <option value="">
                    انتخاب محور
                  </option>

                  {topicAxes.map(
                    (axis) => (
                      <option
                        key={
                          axis.id
                        }
                        value={
                          axis.id
                        }
                      >
                        {axis.title}
                      </option>
                    )
                  )}
                </select>
              </label>


              {/* مدت حضور */}
              <label>
                <FieldTitle>
                  مدت حضور
                </FieldTitle>

                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  value={
                    formData.duration
                  }
                  placeholder="00:15:00"
                  onChange={(event) =>
                    setFormData(
                      (previous) => ({
                        ...previous,

                        duration:
                          event.target
                            .value,
                      })
                    )
                  }
                  className={
                    inputClassName
                  }
                />
              </label>


              {/* نحوه حضور */}
              <label>
                <FieldTitle>
                  نحوه حضور
                </FieldTitle>

                <select
                  value={
                    formData
                      .attendanceType
                  }
                  onChange={(event) =>
                    setFormData(
                      (previous) => ({
                        ...previous,

                        attendanceType:
                          Number(
                            event.target
                              .value
                          ) as
                            AttendanceType,
                      })
                    )
                  }
                  className={
                    inputClassName
                  }
                >
                  {ATTENDANCE_TYPE_OPTIONS
                    .map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {
                            option.title
                          }
                        </option>
                      )
                    )}
                </select>
              </label>


              {/* شامل هزینه */}
              <label
                className="
                  flex
                  min-h-11
                  items-center
                  gap-3
                  self-end
                  rounded-lg
                  border border-gray-300
                  bg-white
                  px-4 py-2.5
                "
              >
                <input
                  type="checkbox"
                  checked={
                    formData
                      .hasPayment
                  }
                  onChange={(event) =>
                    setFormData(
                      (previous) => ({
                        ...previous,

                        hasPayment:
                          event.target
                            .checked,
                      })
                    )
                  }
                  className="
                    h-4 w-4
                    accent-[#007fcf]
                  "
                />

                <span
                  className="
                    text-sm
                    font-semibold
                    text-gray-700
                  "
                >
                  شامل هزینه است
                </span>
              </label>


              {/* افزودن */}
              <button
                type="button"
                onClick={
                  addExpert
                }
                className="
                  inline-flex
                  min-h-11
                  items-center
                  justify-center
                  gap-2
                  self-end
                  rounded-lg
                  bg-[#007fcf]
                  px-5 py-2.5
                  font-semibold
                  text-white
                  transition
                  hover:bg-[#006daf]
                "
              >
                <Plus size={18} />

                افزودن کارشناس
              </button>
            </div>


            {expertsError && (
              <div
                className="
                  mt-4
                  rounded-lg
                  border border-red-200
                  bg-red-50
                  px-4 py-3
                  text-sm
                  text-red-700
                "
              >
                {expertsError}
              </div>
            )}
          </section>


          {/* جدول کارشناسان */}
          <div
            className="
              mt-6
              overflow-x-auto
              rounded-xl
              border border-gray-200
            "
          >
            <table
              className="
                w-full
                min-w-[950px]
                text-sm
              "
            >
              <thead
                className="
                  bg-gray-50
                  text-gray-700
                "
              >
                <tr>
                  <TableHeader>
                    ردیف
                  </TableHeader>

                  <TableHeader align="right">
                    نام کارشناس
                  </TableHeader>

                  <TableHeader align="right">
                    محور موضوعی
                  </TableHeader>

                  <TableHeader>
                    مدت حضور
                  </TableHeader>

                  <TableHeader>
                    نحوه حضور
                  </TableHeader>

                  <TableHeader>
                    هزینه
                  </TableHeader>

                  <TableHeader>
                    عملیات
                  </TableHeader>
                </tr>
              </thead>


              <tbody>
                {experts.map(
                  (
                    expert,
                    index
                  ) => (
                    <tr
                      key={
                        `${expert.expertId}` +
                        `-${expert.topicAxisId}` +
                        `-${index}`
                      }
                      className="
                        border-t
                        border-gray-100
                        text-gray-700
                        transition
                        hover:bg-blue-50/40
                      "
                    >
                      <TableCell>
                        {toPersianNumber(
                          index + 1
                        )}
                      </TableCell>

                      <TableCell align="right">
                        <div
                          className="
                            flex
                            items-center
                            gap-2
                          "
                        >
                          <div
                            className="
                              flex
                              h-8 w-8
                              items-center
                              justify-center
                              rounded-full
                              bg-blue-50
                              text-[#007fcf]
                            "
                          >
                            <UserRound
                              size={16}
                            />
                          </div>

                          <span
                            className="
                              font-semibold
                              text-gray-800
                            "
                          >
                            {
                              `${expert.firstName} ${expert.lastName}`
                                .trim()
                            }
                          </span>
                        </div>
                      </TableCell>

                      <TableCell align="right">
                        {
                          expert.topicAxisTitle
                        }
                      </TableCell>

                      <TableCell>
                        {toPersianNumber(
                          expert.duration
                        )}
                      </TableCell>

                      <TableCell>
                        {
                          getAttendanceTitle(
                            expert
                              .attendanceType
                          )
                        }
                      </TableCell>

                      <TableCell>
                        <span
                          className={`
                            rounded-full
                            px-3 py-1
                            text-xs
                            font-bold
                            ${
                              expert.hasPayment
                                ? `
                                    bg-amber-100
                                    text-amber-700
                                  `
                                : `
                                    bg-gray-100
                                    text-gray-600
                                  `
                            }
                          `}
                        >
                          {expert.hasPayment
                            ? "دارد"
                            : "ندارد"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <button
                          type="button"
                          onClick={() =>
                            deleteExpert(
                              index
                            )
                          }
                          className="
                            inline-flex
                            items-center
                            gap-1
                            rounded-lg
                            px-3 py-2
                            text-red-600
                            transition
                            hover:bg-red-50
                          "
                        >
                          <Trash2
                            size={16}
                          />

                          حذف
                        </button>
                      </TableCell>
                    </tr>
                  )
                )}


                {experts.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="
                        p-10
                        text-center
                        text-gray-500
                      "
                    >
                      هنوز کارشناسی اضافه نشده است.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}


      {validationError && (
        <div
          className="
            mt-5
            rounded-lg
            border border-red-200
            bg-red-50
            px-4 py-3
            text-sm
            text-red-700
          "
        >
          {validationError}
        </div>
      )}


      {/* دکمه‌های مراحل */}
      <footer
        className="
          mt-8
          flex
          items-center
          justify-between
          gap-3
          border-t
          border-gray-200
          pt-5
        "
      >
        <button
          type="button"
          onClick={
            onBack
          }
          className="
            inline-flex
            items-center
            gap-2
            rounded-lg
            border border-gray-300
            bg-white
            px-5 py-2.5
            font-semibold
            text-gray-700
            transition
            hover:bg-gray-50
          "
        >
          <ArrowRight
            size={18}
          />

          مرحله قبل
        </button>


        <button
          type="button"
          onClick={
            handleNext
          }
          className="
            inline-flex
            items-center
            gap-2
            rounded-lg
            bg-[#007fcf]
            px-6 py-2.5
            font-semibold
            text-white
            transition
            hover:bg-[#006daf]
          "
        >
          مرحله بعد

          <ArrowLeft
            size={18}
          />
        </button>
      </footer>
    </section>
  );
}


const inputClassName = `
  w-full
  min-h-11
  rounded-lg
  border border-gray-300
  bg-white
  px-3 py-2.5
  outline-none
  transition
  focus:border-[#007fcf]
  focus:ring-2
  focus:ring-[#007fcf]/10
  disabled:bg-gray-100
`;


function FieldTitle({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <span
      className="
        mb-2
        block
        text-sm
        font-semibold
        text-gray-700
      "
    >
      {children}

      <span
        className="
          mr-1
          text-red-500
        "
      >
        *
      </span>
    </span>
  );
}


function TableHeader({
  children,
  align = "center",
}: {
  children:
    React.ReactNode;

  align?:
    "right" | "center";
}) {
  return (
    <th
      className={`
        whitespace-nowrap
        px-4 py-4
        font-bold
        ${
          align === "right"
            ? "text-right"
            : "text-center"
        }
      `}
    >
      {children}
    </th>
  );
}


function TableCell({
  children,
  align = "center",
}: {
  children:
    React.ReactNode;

  align?:
    "right" | "center";
}) {
  return (
    <td
      className={`
        whitespace-nowrap
        px-4 py-4
        ${
          align === "right"
            ? "text-right"
            : "text-center"
        }
      `}
    >
      {children}
    </td>
  );
}


function getExpertName(
  expert:
    ProfileExpertOption
): string {
  return (
    `${expert.firstName} ${expert.lastName}`
      .trim() ||
    "کارشناس بدون نام"
  );
}


function getAttendanceTitle(
  attendanceType:
    AttendanceType
): string {
  return (
    ATTENDANCE_TYPE_OPTIONS
      .find(
        (option) =>
          option.value ===
          attendanceType
      )
      ?.title ??
    "نامشخص"
  );
}


function isTimeSpan(
  value: string
): boolean {
  return (
    /^\d{2,}:[0-5]\d:[0-5]\d$/
      .test(value)
  );
}


function toPersianNumber(
  value: string | number
): string {
  return String(value).replace(
    /\d/g,
    (digit) =>
      "۰۱۲۳۴۵۶۷۸۹"[
        Number(digit)
      ]
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
          persianDigits.indexOf(
            digit
          )
        )
    )
    .replace(
      /[٠-٩]/g,
      (digit) =>
        String(
          arabicDigits.indexOf(
            digit
          )
        )
    );
}