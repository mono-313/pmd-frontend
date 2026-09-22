import {
  executeProgramProfileWorkflowAction,
} from "@/app/lib/server/program-profile-workflow-action";


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

  const normalizedProfileId =
    id.trim();

  console.log(
    "INTERNAL PROFILE SUBMIT:",
    {
      profileId:
        normalizedProfileId,
    }
  );

  return executeProgramProfileWorkflowAction({
    profileId:
      normalizedProfileId,

    action:
      "submit",
  });
}