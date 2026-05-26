import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { query } from "@/lib/db";

type UserRow = {
  id: number;
  username: string;
  password_hash: string;
  role: "admin";
  must_change_password: 0 | 1;
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const username = credentials?.username?.trim();
        const password = credentials?.password ?? "";
        if (!username || !password) return null;

        const users = await query<(UserRow & import("mysql2/promise").RowDataPacket)[]>(
          "SELECT id, username, password_hash, role, must_change_password FROM users WHERE username = :username LIMIT 1",
          { username }
        );
        const user = users[0];
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return null;

        return {
          id: String(user.id),
          name: user.username,
          role: user.role,
          mustChangePassword: Boolean(user.must_change_password)
        } as never;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const appUser = user as unknown as { role: string; mustChangePassword: boolean };
        token.role = appUser.role;
        token.mustChangePassword = appUser.mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.sub,
        role: token.role as string,
        mustChangePassword: token.mustChangePassword as boolean
      };
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}
