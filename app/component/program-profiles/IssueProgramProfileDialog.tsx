"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Loader2,
  X,
} from "lucide-react";

import ProfileWizardStepper from
"@/app/component/program-profiles/ProfileWizardStepper"

import ProfileSpecificationsStep from
  "@/app/component/program-profiles/steps/ProfileSpecificationsStep";

import ProfileCrewStep from
  "@/app/component/program-profiles/steps/ProfileCrewStep";

import ProfileItemsStep from
  "@/app/component/program-profiles/steps/ProfileItemsStep";

import ProfileExpertsStep from
  "@/app/component/program-profiles/steps/ProfileExpertsStep";

import ProfileFinalReviewStep from
  "@/app/component/program-profiles/steps/ProfileFinalReviewStep";

import type {
  PersonnelOption,
  CrewActivityOption,
} from "@/app/component/program-profiles/steps/ProfileCrewStep";

import type {
  ProfileExpertOption,
  ProfileTopicAxisOption,
} from "@/app/component/program-profiles/steps/ProfileExpertsStep";

import type {
  ProfileCrewMemberData,
  ProfileItemData,
  ProgramProfileWizardData,
} from "@/app/types/program-profile";


interface IssueProfileDialogProps {
  isOpen:
    boolean;

  forecastId:
    string | null;

  onClose:
    () => void;

  /*
   * بعد از صدور کامل شناسنامه
   */
  onIssued:
    (
      profileId: string
    ) => void;
}


type UnknownRecord = Record<
  string,
  unknown
>;


const emptyWizardData:
  ProgramProfileWizardData = {
  specifications: {
    forecastId: "",

    planId: 0,

    networkId: 0,

    networkGroupId: 0,

    programName: "",

    mainTopic: "",

    episodeNumber: null,

    duration: "",

    broadcastDate: "",

    broadcastDateJalali: "",

    productionMethod: "",

    occasion: "",

    floorId: null,

    floorName: "",

    programDegreeId: null,

    programDegreeName: "",

    programStructureId: null,

    programStructureName: "",

    startTime: "",

    hasExpert: false,
  },

  crewMembers: [],

  items: [],

  experts: [],
};


