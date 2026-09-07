"use client";

import {
  Check,
} from "lucide-react";


interface ProfileWizardStepperProps {
  /*
   * شماره مرحله فعلی:
   * 1 تا 5
   */
  currentStep:
    number;
}


interface ProfileWizardStep {
  id:
    number;

  title:
    string;

  shortTitle:
    string;
}


/*
 * مراحل Wizard شناسنامه
 */
const profileWizardSteps:
  ProfileWizardStep[] = [
  {
    id: 1,

    title:
      "مشخصات برنامه",

    shortTitle:
      "مشخصات",
  },

  {
    id: 2,

    title:
      "عوامل برنامه",

    shortTitle:
      "عوامل",
  },

  {
    id: 3,

    title:
      "آیتم‌های برنامه",

    shortTitle:
      "آیتم‌ها",
  },

  {
    id: 4,

    title:
      "کارشناسان برنامه",

    shortTitle:
      "کارشناسان",
  },

  {
    id: 5,

    title:
      "بازبینی و صدور",

    shortTitle:
      "تأیید نهایی",
  },
];


export default function ProfileWizardStepper({
  currentStep,
}: ProfileWizardStepperProps) {
  /*
   * جلوگیری از دریافت مرحله
   * کمتر از 1 یا بیشتر از 5
   */
  const normalizedCurrentStep =
    Math.min(
      Math.max(
        currentStep,
        1
      ),
      profileWizardSteps.length
    );


  return (
    <section
      className="
        mb-8
        rounded-xl
        border border-gray-200
        bg-white
        px-4 py-6
        shadow-sm
      "
      dir="rtl"
      aria-label="مراحل صدور شناسنامه"
    >
      {/* نسخه دسکتاپ */}
      <div
        className="
          hidden
          items-start
          md:flex
        "
      >
        {profileWizardSteps.map(
          (
            step,
            index
          ) => {
            const isCompleted =
              step.id <
              normalizedCurrentStep;

            const isCurrent =
              step.id ===
              normalizedCurrentStep;

            const isLast =
              index ===
              profileWizardSteps.length -
                1;


            return (
              <div
                key={step.id}
                className={`
                  flex
                  min-w-0
                  items-start
                  ${
                    isLast
                      ? ""
                      : "flex-1"
                  }
                `}
              >
                {/* مرحله و عنوان */}
                <div
                  className="
                    flex
                    shrink-0
                    flex-col
                    items-center
                  "
                >
                  <div
                    className={`
                      flex
                      h-11 w-11
                      items-center
                      justify-center
                      rounded-full
                      border-2
                      text-sm
                      font-bold
                      transition-colors
                      duration-300
                      ${
                        isCompleted
                          ? `
                              border-[#007fcf]
                              bg-[#007fcf]
                              text-white
                            `
                          : isCurrent
                            ? `
                                border-[#007fcf]
                                bg-blue-50
                                text-[#007fcf]
                              `
                            : `
                                border-gray-300
                                bg-white
                                text-gray-400
                              `
                      }
                    `}
                    aria-current={
                      isCurrent
                        ? "step"
                        : undefined
                    }
                  >
                    {isCompleted ? (
                      <Check
                        size={21}
                        strokeWidth={3}
                      />
                    ) : (
                      toPersianNumber(
                        step.id
                      )
                    )}
                  </div>


                  <div
                    className="
                      mt-3
                      w-28
                      text-center
                    "
                  >
                    <p
                      className={`
                        text-sm
                        font-bold
                        ${
                          isCurrent ||
                          isCompleted
                            ? "text-gray-800"
                            : "text-gray-400"
                        }
                      `}
                    >
                      {step.title}
                    </p>
                  </div>
                </div>


                {/* خط اتصال مراحل */}
                {!isLast && (
                  <div
                    className="
                      mt-5
                      h-1
                      min-w-8
                      flex-1
                      overflow-hidden
                      rounded-full
                      bg-gray-200
                    "
                    aria-hidden="true"
                  >
                    <div
                      className={`
                        h-full
                        rounded-full
                        bg-[#007fcf]
                        transition-all
                        duration-500
                        ${
                          isCompleted
                            ? "w-full"
                            : "w-0"
                        }
                      `}
                    />
                  </div>
                )}
              </div>
            );
          }
        )}
      </div>


      {/* نسخه موبایل */}
      <div className="md:hidden">
        <div
          className="
            mb-4
            flex
            items-center
            justify-between
            gap-3
          "
        >
          <div>
            <p
              className="
                text-xs
                text-gray-500
              "
            >
              مرحله{" "}
              {toPersianNumber(
                normalizedCurrentStep
              )}{" "}
              از{" "}
              {toPersianNumber(
                profileWizardSteps.length
              )}
            </p>

            <h3
              className="
                mt-1
                font-bold
                text-gray-800
              "
            >
              {
                profileWizardSteps[
                  normalizedCurrentStep -
                    1
                ].title
              }
            </h3>
          </div>


          <div
            className="
              flex
              h-11 w-11
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[#007fcf]
              font-bold
              text-white
            "
          >
            {toPersianNumber(
              normalizedCurrentStep
            )}
          </div>
        </div>


        {/* نوار پیشرفت موبایل */}
        <div
          className="
            h-2
            overflow-hidden
            rounded-full
            bg-gray-200
          "
        >
          <div
            className="
              h-full
              rounded-full
              bg-[#007fcf]
              transition-all
              duration-500
            "
            style={{
              width:
                `${
                  (
                    normalizedCurrentStep /
                    profileWizardSteps.length
                  ) * 100
                }%`,
            }}
          />
        </div>


        {/* عناوین کوتاه */}
        <div
          className="
            mt-3
            flex
            justify-between
            gap-1
          "
        >
          {profileWizardSteps.map(
            (step) => (
              <span
                key={step.id}
                className={`
                  text-[10px]
                  ${
                    step.id ===
                    normalizedCurrentStep
                      ? `
                          font-bold
                          text-[#007fcf]
                        `
                      : step.id <
                          normalizedCurrentStep
                        ? "text-gray-700"
                        : "text-gray-400"
                  }
                `}
              >
                {step.shortTitle}
              </span>
            )
          )}
        </div>
      </div>
    </section>
  );
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