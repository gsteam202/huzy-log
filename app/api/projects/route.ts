import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { execute, query } from "@/lib/db";

const projectSchema = z.object({
  name: z.string().min(1).max(120),
  pm2AppName: z.string().min(1).max(160),
  description: z.string().max(2000).optional().default("")
});

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await query(
    `SELECT p.*,
      COALESCE(SUM(CASE WHEN l.severity = 'error' THEN 1 ELSE 0 END), 0) AS error_count,
      COALESCE(SUM(CASE WHEN l.severity = 'success' THEN 1 ELSE 0 END), 0) AS success_count,
      MAX(l.created_at) AS last_log_at
     FROM projects p
     LEFT JOIN log_entries l ON l.project_id = p.id
     GROUP BY p.id
     ORDER BY p.created_at DESC`
  );
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = projectSchema.parse(await request.json());
  await execute(
    "INSERT INTO projects (name, pm2_app_name, description) VALUES (:name, :pm2AppName, :description)",
    body
  );
  return NextResponse.json({ ok: true });
}
