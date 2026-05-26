import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { PasswordForm } from "@/components/PasswordForm";
import { SignOutButton } from "@/components/SignOutButton";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <div className="brand">설정</div>
          <div className="muted">{session.user.name}</div>
        </div>
        <nav className="nav">
          {!session.user.mustChangePassword ? (
            <a href="/">
              <ArrowLeft size={16} />
              대시보드
            </a>
          ) : null}
          <SignOutButton />
        </nav>
      </header>
      <main className="main">
        <section className="panel" style={{ maxWidth: 520 }}>
          <h1 className="section-title">비밀번호 변경</h1>
          {session.user.mustChangePassword ? (
            <p className="muted">초기 비밀번호를 먼저 변경해야 대시보드에 접근할 수 있습니다.</p>
          ) : null}
          <PasswordForm />
        </section>
      </main>
    </div>
  );
}
