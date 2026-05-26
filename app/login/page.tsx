import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/");

  return (
    <main className="login-page">
      <section className="panel login-box">
        <div className="login-header">
          <h1 className="section-title">Huzy Log</h1>
          <p className="muted">PM2 로그 수집 및 Agent Hook</p>
        </div>
        <div className="login-body">
          <p className="muted" style={{ marginBottom: 16 }}>초기 관리자 계정은 admin / admin 입니다.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
