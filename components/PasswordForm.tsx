"use client";

import { type FormEvent, useState } from "react";

export function PasswordForm() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setPending(true);
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/me/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: formData.get("currentPassword"),
        newPassword: formData.get("newPassword")
      })
    });
    const data = await response.json();
    setPending(false);
    setMessage(response.ok ? "비밀번호가 변경되었습니다. 다시 로그인하면 변경 상태가 반영됩니다." : data.error);
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="currentPassword">현재 비밀번호</label>
        <input id="currentPassword" name="currentPassword" type="password" required />
      </div>
      <div className="field">
        <label htmlFor="newPassword">새 비밀번호</label>
        <input id="newPassword" name="newPassword" type="password" minLength={8} required />
      </div>
      <button className="primary" disabled={pending} type="submit">
        {pending ? "변경 중" : "변경"}
      </button>
      {message ? <p className="muted">{message}</p> : null}
    </form>
  );
}
