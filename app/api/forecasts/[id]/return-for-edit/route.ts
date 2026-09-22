import {
  executeForecastReviewAction,
} from "@/app/lib/server/forecast-review-action";


interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  const {
    id,
  } = await context.params;

  const requestData =
    await readReason(
      request
    );

  return executeForecastReviewAction({
    forecastId: id,
    action:
      "return-for-edit",
    reason:
      requestData.reason,
  });
}


async function readReason(
  request: Request
): Promise<{
  reason: string;
}> {
  try {
    const value =
      await request.json() as
        unknown;

    if (
      typeof value ===
        "object" &&
      value !== null &&
      "reason" in value &&
      typeof value.reason ===
        "string"
    ) {
      return {
        reason:
          value.reason.trim(),
      };
    }
  } catch {
    /*
     * reason در مستند اختیاری است.
     */
  }

  return {
    reason: "",
  };
}