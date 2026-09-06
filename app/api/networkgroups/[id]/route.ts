import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const res = await fetch(
    `${process.env.API_BASE_URL}/networkgroups/${id}`,
    
    {
      headers: {
        "X-API-KEY": process.env.API_KEY!,
      },
    }
  );

  const data = await res.json();

  return NextResponse.json(data);
}