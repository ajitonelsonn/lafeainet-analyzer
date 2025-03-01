// app/api/analyze/route.ts
import { NextResponse } from "next/server";
import { analyzeReports } from "@/services/analysis";
import { type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get("authorization");
    const expectedAuth = `Bearer ${process.env.API_SECRET}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await analyzeReports();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { success: false, error: "Analysis failed" },
      { status: 500 }
    );
  }
}
