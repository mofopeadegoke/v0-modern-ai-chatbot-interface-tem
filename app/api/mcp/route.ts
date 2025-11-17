// app/api/ai/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleQuery } from "@/app/client"; // server-only code

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  try {
    const result = await handleQuery(query);
    console.log("Generated result:", result);
    return NextResponse.json({ result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate response" }, { status: 500 });
  }
}
