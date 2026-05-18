import { NextResponse } from "next/server";
import { explainEmotion } from "@/src/lib/ai";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      emotion?: unknown;
      confidence?: unknown;
    };
    const emotion = body.emotion as string;
    const confidence = body.confidence as number;
    const explanation = await explainEmotion(emotion, confidence);
    return NextResponse.json({ explanation });
  } catch {
    return NextResponse.json(
      { error: "Could not generate an explanation right now." },
      { status: 500 },
    );
  }
}
