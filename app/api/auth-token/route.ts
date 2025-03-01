// app/api/auth-token/route.ts
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    // Verify the user is authenticated using next-auth
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // If no token or not logged in, return unauthorized
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin and analyst roles can get the token
    if (token.role !== "admin" && token.role !== "analyst") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // If authenticated and authorized, return the API token
    return NextResponse.json({
      token: process.env.API_SECRET,
    });
  } catch (error) {
    console.error("Error in auth-token route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
