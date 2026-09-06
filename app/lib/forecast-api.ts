import type {
  Forecast,
  ForecastListResponse,
} from "../types/forecast";

export async function getForecasts():
  Promise<Forecast[]> {
  const response = await fetch(
    "/api/forecasts",
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ??
        "دریافت موضوعات انجام نشد."
    );
  }

  const result =
    data as ForecastListResponse;

  if (Array.isArray(result)) {
    return result;
  }

  return Array.isArray(result.items)
    ? result.items
    : [];
}




export async function getReviewForecasts():
  Promise<Forecast[]> {
  const query =
    new URLSearchParams({
      status:
        "PendingReview",

      pageNumber:
        "1",

      pageSize:
        "100",
    });

  const response =
    await fetch(
      `/api/forecasts?${query.toString()}`,
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
      "پاسخ فهرست موضوعات JSON معتبر نیست."
    );
  }

  if (!response.ok) {
    const errorData =
      isRecord(responseData)
        ? responseData
        : null;

    throw new Error(
      typeof errorData?.message ===
        "string"
        ? errorData.message
        : `دریافت موضوعات نیازمند بررسی انجام نشد. کد پاسخ: ${response.status}`
    );
  }

  /*
   * پاسخ Route داخلی:
   * {
   *   items: [...],
   *   pagination: {...}
   * }
   */
  if (
    !isRecord(responseData) ||
    !Array.isArray(
      responseData.items
    )
  ) {
    console.error(
      "Invalid review forecasts response:",
      responseData
    );

    throw new Error(
      "ساختار پاسخ موضوعات نیازمند بررسی معتبر نیست."
    );
  }

  return responseData.items as
    Forecast[];
}

function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}