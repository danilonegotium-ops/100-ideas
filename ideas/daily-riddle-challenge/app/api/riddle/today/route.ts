import { NextResponse } from "next/server";
import { riddleForDate, utcDateString } from "@/lib/riddles";

export const dynamic = "force-dynamic";

/** Public — today's question only, never the answer. */
export async function GET() {
  const now = new Date();
  const riddle = riddleForDate(now);
  return NextResponse.json({
    riddleDate: utcDateString(now),
    question: riddle.question,
  });
}
