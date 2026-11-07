
"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
} from "lucide-react";

import type {
  ProfileSpecificationsData,
} from "@/app/types/program-profile";


interface ProfileSpecificationsStepProps {
  data: ProfileSpecificationsData;
  maxDurationMinutes: number;

  onChange: (
    data: ProfileSpecificationsData
  ) => void;

  onNext: () => void;
}


export default function ProfileSpecificationsStep({
  data,
  maxDurationMinutes,
  onChange,
  onNext,
}: ProfileSpecificationsStepProps) {

  const [
    validationError,
    setValidationError,
  ] = useState("");

  /*
   * مقادیر موقت مدت برنامه
   * مقدار اصلی data.duration برحسب دقیقه است.
   */
  const [
    durationHoursDraft,
    setDurationHoursDraft,
  ] = useState("0");

  const [
    durationMinutesDraft,
    setDurationMinutesDraft,
  ] = useState("0");
  
  /*
   * دریافت مدت اولیه از FormData مرکزی
   */
  useEffect(() => {
    const totalMinutes = Number(data.duration);

    if (
      !Number.isInteger(totalMinutes) ||
      totalMinutes < 0
    ) {
      setDurationHoursDraft("0");
      setDurationMinutesDraft("0");
      return;
    }

    setDurationHoursDraft(
      String(Math.floor(totalMinutes / 60))
    );

    setDurationMinutesDraft(
      String(totalMinutes % 60)
    );

  }, [data.duration]);


  /*
   * تغییر یک فیلد در اطلاعات مرحله اول
   */
  function updateField<
    Key extends keyof ProfileSpecificationsData
  >(
    fieldName: Key,
    value: ProfileSpecificationsData[Key]
  ) {
    onChange({
      ...data,
      [fieldName]: value,
    });

    if (validationError) {
      setValidationError("");
    }
  }


  // /*
  //  * تبدیل ساعت و دقیقه به دقیقه
  //  * و ذخیره در فیلد duration
  //  */
  // function updateDuration(
  //   hoursText: string,
  //   minutesText: string
  // ) {
  //   setDurationHoursDraft(hoursText);
  //   setDurationMinutesDraft(minutesText);

  //   if (
  //     hoursText === "" ||
  //     minutesText === ""
  //   ) {
  //     return;
  //   }

  //   const hours = Number(hoursText);
  //   const minutes = Number(minutesText);

  //   if (
  //     !Number.isInteger(hours) ||
  //     !Number.isInteger(minutes) ||
  //     hours < 0 ||
  //     minutes < 0 ||
  //     minutes > 59
  //   ) {
  //     return;
  //   }

  //   const totalMinutes =
  //     hours * 60 + minutes;

  //   updateField(
  //     "duration",
  //     String(totalMinutes)
  //   );
  // }


  // /*
  //  * نهایی کردن مقدار مدت هنگام خروج از ورودی
  //  */
  // function commitDuration() {
  //   const hours =
  //     durationHoursDraft === ""
  //       ? 0
  //       : Math.max(
  //           0,
  //           Math.floor(Number(durationHoursDraft))
  //         );

  //   const minutes =
  //     durationMinutesDraft === ""
  //       ? 0
  //       : Math.min(
  //           59,
  //           Math.max(
  //             0,
  //             Math.floor(Number(durationMinutesDraft))
  //           )
  //         );

  //   if (
  //     !Number.isFinite(hours) ||
  //     !Number.isFinite(minutes)
  //   ) {
  //     return;
  //   }

  //   setDurationHoursDraft(String(hours));
  //   setDurationMinutesDraft(String(minutes));

  //   updateField(
  //     "duration",
  //     String(hours * 60 + minutes)
  //   );
  // }

  
function restoreMaximumDuration() {
  const safeMaximum = Math.max(
    0,
    Math.floor(maxDurationMinutes)
  );

  const hours = Math.floor(safeMaximum / 60);
  const minutes = safeMaximum % 60;

  setDurationHoursDraft(String(hours));
  setDurationMinutesDraft(String(minutes));

  onChange({
    ...data,
    duration: String(safeMaximum),
  });

  setValidationError(
    "مدت برنامه نمی‌تواند از مدت طرح بیشتر باشد. مقدار به مدت اولیه طرح بازگردانده شد."
  );
}


/*
 * تبدیل ساعت و دقیقه به دقیقه
 * و کنترل سقف مدت اولیه وب‌سرویس
 */
function updateDuration(
  hoursText: string,
  minutesText: string
) {
  setDurationHoursDraft(hoursText);
  setDurationMinutesDraft(minutesText);

  if (
    hoursText === "" ||
    minutesText === ""
  ) {
    return;
  }

  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return;
  }

  const totalMinutes = hours * 60 + minutes;

  if (
    maxDurationMinutes > 0 &&
    totalMinutes > maxDurationMinutes
  ) {
    restoreMaximumDuration();
    return;
  }

  onChange({
    ...data,
    duration: String(totalMinutes),
  });

  setValidationError("");
}


