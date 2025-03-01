"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";

export default function UserNav() {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div className="bg-blue-700 p-1.5 rounded-full">
          <User className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{session.user?.name}</p>
          <p className="text-xs text-blue-200">
            {session.user?.role}
            {session.user?.institution && ` · ${session.user.institution}`}
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
  );
}