export default function IssueProfileDialog({
  isOpen,
  forecastId,
  onClose,
  onIssued,
}: IssueProfileDialogProps) {
  const [
    currentStep,
    setCurrentStep,
  ] = useState(1);

  const [
    wizardData,
    setWizardData,
  ] =
    useState<ProgramProfileWizardData>(
      emptyWizardData
    );

  const [
    personnelOptions,
    setPersonnelOptions,
  ] =
    useState<PersonnelOption[]>(
      []
    );

  const [
    activityOptions,
    setActivityOptions,
  ] =
    useState<CrewActivityOption[]>(
      []
    );

  const [
    availableExperts,
    setAvailableExperts,
  ] =
    useState<ProfileExpertOption[]>(
      []
    );

  const [
    topicAxes,
    setTopicAxes,
  ] =
    useState<
      ProfileTopicAxisOption[]
    >([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    loadingError,
    setLoadingError,
  ] = useState("");

  const [
    expertsError,
    setExpertsError,
  ] = useState("");


  /*
   * جلوگیری از Scroll صفحه زیر Modal
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }


    const previousOverflow =
      document.body.style
        .overflow;


    document.body.style
      .overflow = "hidden";


    return () => {
      document.body.style
        .overflow =
        previousOverflow;
    };
  }, [isOpen]);


  /*
   * دریافت اطلاعات Wizard
   */
  useEffect(() => {
  if (
    !isOpen ||
    !forecastId
  ) {
    return;
  }

  /*
   * بعد از بررسی null بودن، یک نسخه قطعی
   * و از نوع string نگه می‌داریم.
   */
  const selectedForecastId:
    string = forecastId;

  let cancelled =
    false;

  async function loadWizardData() {
    try {
      setIsLoading(true);
      setLoadingError("");
      setExpertsError("");
      setCurrentStep(1);
      setWizardData(
        emptyWizardData
      );

      const forecastResponse =
        await fetchJson(
          `/api/forecasts/${encodeURIComponent(
            selectedForecastId
          )}`
        );



        const forecast =
          extractObject(
            forecastResponse,
            [
              "forecast",
              "data",
              "result",
            ]
          );


        if (!forecast) {
          throw new Error(
            "اطلاعات پیش‌بینی در پاسخ سرور پیدا نشد."
          );
        }


        const planId =
          getNumber(
            forecast,
            [
              "planId",
              "PlanId",
            ]
          );


        const networkId =
          getNumber(
            forecast,
            [
              "networkId",
              "NetworkId",
            ]
          );


        const networkGroupId =
          getNumber(
            forecast,
            [
              "networkGroupId",
              "NetworkGroupId",
            ]
          );


        if (
          planId === null ||
          planId <= 0
        ) {
          throw new Error(
            "شناسه برنامه در اطلاعات پیش‌بینی معتبر نیست."
          );
        }


        if (
          networkId === null ||
          networkId <= 0
        ) {
          throw new Error(
            "شناسه شبکه در اطلاعات پیش‌بینی معتبر نیست."
          );
        }


        if (
          networkGroupId ===
            null ||
          networkGroupId <= 0
        ) {
          throw new Error(
            "شناسه گروه برنامه‌ساز در اطلاعات پیش‌بینی معتبر نیست."
          );
        }


        /*
         * ابتدا اطلاعاتی را می‌گیریم که برای دریافتشان
         * به jobId نیاز نداریم.
         */
        const [
          planDetailResponse,
          crewResponse,
          itemsResponse,
          expertsResponse,
          programsResponse,
        ] =
          await Promise.all([
            fetchJson(
              `/api/base-info/plans/${planId}/detail`
            ),

            fetchJson(
              `/api/base-info/plans/${planId}/crew`
            ),

            fetchJson(
              `/api/base-info/plans/${planId}/items`
            ),

            fetchJson(
              "/api/experts?pageNumber=1&pageSize=200&isActive=true"
            ),
             fetchJson(
              "/api/programs" +
              `?networkId=${encodeURIComponent(
                String(networkId)
              )}` +
              `&networkGroupId=${encodeURIComponent(
                String(networkGroupId)
              )}`
            ),
          ]);


        /*
         * پاسخ estimateDetail ابتدا باز می‌شود تا jobId
         * تمام عوامل از آن استخراج شود.
         */
        const rawCrewItems =
          extractArray(
            crewResponse,
            [
              "items",
              "Items",
              "crewMembers",
              "CrewMembers",
              "data",
              "Data",
              "result",
              "Result",
            ]
          );


        const jobIds =
          extractJobIds(
            rawCrewItems
          );


        if (
          process.env.NODE_ENV ===
          "development"
        ) {
          console.log(
            "EXTRACTED CREW JOB IDS:",
            jobIds
          );
        }


        /*
         * برای هر شغل، انواع فعالیت و پرسنل همان شغل
         * به‌صورت جداگانه دریافت می‌شوند. شکست یک درخواست
         * نباید باعث بسته‌شدن کل Wizard شود.
         */
        const activityResponses =
          await Promise.all(
            jobIds.map(
              async (jobId) => {
                try {
                  return await fetchJson(
                    "/api/base-info/activity-types" +
                    `?jobId=${encodeURIComponent(
                      String(jobId)
                    )}`
                  );
                } catch (activityError) {
                  console.error(
                    `Activity types request failed for jobId ${jobId}:`,
                    activityError
                  );

                  return {
                    items: [],
                  };
                }
              }
            )
          );


        const personnelResponses =
          await Promise.all(
            jobIds.map(
              async (jobId) => {
                try {
                  return await fetchJson(
                    "/api/base-info/personnel" +
                    `?networkId=${encodeURIComponent(
                      String(networkId)
                    )}` +
                    `&jobId=${encodeURIComponent(
                      String(jobId)
                    )}`
                  );
                } catch (personnelError) {
                  console.error(
                    `Personnel request failed for jobId ${jobId}:`,
                    personnelError
                  );

                  return {
                    items: [],
                  };
                }
              }
            )
          );


        const planDetail =
          extractFirstObject(
            planDetailResponse,
            [
              "data",
              "Data",
              "detail",
              "Detail",
              "planDetail",
              "PlanDetail",
              "result",
              "Result",
              "items",
              "Items",
            ]
          ) ?? {};


        if (
          process.env.NODE_ENV ===
          "development"
        ) {
          console.log(
            "RAW PLAN DETAIL:",
            planDetailResponse
          );

          console.log(
            "EXTRACTED PLAN DETAIL:",
            planDetail
          );
        }



        const structureId =
  getNumber(
    planDetail,
    [
      "StructureProgramId",
      "structureProgramId",

      "ProgramStructureId",
      "programStructureId",
    ]
  );


        const degreeId =
          getNumber(
            planDetail,
            [
              "ProgramDegreeId",
              "programDegreeId",
            ]
          );


        const floorId =
          getNumber(
            planDetail,
            [
              "FloorPlanId",
              "floorPlanId",
            ]
          );

          const programName =
            findProgramName(
              programsResponse,
              planId
            );


          let structureOptions: Array<{
  id: number;
  name: string;
}> = [];

let degreeOptions: Array<{
  id: number;
  name: string;
}> = [];


/*
 * دریافت نام ساختار
 */
try {
  const structuresResponse =
    await fetchJson(
      "/api/base-info/program-structures"
    );

  structureOptions =
    normalizeSimpleOptions(
      extractArray(
        structuresResponse,
        [
          "items",
          "Items",
          "data",
          "Data",
          "result",
          "Result",
        ]
      )
    );
} catch (structureError) {
  console.error(
    "Program structures lookup failed:",
    structureError
  );
}


/*
 * دریافت نام درجه براساس ساختار
 */
if (
  structureId !== null &&
  structureId > 0
) {
  try {
    const degreesResponse =
      await fetchJson(
        "/api/base-info/program-degrees" +
        `?structureId=${encodeURIComponent(
          String(structureId)
        )}`
      );

    degreeOptions =
      normalizeSimpleOptions(
        extractArray(
          degreesResponse,
          [
            "items",
            "Items",
            "data",
            "Data",
            "result",
            "Result",
          ]
        )
      );
  } catch (degreeError) {
    console.error(
      "Program degrees lookup failed:",
      degreeError
    );
  }
}   
        const normalizedCrew =
          normalizeCrewMembers(
            rawCrewItems
          );


        const normalizedItems =
          normalizeItems(
            extractArray(
              itemsResponse,
              [
                "items",
                "Items",
                "planItems",
                "PlanItems",
                "data",
                "Data",
                "result",
                "Result",
              ]
            )
          );


        const normalizedActivities =
          removeDuplicateOptions(
            activityResponses.flatMap(
              (activityResponse) =>
                normalizeSimpleOptions(
                  extractArray(
                    activityResponse,
                    [
                      "items",
                      "Items",
                      "activityTypes",
                      "ActivityTypes",
                      "data",
                      "Data",
                      "result",
                      "Result",
                    ]
                  )
                )
            )
          );


        const normalizedPersonnel =
          removeDuplicateOptions(
            personnelResponses.flatMap(
              (personnelResponse) =>
                normalizeSimpleOptions(
                  extractArray(
                    personnelResponse,
                    [
                      "items",
                      "Items",
                      "personnel",
                      "Personnel",
                      "data",
                      "Data",
                      "result",
                      "Result",
                    ]
                  )
                )
            )
          );


        const normalizedExperts =
          normalizeExperts(
            extractArray(
              expertsResponse,
              [
                "items",
                "experts",
                "data",
                "result",
              ]
            )
          );


        const normalizedAxes =
          normalizeTopicAxes(
            forecast.topicAxes ??
            forecast.TopicAxes
          );


        const broadcastDate =
          getString(
            forecast,
            [
              "broadcastDate",
              "BroadcastDate",
            ]
          );

const resolvedStructureName =
  getString(
    planDetail,
    [
      "StructureProgramName",
      "structureProgramName",
    ]
  ) ||
  findLookupName(
    structureOptions,
    structureId
  );


const resolvedDegreeName =
  getString(
    planDetail,
    [
      "ProgramDegreeName",
      "programDegreeName",
    ]
  ) ||
  findLookupName(
    degreeOptions,
    degreeId
  );


const resolvedFloorName =
  getString(
    planDetail,
    [
      "FloorPlanName",
      "floorPlanName",
    ]
  ) ||
  (
    floorId !== null
      ? `طبقه شماره ${floorId}`
      : ""
  );

  
        /*
         * ساخت FormData مرکزی
         */
        const nextWizardData:
  ProgramProfileWizardData = {
  specifications: {
    forecastId:
      selectedForecastId,
      

    planId,
    

    networkId,

    networkGroupId,

    programName:
  getString(
    planDetail,
    [
      "ProgramName",
      "programName",
      "PlanName",
      "planName",
    ]
  ) ||
  getString(
    forecast,
    [
      "ProgramName",
      "programName",
      "PlanName",
      "planName",
    ]
  ) ||
  programName ||
  `برنامه شماره ${planId}`,

    mainTopic:
      getString(
        forecast,
        [
          "mainTopic",
          "MainTopic",
        ]
      ),

    episodeNumber:
      getNumber(
        forecast,
        [
          "episodeNumber",
          "EpisodeNumber",
        ]
      ),

    duration:
      normalizeTimeSpan(
        getString(
          planDetail,
          [
            "duration",
            "Duration",
            "programDuration",
            "ProgramDuration",
          ]
        )
      ),

    broadcastDate,

    broadcastDateJalali:
      formatJalaliDate(
        broadcastDate
      ),

    productionMethod:
      getString(
        planDetail,
        [
      "ProgramTypeName",
      "programTypeName",

      "ProductionMethod",
      "productionMethod",

      "ProductionTypeName",
      "productionTypeName",
    ]
      ),

    occasion:
  getString(
    planDetail,
    [
      "ApplicationTypeName",
      "applicationTypeName",

      "Occasion",
      "occasion",
    ]
  ) ||
  "بدون مناسبت خاص",

    floorId,

floorName:
  resolvedFloorName,

  programDegreeId:
  degreeId,

programDegreeName:
  resolvedDegreeName,

   programStructureId:
  structureId,

programStructureName:
  resolvedStructureName,

    startTime:
      normalizeClockTime(
        getString(
          planDetail,
          [
            "startTime",
            "StartTime",
            "broadcastTime",
            "BroadcastTime",
          ]
        )
      ),

    hasExpert:
      getBoolean(
        forecast,
        [
          "hasExpert",
          "HasExpert",
        ]
      ),
  },

  crewMembers:
    normalizedCrew,

  items:
    normalizedItems,

  experts: [],
};

        if (!cancelled) {
          setWizardData(
            nextWizardData
          );

          setPersonnelOptions(
            mergeCrewWithPersonnel(
              normalizedCrew,
              normalizedPersonnel
            )
          );

          setActivityOptions(
            mergeCrewWithActivities(
              normalizedCrew,
              normalizedActivities
            )
          );

          setAvailableExperts(
            normalizedExperts
          );

          setTopicAxes(
            normalizedAxes
          );
        }
      } catch (loadError) {
        if (!cancelled) {
          setLoadingError(
            loadError instanceof Error
              ? loadError.message
              : "دریافت اطلاعات شناسنامه انجام نشد."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }


    void loadWizardData();


    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    forecastId,
  ]);


  if (!isOpen) {
    return null;
  }


  return (
    <div
      className="
        fixed inset-0
        z-[70]
        flex
        items-center
        justify-center
        bg-black/50
        p-3
        sm:p-6
      "
      dir="rtl"
    >
      <div
        className="
          flex
          max-h-[94vh]
          w-full
          max-w-7xl
          flex-col
          overflow-hidden
          rounded-2xl
          bg-gray-50
          shadow-2xl
        "
      >
        {/* هدر Modal */}
        <header
          className="
            flex
            shrink-0
            items-start
            justify-between
            gap-4
            border-b
            border-gray-200
            bg-white
            px-5 py-4
          "
        >
          <div>
            <h2
              className="
                text-xl
                font-bold
                text-gray-800
              "
            >
              صدور شناسنامه برنامه
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-gray-500
              "
            >
              اطلاعات شناسنامه را مرحله‌به‌مرحله بررسی و تکمیل کنید.
            </p>
          </div>


          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              isLoading
            }
            className="
              rounded-lg
              p-2
              text-gray-400
              transition
              hover:bg-gray-100
              hover:text-gray-700
              disabled:opacity-40
            "
            aria-label="بستن پنجره"
          >
            <X size={21} />
          </button>
        </header>


        {/* محتوای Scrollable */}
        <div
          className="
            flex-1
            overflow-y-auto
            px-4 py-6
            sm:px-6
          "
        >
          {isLoading ? (
            <div
              className="
                flex
                min-h-80
                flex-col
                items-center
                justify-center
                gap-4
                text-gray-500
              "
            >
              <Loader2
                size={32}
                className="
                  animate-spin
                  text-[#007fcf]
                "
              />

              <p>
                در حال دریافت اطلاعات برنامه...
              </p>
            </div>
          ) : loadingError ? (
            <div
              className="
                mx-auto
                max-w-2xl
                rounded-xl
                border border-red-200
                bg-red-50
                p-6
                text-red-700
              "
            >
              <h3 className="font-bold">
                دریافت اطلاعات امکان‌پذیر نیست
              </h3>

              <p
                className="
                  mt-2
                  text-sm
                  leading-7
                "
              >
                {loadingError}
              </p>

              <button
                type="button"
                onClick={
                  onClose
                }
                className="
                  mt-5
                  rounded-lg
                  border border-red-300
                  bg-white
                  px-4 py-2
                  text-sm
                "
              >
                بستن
              </button>
            </div>
          ) : (
            <>
              <ProfileWizardStepper
                currentStep={
                  currentStep
                }
              />


              {currentStep === 1 && (
                <ProfileSpecificationsStep
                  data={
                    wizardData
                      .specifications
                  }
                  onChange={(
                    specifications
                  ) =>
                    setWizardData(
                      (previous) => ({
                        ...previous,

                        specifications,
                      })
                    )
                  }
                  onNext={() =>
                    setCurrentStep(2)
                  }
                />
              )}


              {currentStep === 2 && (
                <ProfileCrewStep
                  crewMembers={
                    wizardData
                      .crewMembers
                  }
                  personnelOptions={
                    personnelOptions
                  }
                  activityOptions={
                    activityOptions
                  }
                  onChange={(
                    crewMembers
                  ) =>
                    setWizardData(
                      (previous) => ({
                        ...previous,

                        crewMembers,
                      })
                    )
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
                <ProfileItemsStep
                  items={
                    wizardData.items
                  }
                  onChange={(
                    items
                  ) =>
                    setWizardData(
                      (previous) => ({
                        ...previous,

                        items,
                      })
                    )
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
                <ProfileExpertsStep
                  hasExpert={
                    wizardData
                      .specifications
                      .hasExpert
                  }
                  experts={
                    wizardData.experts
                  }
                  availableExperts={
                    availableExperts
                  }
                  topicAxes={
                    topicAxes
                  }
                  expertsError={
                    expertsError
                  }
                  onChange={(
                    experts
                  ) => {
                    setExpertsError("");

                    setWizardData(
                      (previous) => ({
                        ...previous,

                        experts,
                      })
                    );
                  }}
                  onBack={() =>
                    setCurrentStep(3)
                  }
                  onNext={() =>
                    setCurrentStep(5)
                  }
                />
              )}


              {currentStep === 5 && (
                <ProfileFinalReviewStep
                  wizardData={
                    wizardData
                  }
                  onBack={() =>
                    setCurrentStep(4)
                  }
                  onEditStep={(
                    step
                  ) =>
                    setCurrentStep(step)
                  }
                  onSuccess={(
                    profileId
                  ) =>
                    onIssued(
                      profileId
                    )
                  }
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


/*
 * Fetch عمومی با مدیریت پاسخ
 * خالی و غیر JSON
 */
async function fetchJson(
  url: string
): Promise<unknown> {
  const response =
    await fetch(
      url,
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


  const responseData =
    parseJsonResponse(
      responseText
    );


  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        responseData
      ) ??
      (
        "دریافت اطلاعات انجام نشد. " +
        "کد پاسخ: " +
        response.status
      )
    );
  }


  return responseData;
}


/*
 * استخراج یک Object از پاسخ مستقیم
 * یا پاسخ Wrapper
 */
function extractObject(
  value: unknown,
  fields: string[]
): UnknownRecord | null {
  if (!isRecord(value)) {
    return null;
  }


  /*
   * پاسخ مستقیم Forecast
   */
  if (
    typeof value.id ===
      "string" ||
    typeof value.planId ===
      "number"
  ) {
    return value;
  }


  for (const field of fields) {
    const fieldValue =
      value[field];


    if (isRecord(fieldValue)) {
      /*
       * پشتیبانی از:
       * data: {
       *   forecast: {}
       * }
       */
      if (
        isRecord(
          fieldValue.forecast
        )
      ) {
        return fieldValue
          .forecast;
      }


      return fieldValue;
    }
  }


  return null;
}


/*
 * استخراج آرایه از پاسخ‌های مختلف
 */
function extractArray(
  value: unknown,
  fields: string[]
): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }


  if (!isRecord(value)) {
    return [];
  }


  for (const field of fields) {
    const fieldValue =
      value[field];


    if (Array.isArray(fieldValue)) {
      return fieldValue;
    }


    if (isRecord(fieldValue)) {
      const nestedItems =
        fieldValue.items ??
        fieldValue.Items;


      if (
        Array.isArray(
          nestedItems
        )
      ) {
        return nestedItems;
      }
    }
  }


  return [];
}


/*
 * تبدیل عوامل به ساختار داخلی
 */
function normalizeCrewMembers(
  items: unknown[]
): ProfileCrewMemberData[] {
  return items.flatMap(
    (item) => {
      if (!isRecord(item)) {
        return [];
      }


      const personnelId =
        getNumber(
          item,
          [
            "personnelId",
            "PersonnelId",

            "personelId",
            "PersonelId",

            "id",
            "Id",
          ]
        );


      const personnelName =
        getString(
          item,
          [
            "personnelName",
            "PersonnelName",

            "personelName",
            "PersonelName",

            "name",
            "Name",
          ]
        );


      const activityTypeId =
        getNumber(
          item,
          [
            "activityTypeId",
            "ActivityTypeId",
            "activityId",
            "ActivityId",
          ]
        );


      const activityTypeName =
        getString(
          item,
          [
            "activityTypeName",
            "ActivityTypeName",

            "jobName",
            "JobName",

            "activityName",
            "ActivityName",
          ]
        );


      if (
        personnelId === null ||
        !personnelName
      ) {
        return [];
      }


      return [
        {
          personnelId,

          personnelName,

          activityTypeId:
            activityTypeId ?? 0,

          activityTypeName:
            activityTypeName || "",

          isPresent:
            getBoolean(
              item,
              [
                "isPresent",
                "IsPresent",
              ]
            ),
        },
      ];
    }
  );
}


/*
 * تبدیل آیتم‌های برنامه
 */
function normalizeItems(
  items: unknown[]
): ProfileItemData[] {
  return items.flatMap(
    (item) => {
      if (!isRecord(item)) {
        return [];
      }

      const itemName =
        getString(
          item,
          [
            "itemName",
            "ItemName",

            "itemTitle",
            "ItemTitle",

            "name",
            "Name",

            "title",
            "Title",
          ]
        );

      if (!itemName) {
        return [];
      }

      return [
        {
          itemId:
            getNullableNumber(
              item,
              [
                "itemId",
                "ItemId",

                "id",
                "Id",
              ]
            ),

          itemName,

          itemSubject:
            getString(
              item,
              [
                "itemSubject",
                "ItemSubject",

                "subject",
                "Subject",
              ]
            ),

          /*
           * در پاسخ فعلی وب‌سرویس
           * نوع تولید وجود ندارد.
           */
          productionTypeId:
            getNullableNumber(
              item,
              [
                "productionTypeId",
                "ProductionTypeId",
              ]
            ),

          productionType:
            getString(
              item,
              [
                "productionTypeName",
                "ProductionTypeName",

                "productionType",
                "ProductionType",
              ]
            ),

          duration:
            normalizeTimeSpan(
              getString(
                item,
                [
                  "duration",
                  "Duration",

                  "itemDuration",
                  "ItemDuration",

                  "itemPeriod",
                  "ItemPeriod",
                ]
              )
            ),
        },
      ];
    }
  );
}

/*
 * تبدیل گزینه‌های id/name
 */
function normalizeSimpleOptions(
  items: unknown[]
): {
  id: number;
  name: string;
}[] {
  return items.flatMap(
    (item) => {
      if (!isRecord(item)) {
        return [];
      }


      const id =
        getNumber(
          item,
          [
            "id",
            "Id",

            "value",
            "Value",

            "personnelId",
            "PersonnelId",

            "activityTypeId",
            "ActivityTypeId",
          ]
        );


      const name =
        getString(
          item,
          [
            "name",
            "Name",

            "text",
            "Text",

            "title",
            "Title",

            "personnelName",
            "PersonnelName",

            "activityTypeName",
            "ActivityTypeName",
          ]
        );


      return (
        id !== null &&
        name
      )
        ? [
            {
              id,
              name,
            },
          ]
        : [];
    }
  );
}


/*
 * تبدیل کارشناسان
 */
function normalizeExperts(
  items: unknown[]
): ProfileExpertOption[] {
  return items.flatMap(
    (item) => {
      if (!isRecord(item)) {
        return [];
      }


      const id =
        getString(
          item,
          [
            "id",
            "Id",

            "expertId",
            "ExpertId",
          ]
        );


      if (!id) {
        return [];
      }


      return [
        {
          id,

          firstName:
            getString(
              item,
              [
                "firstName",
                "FirstName",
              ]
            ),

          lastName:
            getString(
              item,
              [
                "lastName",
                "LastName",
              ]
            ),
        },
      ];
    }
  );
}


/*
 * محورهای موضوعی
 */
function normalizeTopicAxes(
  value: unknown
): ProfileTopicAxisOption[] {
  if (!Array.isArray(value)) {
    return [];
  }


  return value.flatMap(
    (
      item,
      index
    ) => {
      if (
        typeof item ===
        "string"
      ) {
        return item.trim()
          ? [
              {
                id:
                  `axis-${index}`,

                title:
                  item.trim(),
              },
            ]
          : [];
      }


      if (!isRecord(item)) {
        return [];
      }


      const id =
        getString(
          item,
          [
            "id",
            "Id",
          ]
        );


      const title =
        getString(
          item,
          [
            "title",
            "Title",

            "name",
            "Name",
          ]
        );


      return (
        id &&
        title
      )
        ? [
            {
              id,
              title,
            },
          ]
        : [];
    }
  );
}


/*
 * اضافه‌کردن عوامل فعلی به Dropdown
 * در صورتی که سرویس پرسنل آن‌ها را
 * برنگردانده باشد.
 */
function mergeCrewWithPersonnel(
  crew:
    ProfileCrewMemberData[],
  personnel:
    PersonnelOption[]
): PersonnelOption[] {
  const result = [
    ...personnel,
  ];


  for (const member of crew) {
    if (
      !result.some(
        (item) =>
          item.id ===
          member.personnelId
      )
    ) {
      result.push({
        id:
          member.personnelId,

        name:
          member.personnelName,
      });
    }
  }


  return result;
}


function mergeCrewWithActivities(
  crew:
    ProfileCrewMemberData[],
  activities:
    CrewActivityOption[]
): CrewActivityOption[] {
  const result = [
    ...activities,
  ];


  for (const member of crew) {
    if (
      member.activityTypeId > 0 &&
      member.activityTypeName.trim() &&
      !result.some(
        (item) =>
          item.id ===
          member.activityTypeId
      )
    ) {
      result.push({
        id:
          member.activityTypeId,

        name:
          member.activityTypeName,
      });
    }
  }


  return result;
}


/*
 * استخراج اولین Object از پاسخ مستقیم یا Wrapperهای
 * استاندارد سرویس اطلاعات پایه، از جمله Data: [{}].
 */
function extractFirstObject(
  value: unknown,
  fields: string[]
): UnknownRecord | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const result =
        extractFirstObject(
          item,
          fields
        );

      if (result) {
        return result;
      }
    }

    return null;
  }


  if (!isRecord(value)) {
    return null;
  }


  if (
    hasAnyProperty(
      value,
      [
        "planId",
        "PlanId",
        "programName",
        "ProgramName",
        "planName",
        "PlanName",
        "productionMethod",
        "ProductionMethod",
        "productionType",
        "ProductionType",
        "floorId",
        "FloorId",
        "degreeId",
        "DegreeId",
        "programDegreeId",
        "ProgramDegreeId",
        "structureId",
        "StructureId",
        "programStructureId",
        "ProgramStructureId",
      ]
    )
  ) {
    return value;
  }


  for (const field of fields) {
    const fieldValue =
      value[field];

    if (
      Array.isArray(fieldValue) ||
      isRecord(fieldValue)
    ) {
      const result =
        extractFirstObject(
          fieldValue,
          fields
        );

      if (result) {
        return result;
      }
    }
  }


  return null;
}


/*
 * jobId از خروجی estimateDetail/{planId} استخراج می‌شود.
 * غلط املایی bussiness نیز برای سازگاری با Backend پوشش
 * داده شده است.
 */
function extractJobIds(
  crewItems: unknown[]
): number[] {
  const jobIds =
    crewItems.flatMap(
      (item) => {
        if (!isRecord(item)) {
          return [];
        }

        const jobId =
          getNumber(
            item,
            [
              "jobId",
              "JobId",
              "businessTypeId",
              "BusinessTypeId",
              "bussinessTypeId",
              "BussinessTypeId",
            ]
          );

        return (
          jobId !== null &&
          jobId > 0
        )
          ? [jobId]
          : [];
      }
    );

  return Array.from(
    new Set(jobIds)
  );
}


function removeDuplicateOptions<
  T extends {
    id: number;
    name: string;
  }
>(
  options: T[]
): T[] {
  return Array.from(
    new Map(
      options.map(
        (option) => [
          option.id,
          option,
        ]
      )
    ).values()
  );
}


function hasAnyProperty(
  value: UnknownRecord,
  propertyNames: string[]
): boolean {
  return propertyNames.some(
    (propertyName) =>
      propertyName in value
  );
}


function getString(
  value:
    UnknownRecord,
  fields:
    string[]
): string {
  for (const field of fields) {
    const fieldValue =
      value[field];


    if (
      typeof fieldValue ===
        "string" &&
      fieldValue.trim()
    ) {
      return fieldValue.trim();
    }
  }


  return "";
}


function getNumber(
  value:
    UnknownRecord,
  fields:
    string[]
): number | null {
  for (const field of fields) {
    const fieldValue =
      value[field];


    const numericValue =
      typeof fieldValue ===
        "number"
        ? fieldValue
        : typeof fieldValue ===
              "string" &&
            fieldValue.trim()
          ? Number(
              normalizeDigits(
                fieldValue
              )
            )
          : Number.NaN;


    if (
      Number.isFinite(
        numericValue
      )
    ) {
      return numericValue;
    }
  }


  return null;
}


function getBoolean(
  value:
    UnknownRecord,
  fields:
    string[]
): boolean {
  for (const field of fields) {
    const fieldValue =
      value[field];


    if (
      fieldValue === true ||
      fieldValue === "true" ||
      fieldValue === 1 ||
      fieldValue === "1"
    ) {
      return true;
    }


    if (
      fieldValue === false ||
      fieldValue === "false" ||
      fieldValue === 0 ||
      fieldValue === "0"
    ) {
      return false;
    }
  }


  return false;
}


function normalizeTimeSpan(
  value: string
): string {
  const normalizedValue =
    normalizeDigits(
      value.trim()
    );

  if (!normalizedValue) {
    return "00:00:00";
  }

  /*
   * حذف اعشار انتهای TimeSpan:
   * 00:05:00.0000000
   * تبدیل می‌شود به:
   * 00:05:00
   */
  const withoutFraction =
    normalizedValue.replace(
      /(\d{2}:\d{2}:\d{2})\.\d+$/,
      "$1"
    );

  if (
    /^\d{2,}:[0-5]\d:[0-5]\d$/
      .test(withoutFraction)
  ) {
    return withoutFraction;
  }

  return "00:00:00";
}


function normalizeClockTime(
  value: string
): string {
  const normalized =
    normalizeTimeSpan(
      value
    );


  return normalized ||
    "00:00:00";
}


function formatJalaliDate(
  value: string
): string {
  if (!value) {
    return "";
  }


  const date =
    new Date(
      normalizeDigits(
        value
      )
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
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


  const fields = [
    "message",
    "Message",

    "description",
    "Description",

    "detail",
    "MessageDetail",
  ];


  for (const field of fields) {
    const fieldValue =
      value[field];


    if (
      typeof fieldValue ===
        "string" &&
      fieldValue.trim()
    ) {
      return fieldValue;
    }
  }


  return null;
}


function normalizeDigits(
  value: string
): string {
  return value
    .replace(
      /[۰-۹]/g,
      (digit) =>
        String(
          "۰۱۲۳۴۵۶۷۸۹"
            .indexOf(
              digit
            )
        )
    )
    .replace(
      /[٠-٩]/g,
      (digit) =>
        String(
          "٠١٢٣٤٥٦٧٨٩"
            .indexOf(
              digit
            )
        )
    );
}


function findProgramName(
  response: unknown,
  planId: number
): string {
  const programItems =
    extractArray(
      response,
      [
        "programs",
        "Programs",

        "items",
        "Items",

        "data",
        "Data",

        "result",
        "Result",
      ]
    );


  for (
    const item of
    programItems
  ) {
    if (!isRecord(item)) {
      continue;
    }


    const itemId =
      getNumber(
        item,
        [
          "id",
          "Id",

          "planId",
          "PlanId",

          "value",
          "Value",
        ]
      );


    if (
      itemId !== planId
    ) {
      continue;
    }


    const itemName =
      getString(
        item,
        [
          "name",
          "Name",

          "planName",
          "PlanName",

          "programName",
          "ProgramName",

          "text",
          "Text",

          "title",
          "Title",
        ]
      );


    if (itemName) {
      return itemName;
    }
  }


  return "";
}

function isRecord(
  value: unknown
): value is UnknownRecord {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function findLookupName(
  options: Array<{
    id: number;
    name: string;
  }>,

  selectedId:
    number | null
): string {
  if (selectedId === null) {
    return "";
  }


  return (
    options.find(
      (option) =>
        option.id ===
        selectedId
    )?.name ??
    ""
  );
}



function getNullableNumber(
  value: Record<
    string,
    unknown
  >,
  propertyNames:
    string[]
): number | null {
  for (
    const propertyName of
    propertyNames
  ) {
    const propertyValue =
      value[propertyName];

    if (
      typeof propertyValue ===
        "number" &&
      Number.isFinite(
        propertyValue
      )
    ) {
      return propertyValue;
    }

    if (
      typeof propertyValue ===
        "string" &&
      propertyValue.trim()
    ) {
      const numericValue =
        Number(
          normalizeDigits(
            propertyValue
          )
        );

      if (
        Number.isFinite(
          numericValue
        )
      ) {
        return numericValue;
      }
    }
  }

  return null;
}