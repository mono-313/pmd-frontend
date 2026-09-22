import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  API_CONFIG,
  API_ENDPOINTS,
} from "@/app/lib/api-config";

import type {
  CreateForecastRequest,
  FinalSubmitRequest,
  FinalSubmitResponse,
  ForecastListResponse,
  ForecastResponse,
  PaginationMetadata,
} from "@/app/types/forecast";



/* GET /api/forecasts - دریافت فهرست پیش‌بینی‌ها */
/*
 * GET /api/forecasts
 *
 * دریافت فهرست پیش‌بینی‌ها
 *
 * Backend براساس Role موجود
 * در Token رکوردها را فیلتر می‌کند:
 *
 * Admin:
 * تمام رکوردها
 *
 * NetworkManager:
 * رکوردهای شبکه‌های کاربر
 *
 * NetworkGroupManager:
 * رکوردهای گروه برنامه‌ساز
 *
 * Providers:
 * رکوردهای ثبت‌شده توسط کاربر
 */
export async function GET(
  request: Request
) {
  try {
    const accessToken =
      await getAccessToken();
      if (
  process.env.NODE_ENV ===
  "development" &&
  accessToken
) {
  const tokenPayload =
    readJwtPayload(
      accessToken
    );

  console.log(
    "FORECAST ROUTE TOKEN:",
    {
      sub:
        tokenPayload?.sub,

      userName:
        tokenPayload?.userName ??
        tokenPayload?.unique_name,

      roles:
        tokenPayload?.role ??
        tokenPayload?.roles,

      networkIds:
        tokenPayload?.networkIds,

      networkGroupId:
        tokenPayload?.networkGroupId,
    }
  );
}


    if (!accessToken) {
      return jsonError(
        "نشست کاربری معتبر نیست.",
        401
      );
    }


    const requestUrl =
      new URL(
        request.url
      );


    const backendUrl =
      new URL(
        joinUrl(
          API_CONFIG.baseUrl,
          API_ENDPOINTS
            .forecasts.list
        )
      );


    /*
     * فقط پارامترهای مجاز مستند
     * برای Backend ارسال می‌شوند.
     */
    const allowedParameters = [
      "planId",
      "status",
      "fromDate",
      "toDate",
      "pageNumber",
      "pageSize",
    ] as const;


    for (
      const parameterName of
      allowedParameters
    ) {
      const parameterValue =
        requestUrl.searchParams
          .get(
            parameterName
          )
          ?.trim();


      if (parameterValue) {
        backendUrl.searchParams.set(
          parameterName,
          parameterValue
        );
      }
    }


    /*
     * pageNumber و pageSize در
     * Backend جدید اجباری هستند.
     */
    if (
      !backendUrl.searchParams.has(
        "pageNumber"
      )
    ) {
      backendUrl.searchParams.set(
        "pageNumber",
        "1"
      );
    }


    if (
      !backendUrl.searchParams.has(
        "pageSize"
      )
    ) {
      backendUrl.searchParams.set(
        "pageSize",
        "10"
      );
    }


    const backendResponse =
      await fetch(
        backendUrl.toString(),
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
      //test
      console.log(
  "FORECAST LIST BACKEND RESPONSE:",
  {
    backendUrl:
      backendUrl.toString(),

    status:
      backendResponse.status,

    pagination:
      backendResponse.headers.get(
        "Pagination"
      ),

    responseData,

    extractedItemsCount:
      getForecastItems(
        responseData
      )?.length,
  }
);



    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message:
            getApiErrorMessage(
              responseData
            ) ??
            (
              "دریافت فهرست پیش‌بینی‌ها انجام نشد. " +
              `کد پاسخ Backend: ${
                backendResponse.status
              }`
            ),

          /*
           * برای مدیریت دقیق‌تر خطاها
           * در Frontend حفظ می‌شود.
           */
          code:
            getStringField(
              responseData,
              "code"
            ),

          details:
            responseData ??
            (
              responseText.trim()
                ? responseText
                : null
            ),
        },
        {
          status:
            backendResponse.status,
        }
      );
    }


    /*
     * طبق مستند، پاسخ اصلی Backend
     * مستقیماً آرایه Forecast است.
     *
     * برای جلوگیری از خرابی در صورت
     * Wrapper شدن پاسخ، ساختارهای
     * متداول قبلی نیز پشتیبانی می‌شوند.
     */
    const forecasts =
      getForecastItems(
        responseData
      );


    if (forecasts === null) {
      console.error(
        "Invalid forecast list response:",
        {
          backendUrl:
            backendUrl.toString(),

          status:
            backendResponse.status,

          response:
            responseData ??
            responseText,
        }
      );


      return NextResponse.json(
        {
          message:
            "فهرست پیش‌بینی‌ها در پاسخ وب‌سرویس پیدا نشد.",

          details:
            responseData ??
            responseText,
        },
        {
          status: 502,
        }
      );
    }


    /*
     * Backend اطلاعات Pagination را
     * داخل Header برمی‌گرداند.
     */
    const pagination =
      getPaginationMetadata(
        backendResponse,
        backendUrl.searchParams,
        forecasts.length
      );


    const result:
      ForecastListResponse = {
      items:
        forecasts,

      pagination,
    };


    return NextResponse.json(
      result,
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Get forecasts route error:",
      error
    );


    return jsonError(
      "ارتباط با وب‌سرویس پیش‌بینی‌ها برقرار نشد.",
      500
    );
  }
}
/* POST /api/forecasts - ایجاد Forecast و ارسال اختیاری برای بررسی */
export async function POST(request: Request) {
  try {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      return jsonError("نشست کاربری معتبر نیست.", 401);
    }

  const requestData =
  (await request.json()) as unknown;

/*
 * ابتدا ساختار requestData بررسی می‌شود.
 * بعد از این شرط، TypeScript آن را
 * FinalSubmitRequest تشخیص می‌دهد.
 */
if (
  !isFinalSubmitRequest(
    requestData
  )
) {
  return jsonError(
    "ساختار اطلاعات ارسال‌شده معتبر نیست.",
    400
  );
}

/*
 * اکنون استفاده از broadcastDate مجاز است؛
 * چون requestData دیگر unknown نیست.
 */
const broadcastDate =
  normalizeDigits(
    requestData.broadcastDate
      .trim()
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

const validationMessage =
  validateFinalSubmitRequest(
    requestData
  );

if (validationMessage) {
  return jsonError(
    validationMessage,
    400
  );
}

    const topicAxes = requestData.topicAxes
      .map((topic) => topic.trim())
      .filter((topic) => topic.length > 0);

    const expertIds = requestData.hasExpert
      ? requestData.expertIds
          .map((expertId) => expertId.trim())
          .filter((expertId) => expertId.length > 0)
      : [];

    const backendBody: CreateForecastRequest = {
      planId: requestData.planId,
      networkId: requestData.networkId,
      networkGroupId: requestData.networkGroupId,
            mainTopic: requestData.mainTopic.trim(),
      hasExpert: requestData.hasExpert,
      broadcastDate,
      topicAxes,
      expertIds,
    };

    const createBackendUrl =
      `${API_CONFIG.baseUrl}${API_ENDPOINTS.forecasts.create}`;
      //logggg
              console.log(
            "FINAL BODY SENT TO BACKEND:",
            JSON.stringify(
              backendBody,
              null,
              2
            )
          );
    const createResponse = await fetch(createBackendUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(backendBody),
      cache: "no-store",
    });




const createResponseText =
  await createResponse.text();

const createResponseData =
  parseJsonResponse(
    createResponseText
  );

console.log(
  "CREATE FORECAST RESPONSE:",
  {
    status:
      createResponse.status,

    contentType:
      createResponse.headers.get(
        "content-type"
      ),

    location:
      createResponse.headers.get(
        "location"
      ),

    body:
      createResponseText,
  }
);

if (!createResponse.ok) {
  return createBackendErrorResponse(
    createResponse.status,
    createResponseData,
    `ایجاد Forecast انجام نشد. کد پاسخ Backend: ${createResponse.status}`
  );
}

const createdForecast =
  getForecastResponse(
    createResponseData
  );

if (!createdForecast) {
  console.error(
    "Invalid create forecast response:",
    {
      status:
        createResponse.status,

      body:
        createResponseText,

      location:
        createResponse.headers.get(
          "location"
        ),
    }
  );

  return jsonError(
    "Forecast ثبت شد، اما شناسه آن در پاسخ Backend وجود ندارد.",
    502
  );
}


    if (!requestData.submitAfterCreate) {
      const result: FinalSubmitResponse = {
        message: "موضوع به‌صورت پیش‌نویس ثبت شد.",
        forecast: createdForecast,
        createSucceeded: true,
        submitSucceeded: false,
      };

      return NextResponse.json(result, { status: 201 });
    }

    const submitBackendUrl =
      `${API_CONFIG.baseUrl}${API_ENDPOINTS.forecasts.submit(createdForecast.id)}`;

    const submitResponse = await fetch(submitBackendUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const submitResponseText = await submitResponse.text();
    const submitResponseData = parseJsonResponse(submitResponseText);

    if (!submitResponse.ok) {
      const result: FinalSubmitResponse = {
        message:
          getApiErrorMessage(submitResponseData) ??
          "موضوع ایجاد شد، اما ارسال آن برای بررسی انجام نشد.",
        forecast: createdForecast,
        createSucceeded: true,
        submitSucceeded: false,
      };

      /* Create موفق بوده؛ Forecast به‌صورت Draft باقی می‌ماند. */
      return NextResponse.json(result, { status: 200 });
    }

    /* طبق مستند Submit ممکن است پاسخ خالی داشته باشد. */
    const finalForecast =
      getForecastResponse(submitResponseData) ??
      ({ ...createdForecast, status: "PendingReview" } as ForecastResponse);

    const result: FinalSubmitResponse = {
      message: "موضوع با موفقیت ثبت و برای بررسی ارسال شد.",
      forecast: finalForecast,
      createSucceeded: true,
      submitSucceeded: true,
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Create forecast route error:", error);

    if (error instanceof SyntaxError) {
      return jsonError("ساختار اطلاعات ارسال‌شده JSON معتبر نیست.", 400);
    }

    return jsonError("ارتباط با وب‌سرویس ایجاد Forecast برقرار نشد.", 500);
  }
}

async function getAccessToken(): Promise<string | undefined> {
  return (await cookies()).get("access-token")?.value;
}

/*
 * استخراج آرایه Forecast
 * از پاسخ Backend
 */
function getForecastItems(
  value: unknown
): ForecastResponse[] | null {
  /*
   * مطابق پاسخ فعلی Backend،
   * پاسخ اصلی مستقیماً آرایه است.
   */
  if (Array.isArray(value)) {
    return value
      .map(
        normalizeForecastItem
      )
      .filter(
        (
          item
        ): item is ForecastResponse =>
          item !== null
      );
  }


  if (!isObjectValue(value)) {
    return null;
  }


  /*
   * پشتیبانی از پاسخ‌های Wrapperدار
   */
  const possibleArrays = [
    value.items,
    value.Items,
    value.forecasts,
    value.Forecasts,
    value.data,
    value.Data,
    value.result,
    value.Result,
    value.$values,
  ];


  for (
    const possibleArray of
    possibleArrays
  ) {
    if (
      Array.isArray(
        possibleArray
      )
    ) {
      return possibleArray
        .map(
          normalizeForecastItem
        )
        .filter(
          (
            item
          ): item is ForecastResponse =>
            item !== null
        );
    }
  }


  /*
   * پشتیبانی از پاسخ‌های تو در تو
   */
  const possibleObjects = [
    value.data,
    value.Data,
    value.result,
    value.Result,
  ];


  for (
    const possibleObject of
    possibleObjects
  ) {
    if (
      !isObjectValue(
        possibleObject
      )
    ) {
      continue;
    }


    const nestedArray =
      possibleObject.items ??
      possibleObject.Items ??
      possibleObject.forecasts ??
      possibleObject.Forecasts ??
      possibleObject.$values;


    if (
      Array.isArray(
        nestedArray
      )
    ) {
      return nestedArray
        .map(
          normalizeForecastItem
        )
        .filter(
          (
            item
          ): item is ForecastResponse =>
            item !== null
        );
    }
  }


  return null;
}


function normalizeForecastItem(
  value: unknown
): ForecastResponse | null {
  if (
    !isObjectValue(
      value
    )
  ) {
    return null;
  }


  const id =
    readStringValue(
      value.id
    );

  /*
   * فقط id برای نگه‌داشتن رکورد
   * الزامی در نظر گرفته می‌شود.
   */
  if (!id) {
    return null;
  }


  const topicAxes =
    Array.isArray(
      value.topicAxes
    )
      ? value.topicAxes
          .map(
            (
              topicAxis,
              index
            ) =>
              normalizeTopicAxis(
                topicAxis,
                index
              )
          )
          .filter(
            (
              topicAxis
            ): topicAxis is {
              id: string;
              title: string;
              displayOrder: number;
            } =>
              topicAxis !== null
          )
      : [];


  const expertIds =
    Array.isArray(
      value.expertIds
    )
      ? value.expertIds
          .map(
            readIdentifierValue
          )
          .filter(
            (
              expertId
            ) =>
              expertId.length > 0
          )
      : [];


  return {
    id,

    planId:
      readNumberValue(
        value.planId
      ) ?? 0,

    networkId:
      readNumberValue(
        value.networkId
      ) ?? 0,

    networkGroupId:
      readNumberValue(
        value.networkGroupId
      ) ?? 0,

    episodeNumber:
      readNumberValue(
        value.episodeNumber
      ) ?? 0,

    broadcastDate:
      readStringValue(
        value.broadcastDate
      ),

    mainTopic:
      readStringValue(
        value.mainTopic
      ),

    hasExpert:
      readBooleanValue(
        value.hasExpert
      ),

    /*
     * تبدیل وضعیت عددی Backend
     * به رشته مورد استفاده Frontend
     */
    status:
      normalizeForecastStatus(
        value.status
      ),

    topicAxes,

    expertIds,

    /*
     * Backend فعلی userCreatorName
     * برمی‌گرداند.
     */
    createdByUserId:
      readStringValue(
        value.createdByUserId
      ) ||
      readStringValue(
        value.userCreatorId
      ),

    createdByUserName:
      readStringValue(
        value.createdByUserName
      ) ||
      readStringValue(
        value.userCreatorName
      ),

    createdDate:
      readStringValue(
        value.createdDate
      ),

    reviewedByUserId:
      readStringValue(
        value.reviewedByUserId
      ) ||
      null,

    lastActionReason:
      readStringValue(
        value.lastActionReason
      ) ||
      readStringValue(
        value.returnReason
      ) ||
      readStringValue(
        value.rejectionReason
      ) ||
      null,

    lastModifiedDate:
      readStringValue(
        value.lastModifiedDate
      ) ||
      null,
  };
}
function normalizeTopicAxis(
  value: unknown,
  index: number
): {
  id: string;
  title: string;
  displayOrder: number;
} | null {
  /*
   * اگر محور فقط به‌صورت رشته باشد
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


  if (
    !isObjectValue(
      value
    )
  ) {
    return null;
  }


  const title =
    readStringValue(
      value.title
    ) ||
    readStringValue(
      value.name
    );


  if (!title) {
    return null;
  }


  return {
    id:
      readIdentifierValue(
        value.id
      ) ||
      `topic-${index}`,

    title,

    displayOrder:
      readNumberValue(
        value.displayOrder
      ) ??
      index + 1,
  };
}

function normalizeForecastStatus(
  value: unknown
): ForecastResponse["status"] {
  const normalizedValue =
    String(
      value ?? ""
    ).trim();


  const statusMap:
    Record<
      string,
      ForecastResponse["status"]
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

function isObjectValue(
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


function readStringValue(
  value: unknown
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}


function readIdentifierValue(
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


function readNumberValue(
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
        value.trim()
      );

    return Number.isFinite(
      parsedValue
    )
      ? parsedValue
      : null;
  }


  return null;
}


function readBooleanValue(
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


/*
 * بررسی حداقلی هر Forecast
 *
 * عمداً فقط فیلدهای اصلی بررسی
 * می‌شوند تا اضافه‌شدن فیلدهای جدید
 * Backend باعث رد کل پاسخ نشود.
 */
function isForecastListItem(
  value: unknown
): value is ForecastResponse {
  return (
    isRecord(value) &&

    typeof value.id ===
      "string" &&

    Boolean(
      value.id.trim()
    ) &&

    typeof value.planId ===
      "number" &&

    typeof value.mainTopic ===
      "string" &&

    typeof value.status ===
      "string"
  );
}

function getForecastResponse(
  value: unknown
): ForecastResponse | null {
  if (
    isCreatedForecastResponse(
      value
    )
  ) {
    return value as
      unknown as
      ForecastResponse;
  }

  if (!isRecord(value)) {
    return null;
  }

  const forecastValue =
    value.forecast;

  if (
    isCreatedForecastResponse(
      forecastValue
    )
  ) {
    return forecastValue as
      unknown as
      ForecastResponse;
  }

  const dataValue =
    value.data;

  if (
    isCreatedForecastResponse(
      dataValue
    )
  ) {
    return dataValue as
      unknown as
      ForecastResponse;
  }

  const resultValue =
    value.result;

  if (
    isCreatedForecastResponse(
      resultValue
    )
  ) {
    return resultValue as
      unknown as
      ForecastResponse;
  }

  /*
   * پاسخ تو در تو:
   * {
   *   data: {
   *     forecast: {...}
   *   }
   * }
   */
  if (isRecord(dataValue)) {
    const nestedForecast =
      dataValue.forecast;

    if (
      isCreatedForecastResponse(
        nestedForecast
      )
    ) {
      return nestedForecast as
        unknown as
        ForecastResponse;
    }
  }

  return null;
}

function getPaginationMetadata(
  backendResponse: Response,
  searchParams: URLSearchParams,
  itemCount: number
): PaginationMetadata {
  /*
   * در Query و پاسخ Backend نام فیلد
   * pageNumber است.
   */
  const requestedPageNumber =
    toPositiveInteger(
      searchParams.get(
        "pageNumber"
      ),
      1
    );

  const requestedPageSize =
    toPositiveInteger(
      searchParams.get(
        "pageSize"
      ),
      10
    );

  /*
   * در مدل داخلی پروژه از currentPage
   * استفاده می‌کنیم.
   */
  const fallback:
    PaginationMetadata = {
    currentPage:
      requestedPageNumber,

    totalPages:
      itemCount > 0
        ? 1
        : 0,

    pageSize:
      requestedPageSize,

    totalCount:
      itemCount,

    hasPrevious:
      requestedPageNumber > 1,

    hasNext:
      false,
  };

  const paginationHeader =
    backendResponse.headers.get(
      "Pagination"
    ) ??
    backendResponse.headers.get(
      "X-Pagination"
    );

  if (!paginationHeader) {
    return fallback;
  }

  const headerData =
    parseJsonResponse(
      paginationHeader
    );

  if (!isRecord(headerData)) {
    return fallback;
  }

  /*
   * pageNumber دریافتی از Backend
   * به currentPage تبدیل می‌شود.
   */
  return {
  currentPage:
    getFiniteNumber(
      headerData.pageNumber ??
      headerData.PageNumber,
      fallback.currentPage
    ),

  totalPages:
    getFiniteNumber(
      headerData.totalPages ??
      headerData.TotalPages,
      fallback.totalPages
    ),

  pageSize:
    getFiniteNumber(
      headerData.pageSize ??
      headerData.PageSize,
      fallback.pageSize
    ),

  totalCount:
    getFiniteNumber(
      headerData.totalCount ??
      headerData.TotalCount,
      fallback.totalCount
    ),

  hasPrevious:
    readPaginationBoolean(
      headerData.hasPrevious ??
      headerData.HasPrevious,
      fallback.hasPrevious
    ),

  hasNext:
    readPaginationBoolean(
      headerData.hasNext ??
      headerData.HasNext,
      fallback.hasNext
    ),
};

}

function isFinalSubmitRequest(value: unknown): value is FinalSubmitRequest {
  if (!isRecord(value)) return false;

  return (
    typeof value.planId === "number" &&
    typeof value.networkId === "number" &&
    typeof value.networkGroupId === "number" &&
    typeof value.broadcastDate === "string" &&
    typeof value.mainTopic === "string" &&
    typeof value.hasExpert === "boolean" &&
    Array.isArray(value.topicAxes) &&
    value.topicAxes.every((topic) => typeof topic === "string") &&
    Array.isArray(value.expertIds) &&
    value.expertIds.every((expertId) => typeof expertId === "string") &&
    typeof value.submitAfterCreate === "boolean"
  );
}

function validateFinalSubmitRequest(
  value: FinalSubmitRequest
): string | null {
  if (!Number.isInteger(value.planId) || value.planId <= 0) {
    return "شناسه برنامه معتبر نیست.";
  }

  if (!Number.isInteger(value.networkId) || value.networkId <= 0) {
    return "شناسه شبکه معتبر نیست.";
  }

  if (!Number.isInteger(value.networkGroupId) || value.networkGroupId <= 0) {
    return "شناسه گروه برنامه‌ساز معتبر نیست.";
  }

  if (!value.broadcastDate.trim()) return "تاریخ پخش الزامی است.";
  if (!value.mainTopic.trim()) return "موضوع اصلی برنامه الزامی است.";

  if (!value.topicAxes.some((topic) => topic.trim().length > 0)) {
    return "حداقل یک محور موضوعی الزامی است.";
  }

  if (
    value.hasExpert &&
    !value.expertIds.some((expertId) => expertId.trim().length > 0)
  ) {
    return "برای برنامه دارای کارشناس، انتخاب حداقل یک کارشناس الزامی است.";
  }

  return null;
}

function isForecastResponse(value: unknown): value is ForecastResponse {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.planId === "number" &&
    typeof value.networkId === "number" &&
    typeof value.networkGroupId === "number" &&
    typeof value.episodeNumber === "number" &&
    typeof value.broadcastDate === "string" &&
    typeof value.mainTopic === "string" &&
    typeof value.hasExpert === "boolean" &&
    isForecastStatus(value.status) &&
    Array.isArray(value.topicAxes) &&
    Array.isArray(value.expertIds) &&
    typeof value.createdByUserId === "string" &&
    typeof value.createdByUserName === "string" &&
    typeof value.createdDate === "string"
  );
}

function isForecastStatus(value: unknown): boolean {
  return (
    value === "Draft" ||
    value === "PendingReview" ||
    value === "Approved" ||
    value === "Rejected" ||
    value === "ReturnedForEdit"
  );
}

function parseJsonResponse(responseText: string): unknown | null {
  if (!responseText.trim()) return null;

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getApiErrorMessage(
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

  /*
   * ساختار خطای مستند Backend:
   * errors می‌تواند String باشد.
   */
  if (
    typeof value.errors ===
      "string"
  ) {
    return value.errors;
  }

  const validationMessages =
    getValidationMessages(
      value.errors
    );

  if (
    validationMessages.length > 0
  ) {
    return validationMessages.join(
      "، "
    );
  }

  if (
    typeof value.title ===
      "string"
  ) {
    return value.title;
  }

  return null;
}

  

function getValidationMessages(errors: unknown): string[] {
  if (!isRecord(errors)) return [];

  return Object.values(errors).flatMap((item) => {
    if (typeof item === "string") return [item];

    if (Array.isArray(item)) {
      return item.filter(
        (message): message is string => typeof message === "string"
      );
    }

    return [];
  });
}

function createBackendErrorResponse(
  status: number,
  responseData: unknown,
  fallbackMessage: string
) {
  return NextResponse.json(
    {
      message: getApiErrorMessage(responseData) ?? fallbackMessage,
    },
    { status }
  );
}



function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}



function toPositiveInteger(value: string | null, fallback: number): number {
  const numberValue = Number(value);

  return Number.isInteger(numberValue) && numberValue > 0
    ? numberValue
    : fallback;
}



function getFiniteNumber(
  value: unknown,
  fallback: number
): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  /*
   * بعضی Backendها مقادیر Pagination
   * را به شکل String برمی‌گردانند.
   */
  if (
    typeof value === "string"
  ) {
    const parsedValue =
      Number(value);

    if (
      Number.isFinite(parsedValue)
    ) {
      return parsedValue;
    }
  }

  return fallback;
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


/*
 * دریافت اولین عدد معتبر
 * از چند نام احتمالی
 */
function getFirstFiniteNumber(
  value: Record<
    string,
    unknown
  >,
  propertyNames:
    readonly string[],
  fallback: number
): number {
  for (
    const propertyName of
    propertyNames
  ) {
    const result =
      getFiniteNumber(
        value[propertyName],
        Number.NaN
      );


    if (
      Number.isFinite(
        result
      )
    ) {
      return result;
    }
  }


  return fallback;
}


/*
 * دریافت اولین Boolean معتبر
 */
function getFirstBoolean(
  value: Record<
    string,
    unknown
  >,
  propertyNames:
    readonly string[],
  fallback: boolean
): boolean {
  for (
    const propertyName of
    propertyNames
  ) {
    const propertyValue =
      value[propertyName];


    if (
      typeof propertyValue ===
      "boolean"
    ) {
      return propertyValue;
    }


    if (
      propertyValue === "true"
    ) {
      return true;
    }


    if (
      propertyValue === "false"
    ) {
      return false;
    }
  }


  return fallback;
}


/*
 * استخراج یک String از
 * پاسخ احتمالی Backend
 */
function getStringField(
  value: unknown,
  propertyName: string
): string | null {
  if (!isRecord(value)) {
    return null;
  }


  const propertyValue =
    value[propertyName];


  return (
    typeof propertyValue ===
      "string" &&
    propertyValue.trim()
  )
    ? propertyValue.trim()
    : null;
}


/*
 * اتصال امن Base URL
 * و مسیر Endpoint
 */
function joinUrl(
  baseUrl: string,
  endpoint: string
): string {
  return (
    baseUrl.replace(
      /\/+$/,
      ""
    ) +
    "/" +
    endpoint.replace(
      /^\/+/,
      ""
    )
  );
}



/*
 * برای پاسخ عملیات Create فقط وجود id
 * ضروری است؛ ممکن است Backend تمام
 * اطلاعات Forecast را برنگرداند.
 */
function isCreatedForecastResponse(
  value: unknown
): value is Record<
  string,
  unknown
> & {
  id: string;
} {
  return (
    isRecord(value) &&
    typeof value.id ===
      "string" &&
    value.id.trim().length > 0
  );
}


function getCreatedForecastId(
  value: unknown
): string | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id === "string" &&
    value.id.trim()
  ) {
    return value.id;
  }

  if (
    typeof value.forecastId ===
      "string" &&
    value.forecastId.trim()
  ) {
    return value.forecastId;
  }

  return null;
}


function readJwtPayload(
  token: string
): Record<
  string,
  unknown
> | null {
  try {
    const parts =
      token.split(".");

    if (parts.length < 2) {
      return null;
    }

    const normalizedPayload =
      parts[1]
        .replace(
          /-/g,
          "+"
        )
        .replace(
          /_/g,
          "/"
        );

    const payload =
      Buffer.from(
        normalizedPayload,
        "base64"
      ).toString(
        "utf8"
      );

    const value =
      JSON.parse(
        payload
      ) as unknown;

    return isRecord(value)
      ? value
      : null;
  } catch {
    return null;
  }
}

function readPaginationBoolean(
  value: unknown,
  fallback: boolean
): boolean {
  if (
    typeof value ===
      "boolean"
  ) {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
}