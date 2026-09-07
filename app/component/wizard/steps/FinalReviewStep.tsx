"use client";

import {
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  LoaderCircle,
  Pencil,
  Send,
  UserRound,
  XCircle,
} from "lucide-react";

import type {
  Program,
  WizardFormData,
} from "@/app/types/wizard";


import {
  getUserSession,
} from "@/app/lib/storage";


import type {
  ApiErrorResponse,
  FinalSubmitRequest,
  FinalSubmitResponse,
} from "@/app/types/forecast";

interface FinalReviewStepProps {
  wizardData: WizardFormData;

  programs: Program[];

  onBack: () => void;


  /*جهت انتقال با کلیک روی هر مرحله برای ویرایش
   */
  onEditStep: (
    step: number
  ) => void;
}

export default function FinalReviewStep({
  wizardData,
  programs,
  onBack,
  onEditStep,
}: FinalReviewStepProps) {
  const [
    showConfirmModal,
    setShowConfirmModal,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    submitError,
    setSubmitError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    trackingId,
    setTrackingId,
  ] = useState("");

  const selectedProgram =
    programs.find(
      (program) =>
        program.id ===
        wizardData.specifications
          .planId
    );

  /*
   * اعتبارسنجی نهایی پیش از بازکردن Modal
   */
  function handleOpenConfirmation() {
    setSubmitError("");


    const planId =
  wizardData.specifications
    .planId;


const selectedProgram =
  programs.find(
    (program) =>
      program.id ===
      planId
  );

    
    if (
      wizardData.topics.length === 0
    ) {
      setSubmitError(
        "حداقل یک موضوع باید ثبت شده باشد."
      );

      return;
    }

    if (
      wizardData.specifications
        .hasExpert &&
      wizardData.experts.length === 0
    ) {
      setSubmitError(
        "برای برنامه دارای کارشناس، حداقل یک کارشناس انتخاب کنید."
      );

      return;
    }

    setShowConfirmModal(true);
  }
async function handleFinalSubmit() {
  setIsSubmitting(true);
  setSubmitError("");
  setSuccessMessage("");

  try {
    const planId =
      wizardData.specifications.planId;

    if (
      typeof planId !== "number" ||
      !Number.isFinite(planId) ||
      planId <= 0
    ) {
      throw new Error(
        "شناسه برنامه انتخاب‌شده معتبر نیست."
      );
    }

    const selectedProgram =
      programs.find(
        (program) =>
          program.id === planId
      );

    if (!selectedProgram) {
      throw new Error(
        "برنامه انتخاب‌شده در فهرست برنامه‌های مجاز وجود ندارد."
      );
    }

    const session =
      getUserSession();

    if (!session) {
      throw new Error(
        "نشست کاربری معتبر نیست. دوباره وارد سامانه شوید."
      );
    }


    const networkId =
      selectedProgram.networkId;

    const networkGroupId =
      session.networkGroupId;

    if (
      typeof networkId !== "number" ||
      !Number.isFinite(networkId) ||
      networkId <= 0
    ) {
      throw new Error(
        "شبکه برنامه انتخاب‌شده معتبر نیست."
      );
    }

    if (
      typeof networkGroupId !== "number" ||
      !Number.isFinite(networkGroupId) ||
      networkGroupId <= 0
    ) {
      throw new Error(
        "گروه برنامه‌ساز کاربر تعیین نشده است."
      );
    }

    const mainTopic =
      wizardData.specifications
        .mainTopic.trim();

    if (!mainTopic) {
      throw new Error(
        "موضوع اصلی برنامه الزامی است."
      );
    }

    const topicAxes =
      wizardData.topics
        .map((topic) =>
          topic.title.trim()
        )
        .filter(
          (title) =>
            title.length > 0
        );

    if (topicAxes.length === 0) {
      throw new Error(
        "حداقل یک موضوع پیشنهادی وارد کنید."
      );
    }

    const normalizedBroadcastDate =
      normalizeDigits(
        wizardData.specifications
          .broadcastDate
          .trim()
      );

    const parsedBroadcastDate =
      new Date(
        normalizedBroadcastDate
      );

    if (
      !normalizedBroadcastDate ||
      Number.isNaN(
        parsedBroadcastDate.getTime()
      )
    ) {
      throw new Error(
        "تاریخ پخش معتبر نیست."
      );
    }

    const hasExpert =
      wizardData.specifications
        .hasExpert;

    const expertIds =
      hasExpert
        ? wizardData.experts.map(
            (expert) =>
              expert.id
          )
        : [];

    if (
      hasExpert &&
      expertIds.length === 0
    ) {
      throw new Error(
        "حداقل یک کارشناس انتخاب کنید."
      );
    }

    const requestBody:
      FinalSubmitRequest = {
      planId,
      networkId,
      networkGroupId,
      broadcastDate:
        parsedBroadcastDate
          .toISOString(),
      mainTopic,
      hasExpert,
      topicAxes,
      expertIds,
      // فعلاً فقط Draft
      submitAfterCreate: false,
    };

    console.log(
      "FINAL FORECAST REQUEST:",
      requestBody
    );

    //response
    const response =
      await fetch(
        "/api/forecasts",
        {
          method: "POST",

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

    console.log(
      "FINAL FORECAST RESPONSE:",
      {
        status:
          response.status,
        body:
          responseText,
      }
    );

    if (!responseText.trim()) {
      throw new Error(
        `سرور پاسخ خالی برگرداند. کد پاسخ: ${response.status}`
      );
    }

    const responseData =
      parseJsonResponse(
        responseText
      );

    if (!responseData) {
      throw new Error(
        `پاسخ سرور JSON معتبر نیست. کد پاسخ: ${response.status}`
      );
    }

    if (!response.ok) {
      const apiError =
        responseData as
          ApiErrorResponse;

      throw new Error(
        apiError.message ||
          `ایجاد Forecast انجام نشد. کد پاسخ Backend: ${response.status}`
      );
    }

    if (
      !isFinalSubmitResponse(
        responseData
      )
    ) {
      console.error(
        "Invalid final submit response:",
        responseData
      );

      throw new Error(
        "ساختار پاسخ موفق ثبت Forecast معتبر نیست."
      );
    }

    setShowConfirmModal(false);

    setSuccessMessage(
      responseData.message &&
        "ثبت با موفقیت انجام شد؛ جهت ادامه فرایند به لیست پیش‌بینی‌ها مراجعه نمایید. "
    );

    setTrackingId(
      responseData.forecast.id
    );
  } catch (error) {
    console.error(
      "Final forecast submit error:",
      error
    );

    setShowConfirmModal(false);

    setSubmitError(
      error instanceof Error
        ? error.message
        : "ثبت پیش‌بینی انجام نشد."
    );
  } finally {
    setIsSubmitting(false);
  }
}

  return (
    <>
      <section
        className="
          max-w-5xl mx-auto
          bg-white
          border border-gray-200
          rounded-2xl
          shadow-sm
          p-6
        "
      >
        {/* عنوان */}
        <header className="mb-7">
          <h2
            className="
              text-xl
              font-bold
              text-gray-800
            "
          >
            بازبینی و تأیید نهایی
          </h2>

          <p
            className="
              mt-2
              text-sm
              text-gray-500
            "
          >
            پیش از ثبت نهایی، اطلاعات واردشده را بررسی کنید.
          </p>
        </header>

        {/* پیام موفقیت */}
        {successMessage && (
          <div
            className="
              mb-6
              flex items-start
              gap-3
              p-4
              border
              border-green-200
              bg-green-50
              rounded-xl
              text-green-700
            "
          >
            <CheckCircle2
              size={22}
              className="shrink-0"
            />

            <div>
              <p className="font-semibold">
                {successMessage}
              </p>
              
              {/* {trackingId && (
                <p className="mt-1 text-sm">
                  شناسه پیگیری:

                  <span
                    className="
                      mr-2
                      font-mono
                    "
                    dir="ltr"
                  >
                    {trackingId}
                  </span>
                </p>
              )} */}

              
            </div>
          </div>
        )}

        {/* پیام خطا */}
        {submitError && (
          <div
            className="
              mb-6
              flex items-start
              gap-3
              p-4
              border
              border-red-200
              bg-red-50
              rounded-xl
              text-red-700
            "
            role="alert"
          >
            <AlertCircle
              size={21}
              className="shrink-0"
            />

            <p>{submitError}</p>
          </div>
        )}

        {/* جدول مشخصات برنامه */}
        <ReviewSection
          title="مشخصات برنامه"
          onEdit={() =>
            onEditStep(1)
          }
        >
          <table className={tableClass}>
            <tbody>
              <ReviewRow
                label="نام برنامه"
                value={
                  selectedProgram?.name ||
                  "انتخاب نشده"
                }
              />

              <ReviewRow
                label="موضوع اصلی"
                value={
                  wizardData
                    .specifications
                    .mainTopic
                }
              />

              <ReviewRow
                label="تاریخ پخش"
                value={
                  wizardData
                    .specifications
                    .broadcastDateJalali
                }
              />

              <ReviewRow
                label="دارای کارشناس"
                value={
                  wizardData
                    .specifications
                    .hasExpert
                    ? "بله"
                    : "خیر"
                }
              />
            </tbody>
          </table>
        </ReviewSection>

        {/* جدول موضوعات */}
        <ReviewSection
          title="محورهای موضوعی"
          onEdit={() =>
            onEditStep(2)
          }
        >
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr className="bg-gray-50">
                  <th className={tableHeaderClass}>
                    ردیف
                  </th>

                  <th className={tableHeaderClass}>
                    موضوع
                  </th>

                  <th className={tableHeaderClass}>
                    تاریخ ثبت
                  </th>

                  <th className={tableHeaderClass}>
                    وضعیت
                  </th>
                </tr>
              </thead>

              <tbody>
                {wizardData.topics.map(
                  (topic, index) => (
                    <tr
                      key={topic.id}
                      className="
                        border-t
                        border-gray-200
                      "
                    >
                      <td className={tableCellClass}>
                        {index + 1}
                      </td>

                      <td
                        className={`
                          ${tableCellClass}
                          font-semibold
                          text-gray-800
                        `}
                      >
                        {topic.title}
                      </td>

                      <td className={tableCellClass}>
                        {topic.registeredAt}
                      </td>

                      <td className={tableCellClass}>
                        <span
                          className="
                            inline-flex
                            px-3 py-1
                            rounded-full
                            bg-yellow-100
                            text-yellow-700
                            text-xs
                            font-semibold
                          "
                        >
                          پیش‌نویس
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </ReviewSection>

        {/* جدول کارشناسان */}
        <ReviewSection
          title="کارشناسان برنامه"
          onEdit={() =>
            onEditStep(3)
          }
        >
          {!wizardData.specifications
            .hasExpert ? (
            <div
              className="
                p-5
                bg-gray-50
                text-gray-600
                text-sm
              "
            >
              این برنامه بدون کارشناس ثبت خواهد شد.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="bg-gray-50">
                    <th className={tableHeaderClass}>
                      ردیف
                    </th>

                    <th className={tableHeaderClass}>
                      نام کارشناس
                    </th>

                    <th className={tableHeaderClass}>
                      تخصص
                    </th>

                    <th className={tableHeaderClass}>
                      کد ملی
                    </th>

                    <th className={tableHeaderClass}>
                      محل کار
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {wizardData.experts.map(
                    (expert, index) => (
                      <tr
                        key={expert.id}
                        className="
                          border-t
                          border-gray-200
                        "
                      >
                        <td className={tableCellClass}>
                          {index + 1}
                        </td>

                        <td
                          className={`
                            ${tableCellClass}
                            font-semibold
                            text-gray-800
                          `}
                        >
                          {expert.firstName}
                        </td>
                        <td
                          className={`
                            ${tableCellClass}
                            font-semibold
                            text-gray-800
                          `}
                        >
                          {expert.lastName}
                        </td>

                        <td className={tableCellClass}>
                          {expert.specialty}
                        </td>

                        <td className={tableCellClass}>
                          {expert.nationalCode ||
                            "—"}
                        </td>

                        <td className={tableCellClass}>
                          {expert.workplace ||
                            "—"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </ReviewSection>

        {/* دکمه‌های پایین صفحه */}
        <footer
          className="
            mt-8 pt-5
            border-t
            border-gray-200
            flex flex-col-reverse
            sm:flex-row
            items-center
            justify-between
            gap-3
          "
        >
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="
              w-full sm:w-auto
              px-6 py-3
              border
              border-gray-300
              rounded-lg
              text-gray-700
              hover:bg-gray-50
              disabled:opacity-50
            "
          >
            مرحله قبل
          </button>

          <button
            type="button"
            onClick={
              handleOpenConfirmation
            }
            disabled={
              isSubmitting ||
              Boolean(successMessage)
            }
            className="
              w-full sm:w-auto
              px-7 py-3
              rounded-lg
              bg-green-600
              text-white
              font-semibold
              flex items-center
              justify-center
              gap-2
              hover:bg-green-700
              transition
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            <CheckSquare size={19} />

            تأیید نهایی و ارسال
          </button>
        </footer>
      </section>

      {/* Modal تأیید نهایی */}
      {showConfirmModal && (
        <div
          className="
            fixed inset-0
            z-50
            flex items-center
            justify-center
            bg-black/40
            backdrop-blur-sm
            px-4
          "
        >
          <div
            className="
              w-full max-w-md
              bg-white
              rounded-2xl
              shadow-2xl
              p-6
            "
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <div
              className="
                w-14 h-14
                mx-auto
                rounded-full
                bg-green-100
                text-green-600
                flex items-center
                justify-center
              "
            >
              <Send size={24} />
            </div>

            <h3
              id="confirm-title"
              className="
                mt-5
                text-lg
                font-bold
                text-center
                text-gray-800
              "
            >
              تأیید ثبت نهایی
            </h3>

            <p
              className="
                mt-3
                text-sm
                text-center
                text-gray-600
                leading-7
              "
            >
              آیا از ثبت و ارسال اطلاعات برنامه اطمینان دارید؟
            </p>
{/* 
            <p
              className="
                mt-2
                text-xs
                text-center
                text-gray-500
              "
            >
              اطلاعات پس از ثبت برای بررسی ارسال خواهد شد.
            </p> */}

            <div
              className="
                mt-7
                grid grid-cols-2
                gap-3
              "
            >
              {/* انتخاب خیر */}
              <button
                type="button"
                onClick={() =>
                  setShowConfirmModal(false)
                }
                disabled={isSubmitting}
                className="
                  px-5 py-3
                  border
                  border-gray-300
                  rounded-lg
                  text-gray-700
                  flex items-center
                  justify-center
                  gap-2
                  hover:bg-gray-50
                  disabled:opacity-50
                "
              >
                <XCircle size={18} />

                خیر، بازگشت
              </button>

              {/* انتخاب بله */}
              <button
                type="button"
                onClick={
                  handleFinalSubmit
                }
                disabled={isSubmitting}
                className="
                  px-5 py-3
                  rounded-lg
                  bg-green-600
                  text-white
                  flex items-center
                  justify-center
                  gap-2
                  hover:bg-green-700
                  disabled:opacity-60
                  disabled:cursor-wait
                "
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle
                      size={19}
                      className="animate-spin"
                    />

                    در حال ارسال...
                  </>
                ) : (
                  <>
                    <CheckCircle2
                      size={19}
                    />

                    بله، ثبت شود
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/*
 * یک بخش بازبینی شامل عنوان،
 * دکمه ویرایش و محتوای جدول
 */
function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;

  onEdit: () => void;

  children: React.ReactNode;
}) {
  return (
    <section
      className="
        mb-6
        border
        border-gray-200
        rounded-xl
        overflow-hidden
      "
    >
      <header
        className="
          flex items-center
          justify-between
          px-4 py-3
          bg-gray-50
          border-b
          border-gray-200
        "
      >
        <h3
          className="
            font-bold
            text-gray-800
          "
        >
          {title}
        </h3>

        <button
          type="button"
          onClick={onEdit}
          className="
            flex items-center
            gap-1.5
            text-sm
            text-[#007fcf]
            hover:text-[#0065a6]
          "
        >
          <Pencil size={16} />

          ویرایش
        </button>
      </header>

      {children}
    </section>
  );
}

/*
 * ردیف جدول مشخصات
 */
function ReviewRow({
  label,
  value,
}: {
  label: string;

  value:
    | string
    | number;
}) {
  return (
    <tr
      className="
        border-t
        first:border-t-0
        border-gray-200
      "
    >
      <th
        className="
          w-48
          px-4 py-4
          text-right
          text-sm
          font-semibold
          text-gray-600
          bg-gray-50
        "
      >
        {label}
      </th>

      <td
        className="
          px-4 py-4
          text-sm
          text-gray-800
        "
      >
        {value || "—"}
      </td>
    </tr>
  );
}

const tableClass = `
  w-full
  border-collapse
`;

const tableHeaderClass = `
  px-4 py-4
  text-right
  text-xs
  font-bold
  text-gray-600
  whitespace-nowrap
`;

const tableCellClass = `
  px-4 py-4
  text-sm
  text-gray-600
  whitespace-nowrap
`;


/*
 * تبدیل امن پاسخ Text به JSON
 */
function parseJsonResponse(
  responseText: string
): unknown | null {
  if (!responseText.trim()) {
    return null;
  }


  try {
    return JSON.parse(
      responseText
    ) as unknown;
  } catch {
    return null;
  }
}


/*
 * بررسی Object بودن مقدار
 */
function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}


/*
 * بررسی حداقلی پاسخ موفق
 */
function isFinalSubmitResponse(
  value: unknown
): value is FinalSubmitResponse {
  if (!isRecord(value)) {
    return false;
  }
  if (
    typeof value.message !==
      "string" ||
    typeof value.createSucceeded !==
      "boolean" ||
    typeof value.submitSucceeded !==
      "boolean" ||
    !isRecord(
      value.forecast
    )
  ) {
    return false;
  }

  return typeof value.forecast.id ===
    "string";
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