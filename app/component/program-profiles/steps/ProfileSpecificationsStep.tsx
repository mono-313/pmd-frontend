"use client";

import {
  useState,ReactNode
} from "react";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import type {
  ProfileSpecificationsData,
} from "@/app/types/program-profile";


/*
 * مدت‌های پیشنهادی از ۱۰ تا ۲۴۰ دقیقه.
 * مقدار نهایی با فرمت TimeSpan برای Backend نگهداری می‌شود.
 */
const PROGRAM_DURATION_OPTIONS =
  Array.from(
    {
      length: 24,
    },
    (_, index) =>
      formatDuration(
        (index + 1) * 10
      )
  );


interface ProfileSpecificationsStepProps {
  /*
   * اطلاعات مرحله اول از
   * FormData مرکزی Dialog
   */
  data:
    ProfileSpecificationsData;

  /*
   * به‌روزرسانی FormData مرکزی
   */
  onChange: (
    data:
      ProfileSpecificationsData
  ) => void;

  /*
   * رفتن به مرحله عوامل
   */
  onNext:
    () => void;
}


export default function ProfileSpecificationsStep({
  data,
  onChange,
  onNext,
}: ProfileSpecificationsStepProps) {
  const [
    validationError,
    setValidationError,
  ] = useState("");


  /*
   * تغییر یک فیلد در اطلاعات
   * مرحله اول
   */
  function updateField<
    Key extends
      keyof ProfileSpecificationsData
  >(
    fieldName: Key,

    value:
      ProfileSpecificationsData[Key]
  ) {
    onChange({
      ...data,

      [fieldName]:
        value,
    });


    if (validationError) {
      setValidationError("");
    }
  }


  /*
   * اعتبارسنجی مرحله اول
   */
  function handleNext() {
    const validationMessage =
      validateSpecifications(
        data
      );


    if (validationMessage) {
      setValidationError(
        validationMessage
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
            <CheckCircle2
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
              مشخصات برنامه
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-gray-500
              "
            >
              اطلاعات پایه برنامه را بررسی و مدت و ساعت شروع را تکمیل کنید.
            </p>
          </div>
        </div>
      </header>


      {/* اطلاعات غیرقابل ویرایش */}
      <div>
        <h3
          className="
            mb-4
            font-bold
            text-gray-700
          "
        >
          اطلاعات برنامه
        </h3>


        <div
          className="
            grid
            grid-cols-1
            gap-5
            md:grid-cols-2
            xl:grid-cols-3
          "
        >
          <ReadOnlyField
            label="نام برنامه"
            value={
              data.programName
            }
          />


          <ReadOnlyField
            label="موضوع برنامه"
            value={
              data.mainTopic
            }
          />


          <ReadOnlyField
            label="شماره قسمت"
            value={
              data.episodeNumber !==
              null
                ? toPersianNumber(
                    data.episodeNumber
                  )
                : "—"
            }
          />


          <ReadOnlyField
            label="تاریخ پخش"
            value={
              data.broadcastDateJalali ||
              formatJalaliDate(
                data.broadcastDate
              )
            }
            icon={
              <CalendarDays
                size={17}
              />
            }
          />


          <ReadOnlyField
            label="نحوه تولید"
            value={
              data.productionMethod
            }
          />


          <ReadOnlyField
            label="مناسبت"
            value={
              data.occasion
            }
          />


          <ReadOnlyField
            label="طبقه برنامه"
            value={
              data.floorName
            }
          />


          <ReadOnlyField
            label="درجه برنامه"
            value={
              data.programDegreeName
            }
          />


          <ReadOnlyField
            label="ساختار برنامه"
            value={
              data.programStructureName
            }
          />
        </div>
      </div>


      {/* اطلاعات قابل تکمیل */}
      <div
        className="
          mt-8
          border-t
          border-gray-200
          pt-6
        "
      >
        <h3
          className="
            mb-4
            font-bold
            text-gray-700
          "
        >
          اطلاعات قابل تکمیل
        </h3>


        <div
          className="
            grid
            grid-cols-1
            gap-5
            md:grid-cols-2
          "
        >
          {/* مدت برنامه */}
          <label className="block">
            <span
              className="
                mb-2
                block
                text-sm
                font-semibold
                text-gray-700
              "
            >
              مدت برنامه

              <span
                className="
                  mr-1
                  text-red-500
                "
              >
                *
              </span>
            </span>


            <div className="relative">
              <Clock3
                size={18}
                className="
                  pointer-events-none
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-gray-400
                "
              />


              <input
                type="text"
                inputMode="numeric"
                list="program-duration-options"
                value={
                  data.duration
                }
                onChange={(event) =>
                  updateField(
                    "duration",

                    normalizeTimeInput(
                      event.target.value
                    )
                  )
                }
                placeholder="01:00:00"
                maxLength={10}
                dir="ltr"
                className="
                  w-full
                  rounded-lg
                  border border-gray-300
                  bg-white
                  py-2.5
                  pl-3 pr-10
                  text-left
                  outline-none
                  transition
                  focus:border-[#007fcf]
                  focus:ring-2
                  focus:ring-[#007fcf]/10
                "
              />


              <datalist
                id="program-duration-options"
              >
                {PROGRAM_DURATION_OPTIONS.map(
                  (duration) => (
                    <option
                      key={duration}
                      value={duration}
                    >
                      {formatDurationLabel(
                        duration
                      )}
                    </option>
                  )
                )}
              </datalist>
            </div>


            <p
              className="
                mt-2
                text-xs
                text-gray-500
              "
            >
              یک مدت پیشنهادی را انتخاب کنید یا مدت دلخواه را با فرمت ساعت:دقیقه:ثانیه وارد کنید؛ مانند 01:30:00.
            </p>
          </label>


          {/* ساعت شروع */}
          <label className="block">
            <span
              className="
                mb-2
                block
                text-sm
                font-semibold
                text-gray-700
              "
            >
              ساعت شروع

              <span
                className="
                  mr-1
                  text-red-500
                "
              >
                *
              </span>
            </span>


            <div className="relative">
              <Clock3
                size={18}
                className="
                  pointer-events-none
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-gray-400
                "
              />


              <input
                type="time"
                step="1"
                value={
                  data.startTime
                }
                onChange={(event) =>
                  updateField(
                    "startTime",

                    normalizeTimeInput(
                      event.target.value
                    )
                  )
                }
                dir="ltr"
                className="
                  w-full
                  rounded-lg
                  border border-gray-300
                  bg-white
                  py-2.5
                  pl-3 pr-10
                  text-left
                  outline-none
                  transition
                  focus:border-[#007fcf]
                  focus:ring-2
                  focus:ring-[#007fcf]/10
                "
              />
            </div>


            <p
              className="
                mt-2
                text-xs
                text-gray-500
              "
            >
              ساعت شروع پخش برنامه را مشخص کنید.
            </p>
          </label>
        </div>


        {/* وضعیت کارشناس */}
        <div
          className="
            mt-5
            rounded-xl
            border border-blue-100
            bg-blue-50/60
            p-4
          "
        >
          <label
            className="
              flex
              items-start
              gap-3
            "
          >
            <input
              type="checkbox"
              checked={
                data.hasExpert
              }
              disabled
              className="
                mt-1
                h-4 w-4
                accent-[#007fcf]
              "
            />


            <span>
              <span
                className="
                  block
                  font-semibold
                  text-gray-800
                "
              >
                برنامه کارشناس دارد
              </span>

              <span
                className="
                  mt-1
                  block
                  text-xs
                  leading-6
                  text-gray-500
                "
              >
                این مقدار از موضوع پیش‌بینی تأییدشده دریافت شده و در این مرحله قابل تغییر نیست.
              </span>
            </span>
          </label>
        </div>
      </div>


      {/* خطای اعتبارسنجی */}
      {validationError && (
        <div
          className="
            mt-6
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


      {/* دکمه مرحله بعد */}
      <footer
        className="
          mt-8
          flex
          justify-end
          border-t
          border-gray-200
          pt-5
        "
      >
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
            shadow-sm
            transition
            hover:bg-[#006daf]
            focus:outline-none
            focus:ring-2
            focus:ring-[#007fcf]/30
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


/*
 * فیلد فقط نمایشی
 */
interface ReadOnlyFieldProps {
  label:
    string;

  value:
    string | number | null;

  icon?:
  ReactNode;
}


function ReadOnlyField({
  label,
  value,
  icon,
}: ReadOnlyFieldProps) {
  const displayValue =
    value === null ||
    value === undefined ||
    value === ""
      ? "—"
      : String(value);


  return (
    <div>
      <div
        className="
          mb-2
          flex
          items-center
          gap-2
          text-sm
          font-semibold
          text-gray-600
        "
      >
        {icon}

        <span>
          {label}
        </span>
      </div>


      <div
        className="
          min-h-11
          rounded-lg
          border border-gray-200
          bg-gray-100
          px-3 py-2.5
          text-sm
          font-semibold
          text-gray-700
        "
      >
        {displayValue}
      </div>
    </div>
  );
}


/*
 * اعتبارسنجی مرحله اول
 */
function validateSpecifications(
  data:
    ProfileSpecificationsData
): string | null {
  if (!data.forecastId.trim()) {
    return "شناسه پیش‌بینی دریافت نشده است.";
  }


  if (
    !Number.isInteger(
      data.planId
    ) ||
    data.planId <= 0
  ) {
    return "شناسه برنامه معتبر نیست.";
  }


  if (
    !Number.isInteger(
      data.networkId
    ) ||
    data.networkId <= 0
  ) {
    return "شناسه شبکه معتبر نیست.";
  }


  if (
    !Number.isInteger(
      data.networkGroupId
    ) ||
    data.networkGroupId <= 0
  ) {
    return "شناسه گروه برنامه‌ساز معتبر نیست.";
  }


  if (!data.mainTopic.trim()) {
    return "موضوع برنامه دریافت نشده است.";
  }


  if (!data.broadcastDate.trim()) {
    return "تاریخ پخش دریافت نشده است.";
  }


  if (
    Number.isNaN(
      Date.parse(
        normalizeDigits(
          data.broadcastDate
        )
      )
    )
  ) {
    return "تاریخ پخش معتبر نیست.";
  }


  if (
    !isTimeSpan(
      normalizeDigits(
        data.duration
      )
    )
  ) {
    return "مدت برنامه باید با فرمت hh:mm:ss وارد شود.";
  }


  if (
    !isClockTime(
      normalizeDigits(
        data.startTime
      )
    )
  ) {
    return "ساعت شروع باید با فرمت hh:mm:ss وارد شود.";
  }


  if (!data.productionMethod.trim()) {
    return "نحوه تولید برنامه دریافت نشده است.";
  }


  if (!data.occasion.trim()) {
    return "مناسبت برنامه دریافت نشده است.";
  }


  if (
    data.floorId === null ||
    !Number.isInteger(
      data.floorId
    ) ||
    data.floorId <= 0
  ) {
    return "طبقه برنامه معتبر نیست.";
  }


  if (!data.floorName.trim()) {
    return "نام طبقه برنامه دریافت نشده است.";
  }


  if (
    data.programDegreeId ===
      null ||
    !Number.isInteger(
      data.programDegreeId
    ) ||
    data.programDegreeId <= 0
  ) {
    return "درجه برنامه معتبر نیست.";
  }


  if (
    !data.programDegreeName
      .trim()
  ) {
    return "نام درجه برنامه دریافت نشده است.";
  }


  if (
    data.programStructureId ===
      null ||
    !Number.isInteger(
      data.programStructureId
    ) ||
    data.programStructureId <= 0
  ) {
    return "ساختار برنامه معتبر نیست.";
  }


  if (
    !data.programStructureName
      .trim()
  ) {
    return "نام ساختار برنامه دریافت نشده است.";
  }


  return null;
}


/*
 * تبدیل تعداد دقیقه به TimeSpan.
 * مثال: ۹۰ دقیقه => 01:30:00
 */
function formatDuration(
  totalMinutes: number
): string {
  const hours =
    Math.floor(
      totalMinutes / 60
    );

  const minutes =
    totalMinutes % 60;

  return (
    String(hours).padStart(
      2,
      "0"
    ) +
    ":" +
    String(minutes).padStart(
      2,
      "0"
    ) +
    ":00"
  );
}


/*
 * عنوان فارسی گزینه‌های مدت برنامه.
 */
function formatDurationLabel(
  duration: string
): string {
  const [
    hoursText,
    minutesText,
  ] = duration.split(":");

  const hours =
    Number(hoursText);

  const minutes =
    Number(minutesText);

  if (hours === 0) {
    return `${toPersianNumber(minutes)} دقیقه`;
  }

  if (minutes === 0) {
    return `${toPersianNumber(hours)} ساعت`;
  }

  return (
    `${toPersianNumber(hours)} ساعت و ` +
    `${toPersianNumber(minutes)} دقیقه`
  );
}


/*
 * TimeSpan
 *
 * مثال:
 * 01:30:00
 */
function isTimeSpan(
  value: string
): boolean {
  return (
    /^\d{2,}:[0-5]\d:[0-5]\d$/
      .test(value)
  );
}


/*
 * ساعت شبانه‌روز
 *
 * مثال:
 * 20:30:00
 */
function isClockTime(
  value: string
): boolean {
  return (
    /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/
      .test(value)
  );
}


/*
 * تبدیل مقدار input time
 * به فرمت hh:mm:ss
 */
function normalizeTimeInput(
  value: string
): string {
  const normalizedValue =
    normalizeDigits(
      value.trim()
    );


  /*
   * input type=time ممکن است
   * مقدار HH:mm برگرداند.
   */
  if (
    /^\d{2}:\d{2}$/
      .test(normalizedValue)
  ) {
    return (
      normalizedValue +
      ":00"
    );
  }


  return normalizedValue;
}


/*
 * تبدیل تاریخ میلادی Backend
 * به تاریخ شمسی
 */
function formatJalaliDate(
  value: string
): string {
  if (!value) {
    return "—";
  }


  const normalizedValue =
    normalizeDigits(value);


  const date =
    new Date(
      normalizedValue
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }


  return new Intl.DateTimeFormat(
    "fa-IR-u-ca-persian",
    {
      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit",

      timeZone:
        "UTC",
    }
  ).format(date);
}


/*
 * تبدیل اعداد انگلیسی به فارسی
 */
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


/*
 * تبدیل اعداد فارسی و عربی
 * به انگلیسی
 */
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
