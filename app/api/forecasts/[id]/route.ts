import {
  NextResponse,
} from "next/server";

import {
  cookies,
} from "next/headers";

import {
  API_CONFIG,
  API_ENDPOINTS,
} from "@/app/lib/api-config";

import type {
  ForecastStatus,
  UpdateForecastRequest,
} from "@/app/types/forecast";


interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}


/*
 * GET /api/forecasts/{id}
 *
 * دریافت اطلاعات یک پیش‌بینی
 */
export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const {
      id: rawId,
    } = await context.params;

    const forecastId =
      rawId?.trim();

    if (!forecastId) {
      return jsonError(
        "شناسه پیش‌بینی معتبر نیست.",
        400
      );
    }


    const accessToken =
      await getAccessToken();

    if (!accessToken) {
      return jsonError(
        "نشست کاربری معتبر نیست.",
        401
      );
    }


    const backendUrl =
      buildForecastUrl(
        forecastId
      );


    const backendResponse =
      await fetch(
        backendUrl,
        {
          method:
            "GET",

          headers: {
            Accept:
              "application/json",

            Authorization:
              `Bearer ${accessToken}`,
          },

          cache:
            "no-store",
        }
      );


    const responseText =
      await backendResponse.text();

    const responseData =
      parseJsonResponse(
        responseText
      );


    console.log(
      "GET FORECAST BY ID:",
      {
        forecastId,

        backendUrl,

        status:
          backendResponse.status,

        response:
          responseData ??
          responseText,
      }
    );


    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message:
            getErrorMessage(
              responseData
            ) ??
            (
              "دریافت اطلاعات پیش‌بینی انجام نشد. " +
              `کد پاسخ Backend: ${backendResponse.status}`
            ),

          details:
            responseData ??
            responseText.slice(
              0,
              1000
            ),
        },
        {
          status:
            backendResponse.status,
        }
      );
    }


    if (!responseText.trim()) {
      return jsonError(
        "اطلاعات پیش‌بینی در پاسخ Backend وجود ندارد.",
        502
      );
    }


    if (responseData === null) {
      return NextResponse.json(
        {
          message:
            "پاسخ Backend از نوع JSON معتبر نیست.",

          details:
            responseText.slice(
              0,
              1000
            ),
        },
        {
          status: 502,
        }
      );
    }


    const source =
      extractForecastObject(
        responseData
      );


    if (!source) {
      console.error(
        "Forecast object was not found:",
        responseData
      );

      return NextResponse.json(
        {
          message:
            "اطلاعات پیش‌بینی در پاسخ Backend پیدا نشد.",

          details:
            responseData,
        },
        {
          status: 502,
        }
      );
    }


    /*
     * تطبیق پاسخ واقعی Backend
     * با مدل مورد استفاده Frontend
     */
    const forecast =
      normalizeForecast(
        source,
        forecastId
      );


    return NextResponse.json(
      forecast,
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Get forecast by id route error:",
      error
    );

    return jsonError(
      "ارتباط با وب‌سرویس دریافت پیش‌بینی برقرار نشد.",
      500
    );
  }
}


/*
 * PUT /api/forecasts/{id}
 *
 * ویرایش پیش‌بینی
 */
