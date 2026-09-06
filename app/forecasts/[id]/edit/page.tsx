"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import DateObject from
  "react-date-object";

import persian from
  "react-date-object/calendars/persian";

import persianFa from
  "react-date-object/locales/persian_fa";

import {
  AlertCircle,
  LoaderCircle,
} from "lucide-react";

import WizardStepper from
  "@/app/component/wizard/WizardStepper";

import SpecificationsStep from
  "@/app/component/wizard/steps/SpecificationsStep";

import TopicsStep from
  "@/app/component/wizard/steps/TopicsStep";

import ExpertsStep from
  "@/app/component/wizard/steps/ExpertsStep";

import EditFinalReviewStep from
  "@/app/component/wizard/steps/EditFinalReviewStep";

import type {
  ExpertOption,
} from "@/app/types/expert";

import type {
  ForecastStatus,
} from "@/app/types/forecast";

import type {
  Program,
  WizardFormData,
} from "@/app/types/wizard";


interface EditableTopicAxis {
  id: string;

  title: string;

  displayOrder: number;
}


interface EditableForecast {
  id: string;

  planId: number;

  networkId: number;

  networkGroupId:
    number | null;

  episodeNumber:
    number | null;

  broadcastDate: string;

  mainTopic: string;

  hasExpert: boolean;

  status: ForecastStatus;

  topicAxes:
    EditableTopicAxis[];

  expertIds: string[];

  createdDate: string;
}


