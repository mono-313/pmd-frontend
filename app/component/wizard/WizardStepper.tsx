interface WizardStepperProps {
  currentStep: number;
}

const steps = [
  {
    id: 1,
    title: "مشخصات",
  },
  {
    id: 2,
    title: "موضوعات",
  },
  {
    id: 3,
    title: "کارشناسان",
  },
  {
    id: 4,
    title: "تأیید",
  },
];

export default function WizardStepper({
  currentStep,
}: WizardStepperProps) {
  return (
    <div className="w-full py-8">
      <div
        className="
          flex items-start
          justify-between
          max-w-3xl
          mx-auto
        "
      >
        {steps.map((step, index) => {
          const isCompleted =
            currentStep > step.id;

          const isActive =
            currentStep === step.id;

          const isReached =
            currentStep >= step.id;

          return (
            <div
              key={step.id}
              className="
                flex-1
                flex items-start
              "
            >
              <div
                className="
                  flex flex-col
                  items-center
                  relative
                  z-10
                "
              >
                {/* دایره مرحله */}
                <div
                  className={`
                    w-12 h-12
                    rounded-full
                    flex items-center
                    justify-center
                    border-4 border-white
                    font-bold
                    transition-colors
                    duration-300
                    ${
                      isReached
                        ? "bg-[#007fcf] text-white"
                        : "bg-gray-300 text-gray-600"
                    }
                  `}
                >
                  {isCompleted ? "✓" : step.id}
                </div>

                {/* عنوان مرحله */}
                <span
                  className={`
                    mt-2
                    text-sm
                    font-semibold
                    whitespace-nowrap
                    ${
                      isActive ||
                      isCompleted
                        ? "text-[#007fcf]"
                        : "text-gray-500"
                    }
                  `}
                >
                  {step.title}
                </span>
              </div>

              {/* خط اتصال مراحل */}
              {index < steps.length - 1 && (
                <div
                  className="
                    relative
                    flex-1
                    h-1
                    mt-6
                    bg-gray-300
                    overflow-hidden
                  "
                >
                  <div
                    className={`
                      absolute
                      inset-y-0
                      right-0
                      bg-[#007fcf]
                      transition-all
                      duration-500
                      ${
                        currentStep >
                        step.id
                          ? "w-full"
                          : "w-0"
                      }
                    `}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}