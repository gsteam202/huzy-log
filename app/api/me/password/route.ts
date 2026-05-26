import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, hashPassword, verifyPassword } from "@/lib/auth";
import { execute, query } from "@/lib/db";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
});

type UserRow = import("mysql2/promise").RowDataPacket & {
  id: number;
  password_hash: string;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = schema.parse(await request.json());
  const rows = await query<UserRow[]>("SELECT id, password_hash FROM users WHERE id = :id LIMIT 1", {
    id: Number(session.user.id)
  });
  const user = rows[0];
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const valid = await verifyPassword(body.currentPassword, user.password_hash);
  if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

  await execute(
    "UPDATE users SET password_hash = :passwordHash, must_change_password = 0 WHERE id = :id",
    { id: user.id, passwordHash: await hashPassword(body.newPassword) }
  );
  return NextResponse.json({ ok: true });
}
