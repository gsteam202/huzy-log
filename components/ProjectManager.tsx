"use client";

import { type FormEvent, useMemo, useState } from "react";
import { Activity, KeyRound, Plus, RefreshCcw, Server, Trash2 } from "lucide-react";

type Project = {
  id: number;
  name: string;
  pm2_app_name: string;
  description: string | null;
  error_count: number;
  success_count: number;
  last_log_at: string | null;
};

type LogEntry = {
  id: number;
  stream: "out" | "error";
  severity: "success" | "info" | "warning" | "error";
  message: string;
  fingerprint: string;
  file_path: string;
  created_at: string;
};

type Token = {
  id: number;
  name: string;
  token_prefix: string;
  last_used_at: string | null;
  created_at: string;
};

export function ProjectManager({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [selectedId, setSelectedId] = useState<number | null>(initialProjects[0]?.id ?? null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [issuedToken, setIssuedToken] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const selected = useMemo(
    () => projects.find((project) => project.id === selectedId) ?? null,
    [projects, selectedId]
  );

  async function reloadProjects() {
    const response = await fetch("/api/projects");
    const data = await response.json();
    setProjects(data.projects ?? []);
  }

  async function loadDetail(projectId = selectedId) {
    if (!projectId) return;
    const [logResponse, tokenResponse] = await Promise.all([
      fetch(`/api/projects/${projectId}/logs?severity=error`),
      fetch(`/api/projects/${projectId}/tokens`)
    ]);
    const logData = await logResponse.json();
    const tokenData = await tokenResponse.json();
    setLogs(logData.logs ?? []);
    setTokens(tokenData.tokens ?? []);
  }

  async function addProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        pm2AppName: formData.get("pm2AppName"),
        description: formData.get("description")
      })
    });
    if (!response.ok) {
      setMessage("프로젝트 추가에 실패했습니다. PM2 app name 중복 여부를 확인하세요.");
      setBusy(false);
      return;
    }
    form.reset();
    await reloadProjects();
    setBusy(false);
    setMessage("프로젝트가 추가되었습니다. 수집기는 다음 주기에 로그를 읽습니다.");
  }

  async function deleteProject(id: number) {
    if (!confirm("프로젝트와 수집된 로그, 토큰을 삭제할까요?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    await reloadProjects();
    setSelectedId(null);
    setLogs([]);
    setTokens([]);
  }

  async function issueToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) return;
    setIssuedToken("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch(`/api/projects/${selectedId}/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formData.get("tokenName") })
    });
    const data = await response.json();
    if (data.token) {
      form.reset();
      setIssuedToken(data.token);
      await loadDetail(selectedId);
    }
  }

  return (
    <div className="dashboard-grid">
      <aside className="stack">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2 className="section-title">프로젝트 추가</h2>
              <p className="section-subtitle">PM2 app name만 입력하면 로그 경로는 자동으로 찾습니다.</p>
            </div>
          </div>
          <form className="form" onSubmit={addProject}>
            <div className="field">
              <label htmlFor="name">프로젝트명</label>
              <input id="name" name="name" required placeholder="api-server" />
            </div>
            <div className="field">
              <label htmlFor="pm2AppName">PM2 app name</label>
              <input id="pm2AppName" name="pm2AppName" required placeholder="api-server" />
            </div>
            <div className="field">
              <label htmlFor="description">설명</label>
              <textarea id="description" name="description" />
            </div>
            <button className="primary full" disabled={busy} type="submit">
              <Plus size={16} />
              {busy ? "추가 중" : "추가"}
            </button>
          </form>
          {message ? <p className="muted">{message}</p> : null}
        </section>

        <section className="panel">
          <div className="row between">
            <h2 className="section-title">프로젝트</h2>
            <button className="icon-button" type="button" onClick={reloadProjects} aria-label="새로고침" title="새로고침">
              <RefreshCcw size={16} />
            </button>
          </div>
          <div className="project-list">
            {projects.map((project) => (
              <button
                className={`project-card ${selectedId === project.id ? "active" : ""}`}
                key={project.id}
                onClick={() => {
                  setSelectedId(project.id);
                  void loadDetail(project.id);
                }}
                type="button"
              >
                <div className="row between">
                  <span className="project-name">{project.name}</span>
                  <span className="badge error">{project.error_count}</span>
                </div>
                <div className="project-meta">
                  <Server size={14} />
                  {project.pm2_app_name}
                </div>
              </button>
            ))}
          </div>
        </section>
      </aside>

      <main className="stack">
        {selected ? (
          <>
            <section className="panel">
              <div className="row between">
                <div>
                  <h2 className="section-title">{selected.name}</h2>
                  <div className="project-meta">
                    <Server size={14} />
                    PM2: {selected.pm2_app_name}
                  </div>
                </div>
                <button className="danger" type="button" onClick={() => deleteProject(selected.id)}>
                  <Trash2 size={16} />
                  삭제
                </button>
              </div>
              <div className="metric-grid">
                <div className="metric">
                  <span>실패 로그</span>
                  <strong>{selected.error_count}</strong>
                </div>
                <div className="metric">
                  <span>성공 로그</span>
                  <strong>{selected.success_count}</strong>
                </div>
                <div className="metric wide">
                  <span>최근 수집</span>
                  <strong>{selected.last_log_at ?? "-"}</strong>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2 className="section-title">Agent 토큰</h2>
                  <p className="section-subtitle">외부 AI agent가 이 프로젝트의 에러 로그만 조회할 수 있습니다.</p>
                </div>
              </div>
              <form className="inline-form" onSubmit={issueToken}>
                <input name="tokenName" required placeholder="agent name" />
                <button className="primary" type="submit">
                  <KeyRound size={16} />
                  발급
                </button>
              </form>
              {issuedToken ? (
                <div className="token-box">
                  <strong>이번 한 번만 표시됩니다.</strong>
                  <p className="log-line">{issuedToken}</p>
                  <p className="muted">GET /api/agent/logs Authorization: Bearer 위 토큰</p>
                </div>
              ) : null}
              <div className="token-list">
                {tokens.map((token) => (
                  <div className="row between" key={token.id}>
                    <span>{token.name}</span>
                    <span className="muted">{token.token_prefix}...</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="row between">
                <div>
                  <h2 className="section-title">최근 에러 로그</h2>
                  <p className="section-subtitle">fingerprint 기준으로 agent API에서도 같은 로그를 제공합니다.</p>
                </div>
                <button type="button" onClick={() => loadDetail()}>
                  <RefreshCcw size={16} />
                  조회
                </button>
              </div>
              <table className="log-table">
                <thead>
                  <tr>
                    <th>시각</th>
                    <th>분류</th>
                    <th>내용</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="muted">{log.created_at}</td>
                      <td>
                        <span className={`badge ${log.severity}`}>
                          <Activity size={12} />
                          {log.stream}
                        </span>
                      </td>
                      <td className="log-line">{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        ) : (
          <section className="panel">
            <h2 className="section-title">프로젝트를 선택하세요</h2>
            <p className="muted">PM2 app name을 등록하면 수집기가 해당 app의 stdout/stderr 로그 파일을 찾아 저장합니다.</p>
          </section>
        )}
      </main>
    </div>
  );
}
