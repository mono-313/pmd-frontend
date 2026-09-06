"use client";
import {
  useEffect,
  useState,
} from "react";



import WizardStepper from
  "@/app/component/wizard/WizardStepper"

import SpecificationsStep from
 "@/app/component/wizard/steps/SpecificationsStep";
import TopicsStep from
  "@/app/component/wizard/steps/TopicsStep";
import ExpertsStep from
  "@/app/component/wizard/steps/ExpertsStep";
import FinalReviewStep from
  "@/app/component/wizard/steps/FinalReviewStep";


import type {
  Program,
  WizardFormData,
} from "../types/wizard";

import type {
  ExpertOption,
} from "@/app/types/expert";




const initialWizardData:
WizardFormData = {
  specifications: {
    planId:null,
    broadcastDate: "",
    mainTopic: "",
    broadcastDateJalali: "",
    hasExpert: false,
  
  },

  topics: [],

  experts: [],
};



export default function WizardPage() {


  const [currentStep, setCurrentStep] =
    useState(1);

  const [wizardData, setWizardData] =
    useState<WizardFormData>(
      initialWizardData
    );

  const [programs, setPrograms] =
    useState<Program[]>([]);

  const [
    isProgramsLoading,
    setIsProgramsLoading,
  ] = useState(false);

  const [
    programsError,
    setProgramsError,
  ] = useState("");

  /*
   * دریافت برنامه‌های مربوط به شبکه‌های کاربر
   */
  useEffect(() => {
  let cancelled =
    false;

  async function loadPrograms() {
    try {
      setIsProgramsLoading(true);
      setProgramsError("");

      const response =
        await fetch(
          "/api/programs",
          {
            method: "GET",

            headers: {
              Accept:
                "application/json",
            },

            cache:
              "no-store",
          }
        );

      const responseText =
        await response.text();

      let responseData:
        unknown = null;

      try {
        responseData =
          responseText.trim()
            ? JSON.parse(
                responseText
              ) as unknown
            : null;
      } catch {
        throw new Error(
          "پاسخ سرویس برنامه‌ها JSON معتبر نیست."
        );
      }

      if (!response.ok) {
        const errorData =
          isRecord(responseData)
            ? responseData
            : null;

        const errorMessage =
          typeof errorData?.message ===
            "string"
            ? errorData.message
            : `دریافت برنامه‌ها انجام نشد. کد پاسخ: ${response.status}`;

        throw new Error(
          errorMessage
        );
      }

      if (
        !isProgramsResponse(
          responseData
        )
      ) {
        console.error(
          "Invalid programs response:",
          responseData
        );

        throw new Error(
          "ساختار پاسخ برنامه‌ها معتبر نیست."
        );
      }

      if (!cancelled) {
        setPrograms(
          responseData.programs
        );
      }
    } catch (error) {
      if (!cancelled) {
        setPrograms([]);

        setProgramsError(
          error instanceof Error
            ? error.message
            : "دریافت برنامه‌ها انجام نشد."
        );
      }
    } finally {
      if (!cancelled) {
        setIsProgramsLoading(false);
      }
    }
  }

  void loadPrograms();

  return () => {
    cancelled = true;
  };
}, []);


  // step1
  function handleSpecificationsNext(
    data:
      WizardFormData["specifications"]
  ) 
  {
    setWizardData((previous) => ({
      ...previous,

      specifications: data,
    }));

    setCurrentStep(2);
  }

// step2
  function handleTopicsChange(
  topics: WizardFormData["topics"]
) {
  setWizardData((previous) => ({
    ...previous,

    topics,
  }));
}
// step3
function handleExpertsChange(
    experts: ExpertOption[]
  ) {
    setWizardData((previous) => ({
      ...previous,

      experts,
    }));
  }
  return (
    <main
      className="
        min-h-screen
        bg-gray-50
        px-4 py-8
      "
      dir="rtl"
    >
      <section
        className="
          max-w-6xl mx-auto
        "
      >
        <header className="mb-2">
          <h1 className="text-2xl font-bold text-gray-800">
            ثبت برنامه جدید
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            اطلاعات برنامه را مرحله‌به‌مرحله وارد کنید.
          </p>
        </header>

        <WizardStepper
          currentStep={currentStep}
        />

        {currentStep === 1 && (
          <SpecificationsStep
            initialData={
              wizardData.specifications
            }
            programs={programs}
            isProgramsLoading={
              isProgramsLoading
            }
            programsError={
              programsError
            }
            onNext={
              handleSpecificationsNext
            }
          />
        )}

        {currentStep === 2 && (
          <TopicsStep
            topics={wizardData.topics}

            onChange={
              handleTopicsChange
            }

            onBack={() =>
              setCurrentStep(1)
            }

            onNext={() =>
              setCurrentStep(3)
            }
          />
        )}
        {currentStep === 3 && (
          <ExpertsStep
            hasExpert={
              wizardData.specifications
                .hasExpert
            }

            experts={
              wizardData.experts
            }

            onChange={
              handleExpertsChange
            }

            onBack={() =>
              setCurrentStep(2)
            }

            onNext={() =>
              setCurrentStep(4)
            }
          />
        )}
        {currentStep === 4 && (
          <FinalReviewStep
            wizardData={wizardData}

            programs={programs}

            onBack={() =>
              setCurrentStep(3)
            }

            onEditStep={(step) =>
              setCurrentStep(step)
            }
          />
        )}
      </section>
    </main>
  );
}



function isProgramsResponse(
  value: unknown
): value is {
  programs: Program[];
} {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(
      value.programs
    ) &&

    value.programs.every(
      isProgram
    )
  );
}


function isProgram(
  value: unknown
): value is Program {
  return (
    isRecord(value) &&

    typeof value.id ===
      "number" &&

    typeof value.name ===
      "string" &&

    typeof value.networkId ===
      "number"
  );
}


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