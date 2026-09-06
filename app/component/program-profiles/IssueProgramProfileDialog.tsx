"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  AlertCircle,
  FilePlus2,
  LoaderCircle,
  X,
} from "lucide-react";

import type {
  ForecastResponse,
} from "@/app/types/forecast";


interface IssueProgramProfileDialogProps {
  forecast:
    ForecastResponse;

  onClose:
    () => void;

  onIssued:
    (
      forecastId: string
    ) => void;
}


interface ProfileFormData {
  duration: string;

  productionMethod: string;

  occasion: string;

  floorId: string;

  floorName: string;

  programDegreeId: string;

  programDegreeName: string;

  programStructureId: string;

  programStructureName: string;

  startTime: string;
}


const initialFormData:
  ProfileFormData = {
  duration:
    "01:00:00",

  productionMethod:
    "",

  occasion:
    "",

  floorId:
    "",

  floorName:
    "",

  programDegreeId:
    "",

  programDegreeName:
    "",

  programStructureId:
    "",

  programStructureName:
    "",

  startTime:
    "00:00:00",
};


export default function IssueProgramProfileDialog({
  forecast,
  onClose,
  onIssued,
}: IssueProgramProfileDialogProps) {
  const [
    formData,
    setFormData,
  ] = useState<ProfileFormData>(
    initialFormData
  );

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  /*
   * جلوگیری از Scroll صفحه زیر Popup
   */
  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, []);


  function updateField(
    fieldName: keyof ProfileFormData,
    value: string
  ) {
    setFormData(
      (previous) => ({
        ...previous,

        [fieldName]:
          value,
      })
    );
  }


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const validationMessage =
      validateForm(
        formData
      );

    if (validationMessage) {
      setError(
        validationMessage
      );

      return;
    }

    /*
     * این اطلاعات مستقیماً از همان
     * Forecast انتخاب‌شده گرفته می‌شوند.
     */
    const requestBody = {
      forecastId:
        forecast.id,

      planId:
        forecast.planId,

      networkId:
        forecast.networkId,

      networkGroupId:
        forecast.networkGroupId,

      duration:
        normalizeTime(
          formData.duration
        ),

      broadcastDate:
        normalizeDigits(
          forecast.broadcastDate
        ),

      productionMethod:
        formData.productionMethod
          .trim(),

      occasion:
        formData.occasion
          .trim(),

      floorId:
        Number(
          formData.floorId
        ),

      floorName:
        formData.floorName
          .trim(),

      programDegreeId:
        Number(
          formData.programDegreeId
        ),

      programDegreeName:
        formData.programDegreeName
          .trim(),

      programStructureId:
        Number(
          formData.programStructureId
        ),

      programStructureName:
        formData.programStructureName
          .trim(),

      startTime:
        normalizeTime(
          formData.startTime
        ),

      /*
       * طبق مستند ارسال این دو آرایه
       * الزامی است، اما می‌توانند خالی باشند.
       */
      crewMembers:
        [],

      items:
        [],
    };

    try {
      setIsSubmitting(true);

      const response =
        await fetch(
          "/api/program-profiles/issue",
          {
            method:
              "POST",

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                requestBody
              ),
          }
        );

      const responseText =
        await response.text();

      const responseData =
        parseJsonResponse(
          responseText
        );

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            responseData
          ) ??
            `صدور شناسنامه انجام نشد. کد پاسخ: ${response.status}`
        );
      }

      onIssued(
        forecast.id
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "صدور شناسنامه انجام نشد."
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <div
      className="
        fixed inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-black/50
        p-4
      "
      dir="rtl"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="
          max-h-[92vh]
          w-full
          max-w-5xl
          overflow-y-auto
          rounded-2xl
          bg-white
          shadow-2xl
        "
      >
        <header
          className="
            sticky top-0
            z-10
            flex
            items-start
            justify-between
            border-b
            border-gray-200
            bg-white
            px-6 py-5
          "
        >
          <div>
            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <FilePlus2
                size={23}
                className="text-[#007fcf]"
              />

              <h2
                className="
                  text-xl
                  font-bold
                  text-gray-800
                "
              >
                تبدیل موضوع به شناسنامه
              </h2>
            </div>

            <p
              className="
                mt-2
                text-sm
                text-gray-500
              "
            >
              {forecast.mainTopic}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={
              isSubmitting
            }
            className="
              rounded-lg
              p-2
              text-gray-500
              transition
              hover:bg-gray-100
            "
            aria-label="بستن"
          >
            <X size={21} />
          </button>
        </header>


        <form
          onSubmit={
            handleSubmit
          }
        >
          <div
            className="
              space-y-6
              p-6
            "
          >
            {/* اطلاعات Forecast */}
            <section
              className="
                rounded-xl
                border
                border-blue-200
                bg-blue-50
                p-4
              "
            >
              <div
                className="
                  grid
                  grid-cols-1
                  gap-4
                  text-sm
                  md:grid-cols-2
                  lg:grid-cols-4
                "
              >
                <InfoField
                  label="شناسه برنامه"
                  value={
                    forecast.planId
                  }
                />

                <InfoField
                  label="شماره قسمت"
                  value={
                    forecast.episodeNumber
                  }
                />

                <InfoField
                  label="شناسه شبکه"
                  value={
                    forecast.networkId
                  }
                />

                <InfoField
                  label="گروه برنامه‌ساز"
                  value={
                    forecast.networkGroupId
                  }
                />

                <InfoField
                  label="موضوع"
                  value={
                    forecast.mainTopic
                  }
                />

                <InfoField
                  label="تاریخ پخش"
                  value={
                    formatPersianDate(
                      forecast.broadcastDate
                    )
                  }
                />
              </div>
            </section>


            {error && (
              <div
                role="alert"
                className="
                  flex
                  items-start
                  gap-3
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  p-4
                  text-red-700
                "
              >
                <AlertCircle
                  size={21}
                  className="shrink-0"
                />

                {error}
              </div>
            )}


            {/* فرم */}
            <section
              className="
                grid
                grid-cols-1
                gap-5
                md:grid-cols-2
              "
            >
              <FormInput
                label="مدت برنامه"
                value={
                  formData.duration
                }
                placeholder="01:00:00"
                direction="ltr"
                onChange={(value) =>
                  updateField(
                    "duration",
                    value
                  )
                }
              />

              <FormInput
                label="ساعت شروع برنامه"
                value={
                  formData.startTime
                }
                placeholder="20:00:00"
                direction="ltr"
                onChange={(value) =>
                  updateField(
                    "startTime",
                    value
                  )
                }
              />

              <FormInput
                label="نحوه تولید"
                value={
                  formData.productionMethod
                }
                placeholder="مثلاً زنده"
                onChange={(value) =>
                  updateField(
                    "productionMethod",
                    value
                  )
                }
              />

              <FormInput
                label="مناسبت"
                value={
                  formData.occasion
                }
                placeholder="مثلاً بدون مناسبت خاص"
                onChange={(value) =>
                  updateField(
                    "occasion",
                    value
                  )
                }
              />

              <FormInput
                label="شناسه طبقه برنامه"
                type="number"
                value={
                  formData.floorId
                }
                onChange={(value) =>
                  updateField(
                    "floorId",
                    value
                  )
                }
              />

              <FormInput
                label="نام طبقه برنامه"
                value={
                  formData.floorName
                }
                onChange={(value) =>
                  updateField(
                    "floorName",
                    value
                  )
                }
              />

              <FormInput
                label="شناسه درجه برنامه"
                type="number"
                value={
                  formData.programDegreeId
                }
                onChange={(value) =>
                  updateField(
                    "programDegreeId",
                    value
                  )
                }
              />

              <FormInput
                label="نام درجه برنامه"
                value={
                  formData.programDegreeName
                }
                onChange={(value) =>
                  updateField(
                    "programDegreeName",
                    value
                  )
                }
              />

              <FormInput
                label="شناسه ساختار برنامه"
                type="number"
                value={
                  formData.programStructureId
                }
                onChange={(value) =>
                  updateField(
                    "programStructureId",
                    value
                  )
                }
              />

              <FormInput
                label="نام ساختار برنامه"
                value={
                  formData.programStructureName
                }
                onChange={(value) =>
                  updateField(
                    "programStructureName",
                    value
                  )
                }
              />
            </section>

            <div
              className="
                rounded-xl
                border
                border-amber-200
                bg-amber-50
                p-4
                text-sm
                text-amber-700
              "
            >
              عوامل و آیتم‌های برنامه در این نسخه به‌صورت
              آرایه خالی ارسال می‌شوند؛ طبق مستند Backend
              این دو فیلد الزامی هستند ولی می‌توانند خالی باشند.
            </div>
          </div>


          <footer
            className="
              sticky bottom-0
              flex
              items-center
              justify-end
              gap-3
              border-t
              border-gray-200
              bg-white
              px-6 py-4
            "
          >
            <button
              type="button"
              onClick={onClose}
              disabled={
                isSubmitting
              }
              className="
                rounded-lg
                border
                border-gray-300
                px-5 py-2.5
                font-semibold
                text-gray-700
                transition
                hover:bg-gray-50
                disabled:opacity-50
              "
            >
              انصراف
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting
              }
              className="
                flex
                min-w-44
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-green-600
                px-5 py-2.5
                font-bold
                text-white
                transition
                hover:bg-green-700
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle
                    size={19}
                    className="animate-spin"
                  />

                  در حال ثبت...
                </>
              ) : (
                <>
                  <FilePlus2
                    size={19}
                  />

                  ثبت شناسنامه
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}


