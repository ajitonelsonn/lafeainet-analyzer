"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import Link from "next/link";
import ManualAnalysisButton from "./ManualAnalysisButton";

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="bg-blue-600 text-white py-4 px-6 shadow-md">
      <div className="max-w-6xl mx-auto flex flex-wrap gap-4 justify-between items-center">
        <div>
          <Link href="/" className="hover:opacity-80 transition">
            <h1 className="text-xl font-semibold">LafeAINet-Analyzer</h1>
            <p className="text-sm text-blue-100">
              Network quality analysis service
            </p>
          </Link>
        </div>

        <div className="flex items-center gap-6">
          {session?.user?.role === "admin" ||
          session?.user?.role === "analyst" ? (
            <ManualAnalysisButton />
          ) : null}

          {status === "authenticated" ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="bg-blue-700 p-1.5 rounded-full">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {session.user?.name}
                  </p>
                  <p className="text-xs text-blue-200">
                    {session.user?.role}
                    {session.user?.institution &&
                      ` · ${session.user.institution}`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-1.5 rounded-full hover:bg-blue-700 text-white transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : status === "loading" ? (
            <div className="h-8 w-24 bg-blue-700/50 animate-pulse rounded"></div>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