export default function EditForecastPage() {
  const router =
    useRouter();

  const params =
    useParams<{
      id: string;
    }>();

  const forecastId =
    typeof params.id === "string"
      ? params.id.trim()
      : "";

  const [
    currentStep,
    setCurrentStep,
  ] = useState(1);

  const [
    forecast,
    setForecast,
  ] =
    useState<
      EditableForecast | null
    >(null);

  const [
    wizardData,
    setWizardData,
  ] =
    useState<
      WizardFormData | null
    >(null);

  const [
    programs,
    setPrograms,
  ] =
    useState<
      Program[]
    >([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    let cancelled =
      false;

    async function loadEditData() {
      try {
        setIsLoading(true);
        setError("");

        if (!forecastId) {
          throw new Error(
            "شناسه پیش‌بینی معتبر نیست."
          );
        }

        /*
         * دریافت اطلاعات Forecast
         */
        const forecastResponse =
          await fetch(
            `/api/forecasts/${encodeURIComponent(
              forecastId
            )}`,
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

        const forecastResponseText =
          await forecastResponse.text();

        const forecastResponseData =
          parseJsonResponse(
            forecastResponseText
          );

        /*
         * ابتدا وضعیت HTTP بررسی می‌شود.
         * پاسخ خطا نباید به‌عنوان Forecast
         * اعتبارسنجی شود.
         */
        if (!forecastResponse.ok) {
          throw new Error(
            getErrorMessage(
              forecastResponseData
            ) ??
              `دریافت اطلاعات پیش‌بینی انجام نشد. کد پاسخ: ${forecastResponse.status}`
          );
        }

        const loadedForecast =
          parseEditableForecast(
            forecastResponseData,
            forecastId
          );

        if (!loadedForecast) {
          console.error(
            "Invalid edit forecast response:",
            forecastResponseData
          );

          throw new Error(
            "اطلاعات اصلی پیش‌بینی در پاسخ وب‌سرویس وجود ندارد."
          );
        }

        /*
         * فقط Draft و ReturnedForEdit
         * قابل ویرایش هستند.
         */
        if (
          loadedForecast.status !==
            "Draft" &&
          loadedForecast.status !==
            "ReturnedForEdit"
        ) {
          throw new Error(
            "این پیش‌بینی در وضعیت فعلی قابل ویرایش نیست."
          );
        }

        /*
         * برنامه‌ها و کارشناسان هم‌زمان
         * دریافت می‌شوند.
         */
        const [
          loadedPrograms,
          loadedExperts,
        ] =
          await Promise.all([
            loadPrograms(),

            loadSelectedExperts(
              loadedForecast.expertIds
            ),
          ]);

        /*
         * برنامه در ویرایش قابل تغییر نیست.
         * اگر در لیست برنامه‌ها نبود، یک
         * گزینه جایگزین برای نمایش می‌سازیم.
         */
        const selectedProgram =
          loadedPrograms.find(
            (program) =>
              program.id ===
              loadedForecast.planId
          );

        const currentProgram:
          Program =
          selectedProgram ?? {
            id:
              loadedForecast.planId,

            name:
              `برنامه شماره ${loadedForecast.planId}`,

            networkId:
              loadedForecast.networkId,
          };

        const finalPrograms =
          selectedProgram
            ? loadedPrograms
            : [
                currentProgram,
                ...loadedPrograms,
              ];

        /*
         * تبدیل پاسخ Backend به داده‌های
         * قابل‌استفاده در چهار مرحله Wizard
         */
        const initialWizardData:
          WizardFormData = {
          specifications: {
            planId:
              loadedForecast.planId,

            mainTopic:
              loadedForecast.mainTopic,

            broadcastDate:
              loadedForecast
                .broadcastDate,

            broadcastDateJalali:
              toJalaliDate(
                loadedForecast
                  .broadcastDate
              ),

            hasExpert:
              loadedForecast.hasExpert,
          },

          topics:
            loadedForecast.topicAxes
              .slice()
              .sort(
                (
                  firstAxis,
                  secondAxis
                ) =>
                  firstAxis
                    .displayOrder -
                  secondAxis
                    .displayOrder
              )
              .map(
                (
                  axis,
                  index
                ) => ({
                  id:
                    axis.id ||
                    `topic-${index}`,

                  title:
                    axis.title,

                  registeredAt:
                    toJalaliDate(
                      loadedForecast
                        .createdDate ||
                        loadedForecast
                          .broadcastDate
                    ),

                  status:
                    "Draft",
                })
              ),

          experts:
            loadedExperts,
        };

        if (cancelled) {
          return;
        }

        setForecast(
          loadedForecast
        );

        setPrograms(
          finalPrograms
        );

        setWizardData(
          initialWizardData
        );
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "بارگذاری صفحه ویرایش انجام نشد."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadEditData();

    return () => {
      cancelled = true;
    };
  }, [
    forecastId,
  ]);


  /*
   * ثبت تغییرات مرحله اول در State
   *
   * planId اصلی حفظ می‌شود؛ چون طبق
   * مستند در عملیات ویرایش قابل تغییر نیست.
   */
  function handleSpecificationsNext(
    specifications:
      WizardFormData[
        "specifications"
      ]
  ) {
    setWizardData(
      (previous) => {
        if (
          !previous ||
          !forecast
        ) {
          return previous;
        }

        return {
          ...previous,

          specifications: {
            ...specifications,

            planId:
              forecast.planId,
          },
        };
      }
    );

    setCurrentStep(2);
  }


  function handleTopicsChange(
    topics:
      WizardFormData[
        "topics"
      ]
  ) {
    setWizardData(
      (previous) =>
        previous
          ? {
              ...previous,
              topics,
            }
          : previous
    );
  }


  function handleExpertsChange(
    experts:
      ExpertOption[]
  ) {
    setWizardData(
      (previous) =>
        previous
          ? {
              ...previous,
              experts,
            }
          : previous
    );
  }


  if (isLoading) {
    return (
      <main
        className="
          flex min-h-[60vh]
          items-center
          justify-center
        "
        dir="rtl"
      >
        <div
          className="
            flex items-center
            gap-3
            text-gray-500
          "
        >
          <LoaderCircle
            size={23}
            className="animate-spin"
          />

          در حال دریافت اطلاعات پیش‌بینی...
        </div>
      </main>
    );
  }


  if (
    error ||
    !wizardData ||
    !forecast
  ) {
    return (
      <main
        className="
          mx-auto
          max-w-2xl
          px-4 py-12
        "
        dir="rtl"
      >
        <section
          className="
            rounded-2xl
            border border-red-200
            bg-red-50
            p-6
            text-red-700
          "
        >
          <div
            className="
              flex items-center
              gap-2
              font-bold
            "
          >
            <AlertCircle
              size={21}
            />

            ویرایش پیش‌بینی امکان‌پذیر نیست
          </div>

          <p
            className="
              mt-3
              text-sm
              leading-7
            "
          >
            {error ||
              "اطلاعات ویرایش در دسترس نیست."}
          </p>

          <button
            type="button"
            onClick={() =>
              router.replace(
                "/forecasts"
              )
            }
            className="
              mt-5
              rounded-lg
              border border-red-300
              bg-white
              px-4 py-2
              text-sm font-semibold
              hover:bg-red-100
            "
          >
            بازگشت به فهرست
          </button>
        </section>
      </main>
    );
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
          mx-auto
          max-w-6xl
        "
      >
        <header className="mb-2">
          <h1
            className="
              text-2xl
              font-bold
              text-gray-800
            "
          >
            ویرایش پیش‌بینی
          </h1>

          <p
            className="
              mt-2
              text-sm
              text-gray-500
            "
          >
            برنامه، شبکه و شماره قسمت قابل تغییر نیستند؛ سایر اطلاعات را ویرایش کنید.
          </p>
        </header>

        <WizardStepper
          currentStep={
            currentStep
          }
        />


        {/* مرحله اول */}
        {currentStep === 1 && (
          <SpecificationsStep
            initialData={
              wizardData.specifications
            }

            programs={
              programs
            }

            isProgramsLoading={
              false
            }

            programsError=""

            isPlanReadOnly

            onNext={
              handleSpecificationsNext
            }
          />
        )}


        {/* مرحله دوم */}
        {currentStep === 2 && (
          <TopicsStep
            topics={
              wizardData.topics
            }

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


        {/* مرحله سوم */}
        {currentStep === 3 && (
          <ExpertsStep
            hasExpert={
              wizardData
                .specifications
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


        {/* مرحله چهارم */}
        {currentStep === 4 && (
          <EditFinalReviewStep
            forecastId={
              forecast.id
            }

            episodeNumber={
              forecast.episodeNumber ??
              0
            }

            wizardData={
              wizardData
            }

            programs={
              programs
            }

            onBack={() =>
              setCurrentStep(3)
            }

            onEditStep={
              setCurrentStep
            }
          />
        )}
      </section>
    </main>
  );
}


/*
 * دریافت لیست برنامه‌های مجاز کاربر
 */
async function loadPrograms():
  Promise<Program[]> {
  try {
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

    const responseData =
      parseJsonResponse(
        await response.text()
      );

    if (
      !response.ok ||
      !isRecord(responseData) ||
      !Array.isArray(
        responseData.programs
      )
    ) {
      return [];
    }

    return responseData.programs
      .map(
        parseProgram
      )
      .filter(
        (
          program
        ): program is Program =>
          program !== null
      );
  } catch {
    /*
     * عدم دریافت برنامه‌ها نباید کل
     * صفحه ویرایش را از کار بیندازد.
     */
    return [];
  }
}


/*
 * دریافت کارشناسان انتخاب‌شده
 */
async function loadSelectedExperts(
  expertIds: string[]
): Promise<ExpertOption[]> {
  if (
    expertIds.length === 0
  ) {
    return [];
  }

  const responses =
    await Promise.allSettled(
      expertIds.map(
        async (expertId) => {
          const response =
            await fetch(
              `/api/experts/${encodeURIComponent(
                expertId
              )}`,
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

          const responseData =
            parseJsonResponse(
              await response.text()
            );

          if (!response.ok) {
            throw new Error(
              getErrorMessage(
                responseData
              ) ??
                "دریافت اطلاعات کارشناس انجام نشد."
            );
          }

          const expert =
            parseExpertOption(
              responseData
            );

          if (!expert) {
            throw new Error(
              "پاسخ اطلاعات کارشناس معتبر نیست."
            );
          }

          return expert;
        }
      )
    );

  /*
   * خطای دریافت یک کارشناس مانع بازشدن
   * کل صفحه ویرایش نمی‌شود.
   */
  return responses.flatMap(
    (response) =>
      response.status ===
        "fulfilled"
        ? [
            response.value,
          ]
        : []
  );
}


/*
 * تبدیل پاسخ Forecast به مدل ویرایش
 *
 * اعتبارسنجی فقط روی فیلدهای ضروری
 * عملیات ویرایش انجام می‌شود.
 */
function parseEditableForecast(
  value: unknown,
  fallbackId: string
): EditableForecast | null {
  const source =
    findNestedObject(
      value,
      [
        "forecast",
        "data",
        "result",
        "value",
        "item",
      ],
      (
        item
      ) =>
        "mainTopic" in item ||
        "planId" in item ||
        "topicAxes" in item
    );

  if (!source) {
    return null;
  }

  const id =
    getIdentifier(
      source.id
    ) ||
    fallbackId;

  const planId =
    getNumber(
      source.planId
    );

  const broadcastDate =
    getString(
      source.broadcastDate
    );

  const mainTopic =
    getString(
      source.mainTopic
    );

  const status =
    normalizeStatus(
      source.status
    );

  /*
   * فقط فیلدهای واقعاً ضروری
   */
  if (
    !id ||
    planId === null ||
    !broadcastDate ||
    !mainTopic ||
    !status
  ) {
    return null;
  }

  const topicAxes =
    Array.isArray(
      source.topicAxes
    )
      ? source.topicAxes
          .map(
            parseTopicAxis
          )
          .filter(
            (
              topic
            ): topic is
              EditableTopicAxis =>
              topic !== null
          )
      : [];

  const expertIds =
    Array.isArray(
      source.expertIds
    )
      ? source.expertIds
          .map(
            getIdentifier
          )
          .filter(Boolean)
      : [];

  return {
    id,

    planId,

    networkId:
      getNumber(
        source.networkId
      ) ?? 0,

    networkGroupId:
      getNumber(
        source.networkGroupId
      ),

    episodeNumber:
      getNumber(
        source.episodeNumber
      ),

    broadcastDate,

    mainTopic,

    hasExpert:
      source.hasExpert === true,

    status,

    topicAxes,

    expertIds,

    createdDate:
      getString(
        source.createdDate
      ),
  };
}


function parseTopicAxis(
  value: unknown,
  index: number
):
  EditableTopicAxis | null {
  if (!isRecord(value)) {
    return null;
  }

  const title =
    getString(
      value.title
    );

  if (!title) {
    return null;
  }

  return {
    id:
      getIdentifier(
        value.id
      ) ||
      `topic-${index}`,

    title,

    displayOrder:
      getNumber(
        value.displayOrder
      ) ??
      index + 1,
  };
}


function parseProgram(
  value: unknown
): Program | null {
  if (!isRecord(value)) {
    return null;
  }

  const id =
    getNumber(
      value.id
    );

  const name =
    getString(
      value.name
    );

  if (
    id === null ||
    !name
  ) {
    return null;
  }

  return {
    id,

    name,

    networkId:
      getNumber(
        value.networkId
      ) ?? 0,
  };
}


/*
 * تبدیل پاسخ جزئیات کارشناس
 */
function parseExpertOption(
  value: unknown
): ExpertOption | null {
  const source =
    findNestedObject(
      value,
      [
        "expert",
        "data",
        "result",
        "value",
        "item",
      ],
      (
        item
      ) =>
        "firstName" in item ||
        "lastName" in item
    );

  if (!source) {
    return null;
  }

  const id =
    getIdentifier(
      source.id
    );

  const firstName =
    getString(
      source.firstName
    );

  const lastName =
    getString(
      source.lastName
    );

  if (
    !id ||
    !firstName ||
    !lastName
  ) {
    return null;
  }

  /*
   * فیلدهای اصلی بررسی شده‌اند.
   * سایر فیلدها مطابق پاسخ Backend
   * در شیء باقی می‌مانند.
   */
  return {
    ...source,

    id,

    firstName,

    lastName,
  } as unknown as
    ExpertOption;
}


/*
 * پیدا کردن Object اصلی داخل پاسخ‌های
 * مستقیم یا چندلایه
 */
function findNestedObject(
  value: unknown,
  wrapperNames: string[],
  matcher: (
    value: Record<
      string,
      unknown
    >
  ) => boolean,
  depth = 0
): Record<
  string,
  unknown
> | null {
  if (
    depth > 6 ||
    !isRecord(value)
  ) {
    return null;
  }

  if (matcher(value)) {
    return value;
  }

  for (
    const wrapperName of
    wrapperNames
  ) {
    const found =
      findNestedObject(
        value[wrapperName],
        wrapperNames,
        matcher,
        depth + 1
      );

    if (found) {
      return found;
    }
  }

  return null;
}


/*
 * نرمال‌سازی Status عددی و رشته‌ای
 */
function normalizeStatus(
  value: unknown
): ForecastStatus | null {
  switch (value) {
    case 1:
    case "1":
    case "Draft":
      return "Draft";

    case 2:
    case "2":
    case "PendingReview":
      return "PendingReview";

    case 3:
    case "3":
    case "Approved":
      return "Approved";

    case 4:
    case "4":
    case "Rejected":
      return "Rejected";

    case 5:
    case "5":
    case "ReturnedForEdit":
      return "ReturnedForEdit";
  }

  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const normalized =
    value
      .trim()
      .toLowerCase()
      .replace(
        /[\s_-]/g,
        ""
      );

  switch (normalized) {
    case "draft":
      return "Draft";

    case "pendingreview":
      return "PendingReview";

    case "approved":
      return "Approved";

    case "rejected":
      return "Rejected";

    case "returnedforedit":
      return "ReturnedForEdit";

    default:
      return null;
  }
}


/*
 * تبدیل تاریخ میلادی به تاریخ شمسی
 */
function toJalaliDate(
  isoDate: string
): string {
  const normalizedDate =
    normalizeDigits(
      isoDate
    );

  const date =
    new Date(
      normalizedDate
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return new DateObject({
    date,
  })
    .convert(
      persian,
      persianFa
    )
    .format(
      "YYYY/MM/DD"
    );
}


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

  if (
    typeof value.errors ===
      "string"
  ) {
    return value.errors;
  }

  if (
    typeof value.title ===
      "string"
  ) {
    return value.title;
  }

  return null;
}


function getIdentifier(
  value: unknown
): string {
  if (
    typeof value === "string"
  ) {
    return value.trim();
  }

  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return String(value);
  }

  return "";
}


function getString(
  value: unknown
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}


function getNumber(
  value: unknown
): number | null {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    const numberValue =
      Number(
        normalizeDigits(
          value
        )
      );

    return Number.isFinite(
      numberValue
    )
      ? numberValue
      : null;
  }

  return null;
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