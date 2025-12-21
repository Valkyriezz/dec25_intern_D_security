import { NextRequest, NextResponse } from "next/server";
import { generateSecurityTests } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, language } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    if (!language || typeof language !== "string") {
      return NextResponse.json(
        { error: "Language is required" },
        { status: 400 }
      );
    }

    const tests = await generateSecurityTests(code, language);

    return NextResponse.json({ tests, language });
  } catch (error) {
    console.error("Test generation API error:", error);
    return NextResponse.json(
      { error: "Failed to generate security tests" },
      { status: 500 }
    );
  }
}

