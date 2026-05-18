import { NextResponse } from "next/server";
import { generateWeeklyInsights } from "@/src/lib/ai";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { logs?: unknown };
    const logs = Array.isArray(body.logs) ? (body.logs as object[]) : [];
    const insights = await generateWeeklyInsights(logs);
    return NextResponse.json({ insights });
  } catch {
    return NextResponse.json(
      { error: "Could not generate insights right now." },
      { status: 500 },
    );
  }
}
