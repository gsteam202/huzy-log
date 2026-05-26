import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { createProjectToken, sha256 } from "@/lib/security";
import { execute, query } from "@/lib/db";

const tokenSchema = z.object({
  name: z.string().min(1).max(120)
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const tokens = await query(
    "SELECT id, name, token_prefix, last_used_at, created_at FROM project_tokens WHERE project_id = :projectId ORDER BY id DESC",
    { projectId: Number(id) }
  );
  return NextResponse.json({ tokens });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = tokenSchema.parse(await request.json());
  const token = createProjectToken();
  await execute(
    "INSERT INTO project_tokens (project_id, name, token_hash, token_prefix) VALUES (:projectId, :name, :tokenHash, :tokenPrefix)",
    {
      projectId: Number(id),
      name: body.name,
      tokenHash: sha256(token),
      tokenPrefix: token.slice(0, 18)
    }
  );
  return NextResponse.json({ token });
}
