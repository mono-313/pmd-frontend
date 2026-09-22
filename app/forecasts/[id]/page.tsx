"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  AlertCircle,
  ArrowRight,
  FileText,
  LoaderCircle,
} from "lucide-react";

import ForecastStatusBadge
  from "@/app/component/forecast/forecast-status-badge";

import ForecastReviewFeedback
  from "@/app/component/forecast/ForecastReviewFeedback";

import type {
  ForecastStatus,
} from "@/app/types/forecast";

import type {
  Program,
} from "@/app/types/wizard";


interface TopicAxis {
  id:
    string;

  title:
    string;

  displayOrder:
    number;
}


interface ForecastDetails {
  id:
    string;

  planId:
    number;

  networkId:
    number;

  networkGroupId:
    number | null;

  episodeNumber:
    number | null;

  broadcastDate:
    string;

  mainTopic:
    string;

  hasExpert:
    boolean;

  status:
    ForecastStatus;

  topicAxes:
    TopicAxis[];

  expertIds:
    string[];

  createdByUserId?:
    string;

  createdByUserName?:
    string;

  createdDate?:
    string;

  lastModifiedDate?:
    string;

  reviewedByUserId?:
    string;

  /*
   * توضیح آخرین اقدام مدیر:
   * رد یا بازگشت برای اصلاح
   */
  lastActionReason:
    string | null;
}


interface ExpertDetails {
  id:
    string;

  firstName:
    string;

  lastName:
    string;

  specialty:
    string;

  education:
    number | null;

  workplace:
    string;

  mobilePhone:
    string;

  nationalCode:
    string;

  workPhone?:
    string;
}