/*
 * نهایی کردن مدت هنگام خروج از ورودی
 */
function commitDuration() {
  const hours =
    durationHoursDraft === ""
      ? 0
      : Number(durationHoursDraft);

  const minutes =
    durationMinutesDraft === ""
      ? 0
      : Number(durationMinutesDraft);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    minutes < 0
  ) {
    restoreMaximumDuration();
    return;
  }

  const normalizedMinutes = Math.min(minutes, 59);
  const totalMinutes =
    hours * 60 + normalizedMinutes;

  if (
    maxDurationMinutes > 0 &&
    totalMinutes > maxDurationMinutes
  ) {
    restoreMaximumDuration();
    return;
  }

  setDurationHoursDraft(String(hours));
  setDurationMinutesDraft(String(normalizedMinutes));

  onChange({
    ...data,
    duration: String(totalMinutes),
  });
}


  /*
   * اعتبارسنجی مرحله اول
   */
  
function handleNext() {
  const hours =
    durationHoursDraft === ""
      ? 0
      : Number(durationHoursDraft);

  const minutes =
    durationMinutesDraft === ""
      ? 0
      : Number(durationMinutesDraft);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    minutes < 0 ||
    minutes > 59
  ) {
    setValidationError(
      "مدت برنامه را به‌درستی وارد کنید."
    );
    return;
  }

  const totalMinutes = hours * 60 + minutes;

  if (
    maxDurationMinutes > 0 &&
    totalMinutes > maxDurationMinutes
  ) {
    restoreMaximumDuration();
    return;
  }

  const startTimeParts = getClockParts(data.startTime);
  const isStartTimeEmpty =
    startTimeParts.hours === 0 &&
    startTimeParts.minutes === 0;

  if (totalMinutes <= 0 || isStartTimeEmpty) {
    setValidationError(
      "مدت برنامه یا ساعت وارد نشده است."
    );
    return;
  }

  const nextData = {
    ...data,
    duration: String(totalMinutes),
  };

  const validationMessage =
    validateSpecifications(nextData);

  if (validationMessage) {
    setValidationError(validationMessage);
    return;
  }

  setDurationHoursDraft(String(hours));
  setDurationMinutesDraft(String(minutes));
  setValidationError("");

  onChange(nextData);
  onNext();
}



  /*
   * نمایش مدت به شکل ساعت و دقیقه
   */
  const previewHours =
    durationHoursDraft === ""
      ? 0
      : Math.max(
          0,
          Number(durationHoursDraft) || 0
        );

  const previewMinutes =
    durationMinutesDraft === ""
      ? 0
      : Math.max(
          0,
          Number(durationMinutesDraft) || 0
        );


  return (
    <section
      className="
        rounded-xl
        border border-gray-200
        bg-white
        p-4
        shadow-sm
      "
      dir="rtl"
    >

      {/* عنوان مرحله */}
      <header
        className="
          mb-4
          border-b
          border-gray-200
          pb-3
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
            <CheckCircle2 size={23} />
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
            gap-x-5
            gap-y-3
            md:grid-cols-2
            xl:grid-cols-3
          "
        >
          <ReadOnlyField
            label="نام برنامه"
            value={data.programName}
          />

          <ReadOnlyField
            label="موضوع برنامه"
            value={data.mainTopic}
          />

          <ReadOnlyField
            label="شماره قسمت"
            value={
              data.episodeNumber !== null
                ? toPersianNumber(data.episodeNumber)
                : "—"
            }
          />

          <ReadOnlyField
            label="تاریخ پخش"
            value={
              data.broadcastDateJalali ||
              formatJalaliDate(data.broadcastDate)
            }
            icon={<CalendarDays size={17} />}
          />

          <ReadOnlyField
            label="نحوه تولید"
            value={data.productionMethod}
          />

          <ReadOnlyField
            label="مناسبت"
            value={data.occasion}
          />

          <ReadOnlyField
            label="طبقه برنامه"
            value={data.floorName}
          />

          <ReadOnlyField
            label="درجه برنامه"
            value={data.programDegreeName}
          />

          <ReadOnlyField
            label="ساختار برنامه"
            value={data.programStructureName}
          />
        </div>
      </div>


      {/* اطلاعات قابل تکمیل */}
      <div
        className="
          mt-5
          border-t
          border-gray-200
          pt-4
        "
      >
        <h3
          className="
            mb-3
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
            gap-4
            md:grid-cols-2
          "
        >

          {/* مدت برنامه */}
          <div>
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

              <span className="mr-1 text-red-500">
                *
              </span>
            </span>

            <div
              className="
                flex
                h-11
                items-center
                gap-3
                rounded-lg
                border border-gray-300
                bg-white
                px-3
                transition
                focus-within:border-[#007fcf]
                focus-within:ring-2
                focus-within:ring-[#007fcf]/10
              "
              dir="ltr"
            >
              <Clock3
                size={18}
                className="shrink-0 text-gray-400"
              />

              <div className="flex flex-1 items-center justify-center gap-2">

                {/* ساعت */}
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={durationHoursDraft}
                  onChange={(event) => {
                    const value =
                      event.target.value;

                    if (
                      value !== "" &&
                      (
                        !/^\d+$/.test(value) ||
                        Number(value) > 999
                      )
                    ) {
                      return;
                    }

                    updateDuration(
                      value,
                      durationMinutesDraft
                    );
                  }}
                  onBlur={commitDuration}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.currentTarget.blur();
                    }
                  }}
                  aria-label="ساعت مدت برنامه"
                  className="
                    h-9
                    w-16
                    rounded-md
                    border border-gray-200
                    bg-gray-50
                    text-center
                    font-bold
                    text-gray-800
                    outline-none
                    focus:border-[#007fcf]
                  "
                />

                <span
                  className="
                    text-xs
                    text-gray-500
                  "
                >
                  ساعت
                </span>


                <span className="font-bold text-gray-400">
                  :
                </span>


                {/* دقیقه */}
                <input
                  type="number"
                  min={0}
                  max={59}
                  step={1}
                  inputMode="numeric"
                  value={durationMinutesDraft}
                  onChange={(event) => {
                    const value =
                      event.target.value;

                    if (
                      value !== "" &&
                      (
                        !/^\d+$/.test(value) ||
                        Number(value) > 59
                      )
                    ) {
                      return;
                    }

                    updateDuration(
                      durationHoursDraft,
                      value
                    );
                  }}
                  onBlur={commitDuration}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.currentTarget.blur();
                    }
                  }}
                  aria-label="دقیقه مدت برنامه"
                  className="
                    h-9
                    w-16
                    rounded-md
                    border border-gray-200
                    bg-gray-50
                    text-center
                    font-bold
                    text-gray-800
                    outline-none
                    focus:border-[#007fcf]
                  "
                />

                <span
                  className="
                    text-xs
                    text-gray-500
                  "
                >
                  دقیقه
                </span>

              </div>
            </div>

            <p
              className="
                mt-2
                text-xs
                text-gray-500
              "
            >
              مدت برنامه:{" "}
              <span className="font-semibold text-[#007fcf]">
                {toPersianNumber(previewHours)}
                {" ساعت و "}
                {toPersianNumber(previewMinutes)}
                {" دقیقه"}
              </span>
            </p>
          </div>


          {/* ساعت شروع */}
          <div>
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

              <span className="mr-1 text-red-500">
                *
              </span>
            </span>

            <div
              className="
                flex
                h-11
                items-center
                justify-center
                gap-2
                rounded-lg
                border border-gray-300
                bg-white
                px-3
                transition
                focus-within:border-[#007fcf]
                focus-within:ring-2
                focus-within:ring-[#007fcf]/10
              "
              dir="ltr"
            >
              <Clock3
                size={18}
                className="shrink-0 text-gray-400"
              />

              <span className="text-xs text-gray-500">
                ساعت
              </span>

              <TimePartInput
                label="ساعت"
                value={
                  getClockParts(data.startTime).hours
                }
                max={23}
                onChange={(hours) =>
                  updateField(
                    "startTime",
                    buildClockTime(
                      hours,
                      getClockParts(data.startTime).minutes
                    )
                  )
                }
              />

              <span className="text-lg font-bold text-gray-500">
                :
              </span>

              <span className="text-xs text-gray-500">
                دقیقه
              </span>

              <TimePartInput
                label="دقیقه"
                value={
                  getClockParts(data.startTime).minutes
                }
                max={59}
                onChange={(minutes) =>
                  updateField(
                    "startTime",
                    buildClockTime(
                      getClockParts(data.startTime).hours,
                      minutes
                    )
                  )
                }
              />
            </div>
          </div>

        </div>


        {/* وضعیت کارشناس */}
        <div
          className="
            mt-3
            rounded-xl
            border border-blue-100
            bg-blue-50/60
            p-3
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
              checked={data.hasExpert}
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
                  leading-5
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
            mt-3
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
          mt-4
          flex
          justify-end
          border-t
          border-gray-200
          pt-3
        "
      >
        <button
          type="button"
          onClick={handleNext}
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

          <ArrowLeft size={18} />
        </button>
      </footer>

    </section>
  );
}


/*
 * فیلد فقط نمایشی
 */
interface ReadOnlyFieldProps {
  label: string;

  value: string | number | null;

  icon?: ReactNode;
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
          mb-1
          flex
          items-center
          gap-2
          text-sm
          font-semibold
          text-gray-600
        "
      >
        {icon}

        <span>{label}</span>
      </div>

      <div
        className="
          min-h-9
          rounded-lg
          border border-gray-200
          bg-gray-100
          px-3 py-2
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


interface TimePartInputProps {
  label: string;

  value: number;

  max: number;

  onChange: (
    value: number
  ) => void;
}


/*
 * ورودی ساعت یا دقیقه با امکان:
 * ورود دستی، افزایش و کاهش با دکمه‌ها.
 */
function TimePartInput({
  label,
  value,
  max,
  onChange,
}: TimePartInputProps) {

  const inputRef =
    useRef<HTMLInputElement | null>(null);

  const [
    draftValue,
    setDraftValue,
  ] = useState(
    String(value).padStart(2, "0")
  );

  useEffect(() => {
    if (
      document.activeElement !==
      inputRef.current
    ) {
      setDraftValue(
        String(value).padStart(2, "0")
      );
    }
  }, [value]);


  function commitDraftValue() {
    const normalized =
      normalizeDigits(draftValue)
        .replace(/\D/g, "");

    const nextValue =
      normalized
        ? Math.min(
            Number(normalized),
            max
          )
        : 0;

    setDraftValue(
      String(nextValue).padStart(2, "0")
    );

    onChange(nextValue);
  }


  function increaseValue() {
    const nextValue =
      value >= max
        ? 0
        : value + 1;

    setDraftValue(
      String(nextValue).padStart(2, "0")
    );

    onChange(nextValue);
  }


  function decreaseValue() {
    const nextValue =
      value <= 0
        ? max
        : value - 1;

    setDraftValue(
      String(nextValue).padStart(2, "0")
    );

    onChange(nextValue);
  }


  function handleManualChange(
    inputValue: string
  ) {
    const normalizedValue =
      normalizeDigits(inputValue)
        .replace(/\D/g, "");

    setDraftValue(
      normalizedValue.slice(0, 2)
    );
  }


  return (
    <div className="text-center">
      <div
        className="
          flex
          h-9
          overflow-hidden
          rounded-md
          border border-gray-300
          bg-white
        "
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={draftValue}
          onFocus={(event) =>
            event.currentTarget.select()
          }
          onChange={(event) =>
            handleManualChange(
              event.target.value
            )
          }
          onBlur={commitDraftValue}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              increaseValue();
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              decreaseValue();
            }
          }}
          aria-label={label}
          className="
            h-8 w-11
            border-0
            bg-transparent
            text-center
            text-base
            font-bold
            text-gray-800
            outline-none
          "
        />

        <div
          className="
            flex
            w-7
            flex-col
            border-l
            border-gray-200
          "
        >
          <button
            type="button"
            onClick={increaseValue}
            aria-label={`افزایش ${label}`}
            className="
              flex flex-1
              items-center
              justify-center
              text-gray-500
              transition
              hover:bg-blue-50
              hover:text-[#007fcf]
            "
          >
            <ChevronUp size={13} />
          </button>

          <button
            type="button"
            onClick={decreaseValue}
            aria-label={`کاهش ${label}`}
            className="
              flex flex-1
              items-center
              justify-center
              border-t
              border-gray-200
              text-gray-500
              transition
              hover:bg-blue-50
              hover:text-[#007fcf]
            "
          >
            <ChevronDown size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}


/*
 * استخراج ساعت و دقیقه از ساعت شروع
 */
function getClockParts(
  value: string
): {
  hours: number;
  minutes: number;
} {
  const [
    hoursText = "0",
    minutesText = "0",
  ] = normalizeDigits(value).split(":");

  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  return {
    hours:
      Number.isFinite(hours)
        ? Math.min(Math.max(hours, 0), 23)
        : 0,

    minutes:
      Number.isFinite(minutes)
        ? Math.min(Math.max(minutes, 0), 59)
        : 0,
  };
}


/*
 * ساخت ساعت شروع با فرمت hh:mm:ss
 */
function buildClockTime(
  hours: number,
  minutes: number
): string {
  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0") +
    ":00"
  );
}


/*
 * اعتبارسنجی مرحله اول
 */
function validateSpecifications(
  data: ProfileSpecificationsData
): string | null {

  if (!data.forecastId.trim()) {
    return "شناسه پیش‌بینی دریافت نشده است.";
  }


  if (
    !Number.isInteger(data.planId) ||
    data.planId <= 0
  ) {
    return "شناسه برنامه معتبر نیست.";
  }


  if (
    !Number.isInteger(data.networkId) ||
    data.networkId <= 0
  ) {
    return "شناسه شبکه معتبر نیست.";
  }


  if (
    data.networkGroupId === null ||
    !Number.isInteger(data.networkGroupId) ||
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
        normalizeDigits(data.broadcastDate)
      )
    )
  ) {
    return "تاریخ پخش معتبر نیست.";
  }


  /*
   * مدت برنامه برحسب دقیقه است.
   */
  const durationMinutes =
    Number(data.duration);

  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes <= 0
  ) {
    return "مدت برنامه باید بیشتر از صفر دقیقه باشد.";
  }


  /*
   * ساعت شروع همچنان با فرمت hh:mm:ss است.
   */
  if (
    !isClockTime(
      normalizeDigits(data.startTime)
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
    !Number.isInteger(data.floorId) ||
    data.floorId <= 0
  ) {
    return "طبقه برنامه معتبر نیست.";
  }


  if (!data.floorName.trim()) {
    return "نام طبقه برنامه دریافت نشده است.";
  }


  if (
    data.programDegreeId === null ||
    !Number.isInteger(data.programDegreeId) ||
    data.programDegreeId <= 0
  ) {
    return "درجه برنامه معتبر نیست.";
  }


  if (!data.programDegreeName.trim()) {
    return "نام درجه برنامه دریافت نشده است.";
  }


  if (
    data.programStructureId === null ||
    !Number.isInteger(data.programStructureId) ||
    data.programStructureId <= 0
  ) {
    return "ساختار برنامه معتبر نیست.";
  }


  if (!data.programStructureName.trim()) {
    return "نام ساختار برنامه دریافت نشده است.";
  }


  return null;
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
 * تبدیل تاریخ میلادی Backend
 * به تاریخ شمسی بدون جابه‌جایی روز
 */
function formatJalaliDate(
  value: string
): string {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return "—";
  }

  const normalizedValue =
    normalizeDigits(value.trim());

  const dateMatch =
    normalizedValue.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})/
    );

  if (!dateMatch) {
    return "—";
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);

  // اعتبارسنجی اجزای تاریخ
  const date = new Date(
    Date.UTC(year, month - 1, day, 12)
  );

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "fa-IR-u-ca-persian",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
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
