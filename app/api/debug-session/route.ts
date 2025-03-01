import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    return NextResponse.json({
      authenticated: !!session,
      session,
      authOptions: {
        // Only show non-sensitive parts of authOptions
        providers: authOptions.providers.map((p) => p.id),
        session: authOptions.session,
        pages: authOptions.pages,
        // Don't include secret
      },
      env: {
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to get session",
        errorMessage: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
