import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const url = new URL(request.url);
  const severity = url.searchParams.get("severity");
  const whereSeverity = severity ? "AND severity = :severity" : "";
  const logs = await query(
    `SELECT id, stream, severity, message, fingerprint, file_path, created_at
     FROM log_entries
     WHERE project_id = :projectId ${whereSeverity}
     ORDER BY id DESC
     LIMIT 200`,
    { projectId: Number(id), severity }
  );
  return NextResponse.json({ logs });
}
