import { cookies } from "next/headers";
export async function POST(request:Request)
{if(!(await cookies()).get("session-id"))
    return Response.json({message:"نیاز به ورود"},{status:401});
    const body=await request.json() as {subjects?:unknown[]};
    if(!body.subjects?.length)
        return Response.json({message:"حداقل یک موضوع لازم است"},{status:400});
    return Response.json({ok:true,trackingCode:`PRG-${Date.now().toString().slice(-6)}`})}
