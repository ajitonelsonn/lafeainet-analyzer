// lib/auth.ts
import { getConnection } from "@/lib/db";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  username: string;
  password: string;
  role: "admin" | "analyst" | "viewer";
  institution: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const connection = await getConnection();

          // Get user from database
          const [rows] = await connection.execute<UserRow[]>(
            "SELECT * FROM power_users WHERE username = ?",
            [credentials.username]
          );

          await connection.end();

          const user = rows[0];

          if (!user) {
            return null;
          }

          // Verify password
          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!passwordMatch) {
            return null;
          }

          // Update last login time
          const conn = await getConnection();
          await conn.execute(
            "UPDATE power_users SET last_login = NOW() WHERE id = ?",
            [user.id]
          );
          await conn.end();

          // Return user object
          return {
            id: user.id.toString(),
            name: user.name,
            username: user.username,
            role: user.role,
            institution: user.institution,
            email: `${user.username}@placeholder.com`, // NextAuth expects email but we use username
          };
        } catch (error) {
          console.error("Login error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 day
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.institution = user.institution;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
        session.user.institution = token.institution as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper function to hash passwords
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// Function to check if user is authenticated on server-side
export async function isAuthenticated(req: Request) {
  // Implementation depends on your auth approach
  const sessionToken = req.headers
    .get("cookie")
    ?.split(";")
    .find((c) => c.trim().startsWith("next-auth.session-token="));

  return !!sessionToken;
}