export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const {
      id: rawId,
    } = await context.params;

    const forecastId =
      rawId?.trim();

    if (!forecastId) {
      return jsonError(
        "شناسه پیش‌بینی معتبر نیست.",
        400
      );
    }


    const accessToken =
      await getAccessToken();

    if (!accessToken) {
      return jsonError(
        "نشست کاربری معتبر نیست.",
        401
      );
    }


    const requestData =
      await request.json() as
        unknown;


    if (!isRecord(requestData)) {
      return jsonError(
        "ساختار اطلاعات ویرایش معتبر نیست.",
        400
      );
    }


    const broadcastDate =
      normalizeDigits(
        readString(
          requestData.broadcastDate
        )
      );

    const mainTopic =
      readString(
        requestData.mainTopic
      );

    const hasExpert =
      readBoolean(
        requestData.hasExpert
      );

    const topicAxes =
      readStringArray(
        requestData.topicAxes
      );

    const expertIds =
      readStringArray(
        requestData.expertIds
      );


    if (!broadcastDate) {
      return jsonError(
        "تاریخ پخش الزامی است.",
        400
      );
    }


    if (
      Number.isNaN(
        Date.parse(
          broadcastDate
        )
      )
    ) {
      return jsonError(
        "فرمت تاریخ پخش معتبر نیست.",
        400
      );
    }


    if (!mainTopic) {
      return jsonError(
        "موضوع اصلی الزامی است.",
        400
      );
    }


    if (
      typeof requestData.hasExpert !==
        "boolean"
    ) {
      return jsonError(
        "وضعیت کارشناس معتبر نیست.",
        400
      );
    }


    if (topicAxes.length === 0) {
      return jsonError(
        "حداقل یک محور موضوعی الزامی است.",
        400
      );
    }


    if (
      hasExpert &&
      expertIds.length === 0
    ) {
      return jsonError(
        "برای برنامه دارای کارشناس، حداقل یک کارشناس انتخاب کنید.",
        400
      );
    }


    /*
     * مطابق مستند جدید:
     *
     * planId
     * networkId
     * networkGroupId
     * episodeNumber
     *
     * در Update ارسال نمی‌شوند.
     */
    const backendBody:
      UpdateForecastRequest = {
      id:
        forecastId,

      broadcastDate,

      mainTopic,

      hasExpert,

      topicAxes,

      expertIds:
        hasExpert
          ? expertIds
          : [],
    };


    const backendUrl =
      buildForecastUrl(
        forecastId
      );


    console.log(
      "UPDATE FORECAST REQUEST:",
      {
        backendUrl,
        backendBody,
      }
    );


    const backendResponse =
      await fetch(
        backendUrl,
        {
          method:
            "PUT",

          headers: {
            Accept:
              "application/json",

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${accessToken}`,
          },

          body:
            JSON.stringify(
              backendBody
            ),

          cache:
            "no-store",
        }
      );


    const responseText =
      await backendResponse.text();

    const responseData =
      parseJsonResponse(
        responseText
      );


    console.log(
      "UPDATE FORECAST RESPONSE:",
      {
        status:
          backendResponse.status,

        response:
          responseData ??
          responseText,
      }
    );


    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message:
            getErrorMessage(
              responseData
            ) ??
            (
              "ویرایش پیش‌بینی انجام نشد. " +
              `کد پاسخ Backend: ${backendResponse.status}`
            ),

          details:
            responseData ??
            responseText.slice(
              0,
              1000
            ),
        },
        {
          status:
            backendResponse.status,
        }
      );
    }


    /*
     * PUT ممکن است پاسخ خالی داشته باشد.
     */
    if (
      responseData === null
    ) {
      return NextResponse.json(
        {
          message:
            "ویرایش پیش‌بینی با موفقیت انجام شد.",

          forecast:
            null,
        },
        {
          status: 200,
        }
      );
    }


    const source =
      extractForecastObject(
        responseData
      );


    return NextResponse.json(
      {
        message:
          "ویرایش پیش‌بینی با موفقیت انجام شد.",

        forecast:
          source
            ? normalizeForecast(
                source,
                forecastId
              )
            : responseData,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Update forecast route error:",
      error
    );


    if (
      error instanceof
        SyntaxError
    ) {
      return jsonError(
        "بدنه درخواست JSON معتبر نیست.",
        400
      );
    }


    return jsonError(
      "ارتباط با وب‌سرویس ویرایش پیش‌بینی برقرار نشد.",
      500
    );
  }
}


/*
 * DELETE /api/forecasts/{id}
 *
 * حذف نرم پیش‌بینی
 */
export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const {
      id: rawId,
    } = await context.params;

    const forecastId =
      rawId?.trim();

    if (!forecastId) {
      return jsonError(
        "شناسه پیش‌بینی معتبر نیست.",
        400
      );
    }


    const accessToken =
      await getAccessToken();

    if (!accessToken) {
      return jsonError(
        "نشست کاربری معتبر نیست.",
        401
      );
    }


    const backendUrl =
      buildForecastUrl(
        forecastId
      );


    const backendResponse =
      await fetch(
        backendUrl,
        {
          method:
            "DELETE",

          headers: {
            Accept:
              "application/json",

            Authorization:
              `Bearer ${accessToken}`,
          },

          cache:
            "no-store",
        }
      );


    const responseText =
      await backendResponse.text();

    const responseData =
      parseJsonResponse(
        responseText
      );


    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message:
            getErrorMessage(
              responseData
            ) ??
            (
              "حذف پیش‌بینی انجام نشد. " +
              `کد پاسخ Backend: ${backendResponse.status}`
            ),

          details:
            responseData ??
            responseText.slice(
              0,
              1000
            ),
        },
        {
          status:
            backendResponse.status,
        }
      );
    }


    return NextResponse.json(
      {
        message:
          "پیش‌بینی با موفقیت حذف شد.",

        deletedId:
          forecastId,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Delete forecast route error:",
      error
    );

    return jsonError(
      "ارتباط با وب‌سرویس حذف پیش‌بینی برقرار نشد.",
      500
    );
  }
}


/*
 * استخراج Forecast از پاسخ مستقیم یا
 * ساختارهای Wrapperدار
 */
function extractForecastObject(
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


  /*
   * پاسخ مستقیم Backend
   */
  if (
    "id" in value ||
    "planId" in value ||
    "mainTopic" in value
  ) {
    return value;
  }


  const wrapperNames = [
    "forecast",
    "Forecast",
    "data",
    "Data",
    "result",
    "Result",
    "value",
    "Value",
    "item",
    "Item",
  ];


  for (
    const wrapperName of
    wrapperNames
  ) {
    const result =
      extractForecastObject(
        value[wrapperName],
        depth + 1
      );

    if (result) {
      return result;
    }
  }


  return null;
}


/*
 * تبدیل پاسخ Backend به مدل یکپارچه Frontend
 */
function normalizeForecast(
  source: Record<
    string,
    unknown
  >,
  fallbackId: string
) {
  return {
    id:
      readIdentifier(
        source.id
      ) ||
      fallbackId,

    planId:
      readNumber(
        source.planId
      ) ?? 0,

    networkId:
      readNumber(
        source.networkId
      ) ?? 0,

    networkGroupId:
      readNumber(
        source.networkGroupId
      ),

    episodeNumber:
      readNumber(
        source.episodeNumber
      ),

    broadcastDate:
      readString(
        source.broadcastDate
      ),

    mainTopic:
      readString(
        source.mainTopic
      ),

    hasExpert:
      readBoolean(
        source.hasExpert
      ),

    /*
     * Backend فعلی status را
     * به‌صورت عدد برمی‌گرداند.
     */
    status:
      normalizeForecastStatus(
        source.status
      ),

    topicAxes:
      normalizeTopicAxes(
        source.topicAxes
      ),

    expertIds:
      normalizeExpertIds(
        source
      ),

    /*
     * پشتیبانی از نام‌های قدیم و جدید
     */
    createdByUserId:
      readString(
        source.createdByUserId
      ) ||
      readString(
        source.userCreatorId
      ),

    createdByUserName:
      readString(
        source.createdByUserName
      ) ||
      readString(
        source.userCreatorName
      ),

    createdDate:
      readString(
        source.createdDate
      ),

    lastModifiedDate:
      readString(
        source.lastModifiedDate
      ) ||
      null,

    reviewedByUserId:
      readString(
        source.reviewedByUserId
      ) ||
      null,

    lastActionReason:
      readString(
        source.lastActionReason
      ) ||
      readString(
        source.returnReason
      ) ||
      readString(
        source.rejectionReason
      ) ||
      null,
  };
}


function normalizeForecastStatus(
  value: unknown
): ForecastStatus {
  const normalizedValue =
    String(
      value ?? ""
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
    statusMap[
      normalizedValue
    ] ??
    "Draft"
  );
}


function normalizeTopicAxes(
  value: unknown
): Array<{
  id: string;
  title: string;
  displayOrder: number;
}> {
  if (!Array.isArray(value)) {
    return [];
  }


  return value
    .map(
      (
        item,
        index
      ) => {
        if (
          typeof item ===
            "string"
        ) {
          const title =
            item.trim();

          return title
            ? {
                id:
                  `topic-${index}`,

                title,

                displayOrder:
                  index + 1,
              }
            : null;
        }


        if (!isRecord(item)) {
          return null;
        }


        const title =
          readString(
            item.title
          ) ||
          readString(
            item.name
          );


        if (!title) {
          return null;
        }


        return {
          id:
            readIdentifier(
              item.id
            ) ||
            `topic-${index}`,

          title,

          displayOrder:
            readNumber(
              item.displayOrder
            ) ??
            index + 1,
        };
      }
    )
    .filter(
      (
        item
      ): item is {
        id: string;
        title: string;
        displayOrder: number;
      } =>
        item !== null
    );
}


function normalizeExpertIds(
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
        readIdentifier
      )
      .filter(Boolean);
  }


  /*
   * پشتیبانی از حالت experts
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
            readIdentifier(
              expert.expertId
            ) ||
            readIdentifier(
              expert.id
            )
          );
        }
      )
      .filter(Boolean);
  }


  return [];
}


/*
 * ساخت آدرس Backend
 */
function buildForecastUrl(
  forecastId: string
): string {
  const baseUrl =
    API_CONFIG.baseUrl.replace(
      /\/+$/,
      ""
    );

  const endpoint =
    API_ENDPOINTS.forecasts
      .byId(
        encodeURIComponent(
          forecastId
        )
      )
      .replace(
        /^\/+/,
        ""
      );

  return `${baseUrl}/${endpoint}`;
}


/*
 * دریافت Token از Cookie
 */
async function getAccessToken():
Promise<string | undefined> {
  return (
    await cookies()
  ).get(
    "access-token"
  )?.value;
}


function readStringArray(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (
        item
      ): item is string =>
        typeof item ===
          "string"
    )
    .map(
      (item) =>
        item.trim()
    )
    .filter(Boolean);
}


function readString(
  value: unknown
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}


function readIdentifier(
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


function readNumber(
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


function readBoolean(
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


  const message =
    readString(
      value.message
    ) ||
    readString(
      value.description
    ) ||
    readString(
      value.detail
    ) ||
    readString(
      value.title
    );


  if (message) {
    return message;
  }


  if (
    typeof value.errors ===
      "string" &&
    value.errors.trim()
  ) {
    return value.errors.trim();
  }


  if (
    isRecord(
      value.details
    )
  ) {
    return (
      readString(
        value.details.message
      ) ||
      readString(
        value.details.detail
      ) ||
      null
    );
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


function jsonError(
  message: string,
  status: number
) {
  return NextResponse.json(
    {
      message,
    },
    {
      status,
    }
  );
}