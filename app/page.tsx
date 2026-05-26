import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Settings } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { ProjectManager } from "@/components/ProjectManager";
import { SignOutButton } from "@/components/SignOutButton";

type ProjectRow = import("mysql2/promise").RowDataPacket & {
  id: number;
  name: string;
  pm2_app_name: string;
  description: string | null;
  error_count: number;
  success_count: number;
  last_log_at: string | null;
};

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.mustChangePassword) redirect("/settings");

  const projects = await query<ProjectRow[]>(
    `SELECT p.id, p.name, p.pm2_app_name, p.description,
      COALESCE(SUM(CASE WHEN l.severity = 'error' THEN 1 ELSE 0 END), 0) AS error_count,
      COALESCE(SUM(CASE WHEN l.severity = 'success' THEN 1 ELSE 0 END), 0) AS success_count,
      MAX(l.created_at) AS last_log_at
     FROM projects p
     LEFT JOIN log_entries l ON l.project_id = p.id
     GROUP BY p.id
     ORDER BY p.created_at DESC`
  );

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <div className="brand">Huzy Log</div>
          <div className="muted">PM2 로그 수집 및 Agent Hook</div>
        </div>
        <nav className="nav">
          <a href="/settings">
            <Settings size={16} />
            설정
          </a>
          <SignOutButton />
        </nav>
      </header>
      <div className="main">
        <ProjectManager initialProjects={JSON.parse(JSON.stringify(projects))} />
      </div>
    </div>
  );
}