export default function ForecastViewPage() {
  const router =
    useRouter();

  const params =
    useParams<{
      id: string;
    }>();

  const forecastId =
    typeof params.id ===
      "string"
      ? params.id.trim()
      : "";


  const [
    forecast,
    setForecast,
  ] = useState<
    ForecastDetails | null
  >(null);

  const [
    programName,
    setProgramName,
  ] = useState("");

  const [
    experts,
    setExperts,
  ] = useState<
    ExpertDetails[]
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


    async function loadPageData() {
      try {
        setIsLoading(true);
        setError("");

        if (!forecastId) {
          throw new Error(
            "شناسه پیش‌بینی معتبر نیست."
          );
        }


        /*
         * دریافت اطلاعات پیش‌بینی
         */
        const forecastResponse =
  await fetch(
    `/api/forecasts/${encodeURIComponent(
      forecastId
    )}`,
    {
      method:
        "GET",

      headers: {
        Accept:
          "application/json",
      },

      cache:
        "no-store",
    }
  );
  
        const forecastData =
          await readJsonResponse(
            forecastResponse
          );


        if (!forecastResponse.ok) {
          throw new Error(
            getApiMessage(
              forecastData
            ) ??
              (
                "دریافت اطلاعات پیش‌بینی انجام نشد. " +
                `کد پاسخ: ${forecastResponse.status}`
              )
          );
        }


        const normalizedForecast =
          parseForecastDetails(
            forecastData,
            forecastId
          );


        if (!normalizedForecast) {
          console.error(
            "Invalid forecast details:",
            forecastData
          );

          throw new Error(
            "اطلاعات پیش‌بینی در پاسخ سرور پیدا نشد."
          );
        }


        if (cancelled) {
          return;
        }


        setForecast(
          normalizedForecast
        );


        /*
         * دریافت نام برنامه و
         * اطلاعات کارشناسان
         */
        const [
          loadedProgramName,
          loadedExperts,
        ] =
          await Promise.all([
            loadProgramName(
              normalizedForecast
                .planId
            ),

            loadExperts(
              normalizedForecast
                .expertIds
            ),
          ]);


        if (!cancelled) {
          setProgramName(
            loadedProgramName
          );

          setExperts(
            loadedExperts
          );
        }
      } catch (loadError) {
        if (!cancelled) {
          setForecast(null);
          setProgramName("");
          setExperts([]);

          setError(
            loadError instanceof Error
              ? loadError.message
              : "دریافت اطلاعات پیش‌بینی انجام نشد."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }


    void loadPageData();


    return () => {
      cancelled =
        true;
    };
  }, [
    forecastId,
  ]);


  const sortedTopicAxes =
    useMemo(
      () =>
        forecast
          ? [
              ...forecast.topicAxes,
            ].sort(
              (
                firstAxis,
                secondAxis
              ) =>
                firstAxis
                  .displayOrder -
                secondAxis
                  .displayOrder
            )
          : [],
      [
        forecast,
      ]
    );


  if (isLoading) {
    return (
      <main
        className="
          min-h-screen
          bg-gray-50
          px-4 py-10
        "
        dir="rtl"
      >
        <div
          className="
            mx-auto
            flex max-w-5xl
            items-center
            justify-center
            gap-3
            rounded-2xl
            border border-gray-200
            bg-white
            p-10
            text-gray-600
            shadow-sm
          "
        >
          <LoaderCircle
            size={22}
            className="animate-spin"
          />

          در حال دریافت اطلاعات پیش‌بینی...
        </div>
      </main>
    );
  }


  if (
    error ||
    !forecast
  ) {
    return (
      <main
        className="
          min-h-screen
          bg-gray-50
          px-4 py-10
        "
        dir="rtl"
      >
        <section
          className="
            mx-auto
            max-w-3xl
            rounded-2xl
            border border-red-200
            bg-red-50
            p-6
            text-red-700
          "
        >
          <div
            className="
              flex
              items-start
              gap-3
            "
          >
            <AlertCircle
              size={22}
              className="shrink-0"
            />

            <div>
              <h1 className="font-bold">
                نمایش پیش‌بینی امکان‌پذیر نیست
              </h1>

              <p className="mt-2 text-sm">
                {error ||
                  "اطلاعات پیش‌بینی پیدا نشد."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
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
          max-w-5xl
        "
      >
        <header
          className="
            mb-6
            flex flex-col
            gap-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <h1
              className="
                flex items-center gap-2
                text-2xl font-bold
                text-gray-800
              "
            >
              <FileText
                size={25}
                className="text-[#007fcf]"
              />

              مشاهده پیش‌بینی
            </h1>

            <p
              className="
                mt-2
                text-sm
                text-gray-500
              "
            >
              اطلاعات ثبت‌شده پیش‌بینی به‌صورت فقط‌خواندنی
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/forecasts"
              )
            }
            className="
              flex h-11
              items-center
              justify-center
              gap-2
              rounded-lg
              border border-gray-300
              bg-white
              px-4
              text-sm font-semibold
              text-gray-700
              hover:bg-gray-100
            "
          >
            <ArrowRight
              size={18}
            />

            بازگشت به فهرست
          </button>
        </header>


        <ViewSection
          title="مشخصات برنامه"
        >
          <div className="overflow-x-auto">
            <table
              className="
                w-full
                min-w-[700px]
                border-collapse
              "
            >
              <tbody>
                <ViewRow
                  label="نام برنامه"
                  value={
                    programName ||
                    (
                      forecast.planId > 0
                        ? `شناسه برنامه: ${toPersianNumber(
                            forecast.planId
                          )}`
                        : "—"
                    )
                  }
                />

                <ViewRow
                  label="شماره قسمت"
                  value={
                    forecast.episodeNumber !==
                    null
                      ? toPersianNumber(
                          forecast
                            .episodeNumber
                        )
                      : "—"
                  }
                />

                <ViewRow
                  label="موضوع اصلی"
                  value={
                    forecast.mainTopic
                  }
                />

                <ViewRow
                  label="تاریخ پخش"
                  value={
                    formatPersianDate(
                      forecast.broadcastDate
                    )
                  }
                />

                <ViewRow
                  label="دارای کارشناس"
                  value={
                    forecast.hasExpert
                      ? "بله"
                      : "خیر"
                  }
                />

                <tr
                  className="
                    border-t
                    border-gray-100
                  "
                >
                  <th
                    className="
                      w-52
                      bg-gray-50
                      px-4 py-4
                      text-right
                      text-sm font-semibold
                      text-gray-600
                    "
                  >
                    وضعیت
                  </th>

                  <td className="px-4 py-4">
                    <ForecastStatusBadge
                      status={
                        forecast.status
                      }
                    />
                  </td>
                </tr>

                <ViewRow
                  label="ثبت‌کننده"
                  value={
                    forecast
                      .createdByUserName ||
                    "—"
                  }
                />

                <ViewRow
                  label="تاریخ ثبت"
                  value={
                    forecast.createdDate
                      ? formatPersianDate(
                          forecast
                            .createdDate
                        )
                      : "—"
                  }
                />

                {forecast.lastModifiedDate && (
                  <ViewRow
                    label="آخرین تغییر"
                    value={
                      formatPersianDate(
                        forecast
                          .lastModifiedDate
                      )
                    }
                  />
                )}
              </tbody>
            </table>
          </div>
        </ViewSection>


        {/*
         * نمایش توضیحات مدیر فقط در
         * وضعیت رد یا بازگشت برای اصلاح
         */}
        <ForecastReviewFeedback
          status={
            forecast.status
          }
          reason={
            forecast.lastActionReason
          }
        />


        <ViewSection
          title="محورهای موضوعی"
        >
          <div className="overflow-x-auto">
            <table
              className="
                w-full
                min-w-[600px]
                border-collapse
                text-sm
              "
            >
              <thead
                className="
                  bg-gray-50
                  text-gray-600
                "
              >
                <tr>
                  <th
                    className="
                      w-24
                      px-4 py-4
                      text-right
                    "
                  >
                    ردیف
                  </th>

                  <th
                    className="
                      px-4 py-4
                      text-right
                    "
                  >
                    موضوع پیشنهادی
                  </th>
                </tr>
              </thead>

              <tbody>
                {sortedTopicAxes.map(
                  (
                    topicAxis,
                    index
                  ) => (
                    <tr
                      key={
                        topicAxis.id ||
                        `${topicAxis.title}-${index}`
                      }
                      className="
                        border-t
                        border-gray-100
                      "
                    >
                      <td
                        className="
                          px-4 py-4
                          text-gray-500
                        "
                      >
                        {toPersianNumber(
                          index + 1
                        )}
                      </td>

                      <td
                        className="
                          px-4 py-4
                          font-semibold
                          text-gray-700
                        "
                      >
                        {
                          topicAxis.title
                        }
                      </td>
                    </tr>
                  )
                )}

                {sortedTopicAxes.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={2}
                      className="
                        px-4 py-8
                        text-center
                        text-gray-500
                      "
                    >
                      محور موضوعی ثبت نشده است.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ViewSection>


        <ViewSection
          title="کارشناسان برنامه"
        >
          {!forecast.hasExpert ? (
            <div
              className="
                rounded-lg
                bg-gray-50
                p-5
                text-sm
                text-gray-600
              "
            >
              این برنامه کارشناس ندارد.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="
                  w-full
                  min-w-[850px]
                  border-collapse
                  text-sm
                "
              >
                <thead
                  className="
                    bg-gray-50
                    text-gray-600
                  "
                >
                  <tr>
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
                      مقطع تحصیلی
                    </th>

                    <th className={tableHeaderClass}>
                      محل کار
                    </th>

                    <th className={tableHeaderClass}>
                      کد ملی
                    </th>
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
                          expert.id
                        }
                        className="
                          border-t
                          border-gray-100
                        "
                      >
                        <td className={tableCellClass}>
                          {toPersianNumber(
                            index + 1
                          )}
                        </td>

                        <td
                          className={`
                            ${tableCellClass}
                            font-semibold
                            text-gray-800
                          `}
                        >
                          {`${expert.firstName} ${expert.lastName}`.trim() ||
                            "—"}
                        </td>

                        <td className={tableCellClass}>
                          {expert.specialty ||
                            "—"}
                        </td>

                        <td className={tableCellClass}>
                          {getEducationTitle(
                            expert.education
                          )}
                        </td>

                        <td className={tableCellClass}>
                          {expert.workplace ||
                            "—"}
                        </td>

                        <td className={tableCellClass}>
                          {expert.nationalCode ||
                            "—"}
                        </td>
                      </tr>
                    )
                  )}

                  {experts.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="
                          px-4 py-8
                          text-center
                          text-gray-500
                        "
                      >
                        اطلاعات کارشناسان دریافت نشد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </ViewSection>
      </section>
    </main>
  );
}


/*
 * دریافت نام برنامه
 */
async function loadProgramName(
  planId: number
): Promise<string> {
  if (
    !Number.isInteger(planId) ||
    planId <= 0
  ) {
    return "";
  }

  try {
    const response =
      await fetch(
        "/api/programs",
        {
          method:
            "GET",

          headers: {
            Accept:
              "application/json",
          },

          cache:
            "no-store",
        }
      );

    const responseData =
      await readJsonResponse(
        response
      );

    if (
      !response.ok ||
      !isRecord(responseData) ||
      !Array.isArray(
        responseData.programs
      )
    ) {
      return "";
    }

    const programs =
      responseData.programs.filter(
        isProgram
      );

    return (
      programs.find(
        (program) =>
          program.id ===
          planId
      )?.name ?? ""
    );
  } catch {
    return "";
  }
}


/*
 * دریافت اطلاعات کارشناسان
 */
async function loadExperts(
  expertIds: string[]
): Promise<ExpertDetails[]> {
  if (
    expertIds.length === 0
  ) {
    return [];
  }

  const results =
    await Promise.allSettled(
      expertIds.map(
        async (
          expertId
        ) => {
          const response =
            await fetch(
              `/api/experts/${encodeURIComponent(
                expertId
              )}`,
              {
                method:
                  "GET",

                headers: {
                  Accept:
                    "application/json",
                },

                cache:
                  "no-store",
              }
            );

          const responseData =
            await readJsonResponse(
              response
            );

          if (!response.ok) {
            throw new Error(
              getApiMessage(
                responseData
              ) ??
                "دریافت اطلاعات کارشناس انجام نشد."
            );
          }

          const expert =
            parseExpertDetails(
              responseData
            );

          if (!expert) {
            throw new Error(
              "ساختار اطلاعات کارشناس معتبر نیست."
            );
          }

          return expert;
        }
      )
    );

  return results.flatMap(
    (result) =>
      result.status ===
        "fulfilled"
        ? [
            result.value,
          ]
        : []
  );
}


/*
 * استخراج اطلاعات Forecast
 * به‌صورت غیرسخت‌گیرانه
 */
function parseForecastDetails(
  value: unknown,
  fallbackId: string
): ForecastDetails | null {
  const source =
    findForecastObject(
      value
    );

  if (!source) {
    return null;
  }

  const id =
    getIdentifier(
      source.id
    ) ||
    fallbackId;

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
            ): topic is TopicAxis =>
              topic !== null
          )
      : [];

  const expertIds =
    extractExpertIds(
      source
    );

  const lastActionReason =
    getString(
      source.lastActionReason
    ) ||
    getString(
      source.returnReason
    ) ||
    getString(
      source.rejectionReason
    ) ||
    null;

  return {
    id,

    planId:
      getNumber(
        source.planId
      ) ?? 0,

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

    broadcastDate:
      getString(
        source.broadcastDate
      ),

    mainTopic:
      getString(
        source.mainTopic
      ) ||
      "—",

    hasExpert:
      getBoolean(
        source.hasExpert
      ),

    status:
      normalizeStatus(
        source.status
      ),

    topicAxes,

    expertIds,

    createdByUserId:
      getString(
        source.createdByUserId
      ) ||
      undefined,

    createdByUserName:
      getString(
        source.createdByUserName
      ) ||
      undefined,

    createdDate:
      getString(
        source.createdDate
      ) ||
      undefined,

    lastModifiedDate:
      getString(
        source.lastModifiedDate
      ) ||
      undefined,

    reviewedByUserId:
      getString(
        source.reviewedByUserId
      ) ||
      undefined,

    lastActionReason,
  };
}


