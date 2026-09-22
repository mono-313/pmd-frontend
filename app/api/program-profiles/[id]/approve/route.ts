import {
  executeProgramProfileWorkflowAction,
} from "@/app/lib/server/program-profile-workflow-action";


interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}


export async function POST(
  _request:
    Request,

  context:
    RouteContext
) {
  const {
    id,
  } = await context.params;

  return executeProgramProfileWorkflowAction({
    profileId:
      id,

    action:
      "approve",
  });
}