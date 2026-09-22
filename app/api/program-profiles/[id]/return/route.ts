import {
  NextResponse,
} from "next/server";

import {
  executeProgramProfileWorkflowAction,
} from "@/app/lib/server/program-profile-workflow-action";


interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}


export async function POST(
  request:
    Request,

  context:
    RouteContext
) {
  const {
    id,
  } = await context.params;

  const reason =
    await readReturnReason(
      request
    );

  if (!reason) {
    return NextResponse.json(
      {
        message:
          "وارد کردن دلیل بازگشت الزامی است.",
      },
      {
        status: 400,
      }
    );
  }

  return executeProgramProfileWorkflowAction({
    profileId:
      id,

    action:
      "return",

    reason,
  });
}


async function readReturnReason(
  request:
    Request
): Promise<string> {
  try {
    const requestData =
      await request.json() as
        unknown;

    if (
      isRecord(
        requestData
      ) &&
      typeof requestData.reason ===
        "string"
    ) {
      return requestData.reason.trim();
    }
  } catch {
    return "";
  }

  return "";
}


function isRecord(
  value:
    unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(
      value
    )
  );
}