function extractExpertIds(
  source: Record<
    string,
    unknown
  >
): string[] {
  if (
    Array.isArray(
      source.expertIds
    )
  ) {
    return source.expertIds
      .map(
        getIdentifier
      )
      .filter(
        (
          expertId
        ) =>
          expertId.length > 0
      );
  }

  /*
   * پشتیبانی از حالتی که Backend
   * آرایه experts برگرداند.
   */
  if (
    Array.isArray(
      source.experts
    )
  ) {
    return source.experts
      .map(
        (
          expert
        ) => {
          if (!isRecord(expert)) {
            return "";
          }

          return (
            getIdentifier(
              expert.expertId
            ) ||
            getIdentifier(
              expert.id
            )
          );
        }
      )
      .filter(
        (
          expertId
        ) =>
          expertId.length > 0
      );
  }

  return [];
}


function parseTopicAxis(
  value: unknown,
  index: number
): TopicAxis | null {
  /*
   * اگر Backend فقط عنوان را
   * به‌صورت string برگرداند.
   */
  if (
    typeof value ===
      "string"
  ) {
    const title =
      value.trim();

    if (!title) {
      return null;
    }

    return {
      id:
        `topic-${index}`,

      title,

      displayOrder:
        index + 1,
    };
  }

  if (!isRecord(value)) {
    return null;
  }

  const title =
    getString(
      value.title
    ) ||
    getString(
      value.name
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


function parseExpertDetails(
  value: unknown
): ExpertDetails | null {
  const source =
    unwrapResponseObject(
      value,
      [
        "expert",
        "data",
        "result",
      ]
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

  /*
   * فقط شناسه برای معتبر بودن
   * پاسخ الزامی است.
   */
  if (!id) {
    return null;
  }

  return {
    id,

    firstName,

    lastName,

    specialty:
      getString(
        source.specialty
      ),

    education:
      getNumber(
        source.education
      ),

    workplace:
      getString(
        source.workplace
      ),

    mobilePhone:
      getString(
        source.mobilePhone
      ),

    nationalCode:
      getString(
        source.nationalCode
      ),

    workPhone:
      getString(
        source.workPhone
      ) ||
      undefined,
  };
}


function findForecastObject(
  value: unknown,
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

  if (
    "id" in value ||
    "mainTopic" in value ||
    "planId" in value
  ) {
    return value;
  }

  const wrapperNames = [
    "forecast",
    "data",
    "result",
    "value",
    "item",
  ];

  for (
    const wrapperName of
    wrapperNames
  ) {
    const result =
      findForecastObject(
        value[wrapperName],
        depth + 1
      );

    if (result) {
      return result;
    }
  }

  return null;
}


function unwrapResponseObject(
  value: unknown,
  propertyNames:
    string[]
): Record<
  string,
  unknown
> | null {
  if (!isRecord(value)) {
    return null;
  }

  for (
    const propertyName of
    propertyNames
  ) {
    const nestedValue =
      value[propertyName];

    if (
      isRecord(
        nestedValue
      )
    ) {
      return nestedValue;
    }
  }

  return value;
}


function normalizeStatus(
  status: unknown
): ForecastStatus {
  const value =
    String(
      status ?? ""
    ).trim();

  const statusMap:
    Record<
      string,
      ForecastStatus
    > = {
    "1":
      "Draft",

    Draft:
      "Draft",

    "2":
      "PendingReview",

    PendingReview:
      "PendingReview",

    "3":
      "Approved",

    Approved:
      "Approved",

    "4":
      "Rejected",

    Rejected:
      "Rejected",

    "5":
      "ReturnedForEdit",

    ReturnedForEdit:
      "ReturnedForEdit",
  };

  return (
    statusMap[value] ??
    "Draft"
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


/*
 * خواندن امن پاسخ JSON
 */
async function readJsonResponse(
  response: Response
): Promise<unknown | null> {
  const responseText =
    await response.text();

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


function getApiMessage(
  value: unknown
): string | null {
  if (!isRecord(value)) {
    return null;
  }

  const message =
    getString(
      value.message
    ) ||
    getString(
      value.description
    ) ||
    getString(
      value.detail
    ) ||
    getString(
      value.title
    );

  if (message) {
    return message;
  }

  if (
    isRecord(
      value.details
    )
  ) {
    return (
      getString(
        value.details.message
      ) ||
      getString(
        value.details.detail
      ) ||
      null
    );
  }

  return null;
}


function getString(
  value: unknown
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}


function getIdentifier(
  value: unknown
): string {
  if (
    typeof value ===
      "string"
  ) {
    return value.trim();
  }

  if (
    typeof value ===
      "number" &&
    Number.isFinite(value)
  ) {
    return String(value);
  }

  return "";
}


function getNumber(
  value: unknown
): number | null {
  if (
    typeof value ===
      "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value ===
      "string" &&
    value.trim()
  ) {
    const parsedValue =
      Number(
        normalizeDigits(
          value
        )
      );

    return Number.isFinite(
      parsedValue
    )
      ? parsedValue
      : null;
  }

  return null;
}


function getBoolean(
  value: unknown
): boolean {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true" ||
    value === "True"
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


function formatPersianDate(
  value: string
): string {
  if (!value) {
    return "—";
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
    return value;
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

      hour:
        "2-digit",

      minute:
        "2-digit",

      timeZone:
        "UTC",
    }
  ).format(date);
}


function getEducationTitle(
  education:
    number | null
): string {
  const educationTitles:
    Record<
      number,
      string
    > = {
    1:
      "دیپلم",

    2:
      "فوق دیپلم",

    3:
      "لیسانس",

    4:
      "فوق لیسانس",

    5:
      "دکترا",
  };

  if (education === null) {
    return "—";
  }

  return (
    educationTitles[
      education
    ] ??
    toPersianNumber(
      education
    )
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
      (
        digit
      ) =>
        String(
          persianDigits.indexOf(
            digit
          )
        )
    )
    .replace(
      /[٠-٩]/g,
      (
        digit
      ) =>
        String(
          arabicDigits.indexOf(
            digit
          )
        )
    );
}


function toPersianNumber(
  value:
    string | number
): string {
  return String(value).replace(
    /\d/g,
    (
      digit
    ) =>
      "۰۱۲۳۴۵۶۷۸۹"[
        Number(digit)
      ]
  );
}


function ViewSection({
  title,
  children,
}: {
  title:
    string;

  children:
    ReactNode;
}) {
  return (
    <section
      className="
        mb-6
        overflow-hidden
        rounded-2xl
        border border-gray-200
        bg-white
        shadow-sm
      "
    >
      <header
        className="
          border-b
          border-gray-200
          bg-gray-50/70
          px-5 py-4
        "
      >
        <h2
          className="
            font-bold
            text-gray-800
          "
        >
          {title}
        </h2>
      </header>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
}


function ViewRow({
  label,
  value,
}: {
  label:
    string;

  value:
    ReactNode;
}) {
  return (
    <tr
      className="
        border-t
        border-gray-100
        first:border-t-0
      "
    >
      <th
        className="
          w-52
          bg-gray-50
          px-4 py-4
          text-right
          text-sm font-semibold
          text-gray-600
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
        {value}
      </td>
    </tr>
  );
}


const tableHeaderClass = `
  whitespace-nowrap
  px-4 py-4
  text-right
  text-xs font-bold
  text-gray-600
`;


const tableCellClass = `
  whitespace-nowrap
  px-4 py-4
  text-sm
  text-gray-600
`;