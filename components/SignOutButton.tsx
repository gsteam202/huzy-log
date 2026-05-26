"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button type="button" onClick={() => signOut({ callbackUrl: "/login" })}>
      <LogOut size={16} />
      로그아웃
    </button>
  );
}
