import {
  executeForecastReviewAction,
} from "@/app/lib/server/forecast-review-action";


interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}


export async function POST(
  _request: Request,
  context: RouteContext
) {
  const {
    id,
  } = await context.params;

  return executeForecastReviewAction({
    forecastId: id,
    action: "approve",
  });
}