function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  direction = "rtl",
}: {
  label: string;

  value: string;

  onChange:
    (value: string) => void;

  placeholder?: string;

  type?: "text" | "number";

  direction?: "rtl" | "ltr";
}) {
  return (
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
        {label}

        <span className="mr-1 text-red-500">
          *
        </span>
      </span>

      <input
        type={type}
        min={
          type === "number"
            ? 1
            : undefined
        }
        value={value}
        placeholder={placeholder}
        dir={direction}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="
          h-11
          w-full
          rounded-lg
          border
          border-gray-300
          px-3
          outline-none
          transition
          focus:border-[#007fcf]
          focus:ring-2
          focus:ring-blue-100
        "
      />
    </label>
  );
}


function InfoField({
  label,
  value,
}: {
  label: string;

  value:
    | string
    | number
    | null
    | undefined;
}) {
  return (
    <div>
      <p className="text-gray-500">
        {label}
      </p>

      <p
        className="
          mt-1
          font-bold
          text-gray-800
        "
      >
        {value ?? "—"}
      </p>
    </div>
  );
}


function validateForm(
  value: ProfileFormData
): string | null {
  if (
    !isTimeSpan(
      value.duration
    )
  ) {
    return "مدت برنامه باید با فرمت hh:mm:ss وارد شود.";
  }

  if (
    !isTimeSpan(
      value.startTime
    )
  ) {
    return "ساعت شروع باید با فرمت hh:mm:ss وارد شود.";
  }

  if (
    !value.productionMethod.trim()
  ) {
    return "نحوه تولید الزامی است.";
  }

  if (
    !value.occasion.trim()
  ) {
    return "مناسبت الزامی است.";
  }

  if (
    !isPositiveInteger(
      value.floorId
    )
  ) {
    return "شناسه طبقه برنامه معتبر نیست.";
  }

  if (
    !value.floorName.trim()
  ) {
    return "نام طبقه برنامه الزامی است.";
  }

  if (
    !isPositiveInteger(
      value.programDegreeId
    )
  ) {
    return "شناسه درجه برنامه معتبر نیست.";
  }

  if (
    !value.programDegreeName.trim()
  ) {
    return "نام درجه برنامه الزامی است.";
  }

  if (
    !isPositiveInteger(
      value.programStructureId
    )
  ) {
    return "شناسه ساختار برنامه معتبر نیست.";
  }

  if (
    !value.programStructureName.trim()
  ) {
    return "نام ساختار برنامه الزامی است.";
  }

  return null;
}


function isPositiveInteger(
  value: string
): boolean {
  const numberValue =
    Number(
      normalizeDigits(value)
    );

  return (
    Number.isInteger(
      numberValue
    ) &&
    numberValue > 0
  );
}


function isTimeSpan(
  value: string
): boolean {
  return /^\d{2}:\d{2}:\d{2}$/.test(
    normalizeDigits(
      value.trim()
    )
  );
}


function normalizeTime(
  value: string
): string {
  return normalizeDigits(
    value.trim()
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


function formatPersianDate(
  value: string
): string {
  const date =
    new Date(
      normalizeDigits(value)
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "fa-IR",
    {
      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit",
    }
  ).format(date);
}


function parseJsonResponse(
  value: string
): unknown | null {
  if (!value.trim()) {
    return null;
  }

  try {
    return JSON.parse(
      value
    ) as unknown;
  } catch {
    return null;
  }
}


function getErrorMessage(
  value: unknown
): string | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.message ===
    "string"
  ) {
    return value.message;
  }

  if (
    typeof value.description ===
    "string"
  ) {
    return value.description;
  }

  return null;
}


function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}