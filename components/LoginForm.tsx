"use client";

import { type FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

export function LoginForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirect: false,
      callbackUrl: "/"
    });
    setPending(false);

    if (result?.error) {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    window.location.href = result?.url ?? "/";
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="username">아이디</label>
        <input id="username" name="username" required autoComplete="username" autoFocus />
      </div>
      <div className="field">
        <label htmlFor="password">비밀번호</label>
        <input id="password" name="password" required type="password" autoComplete="current-password" />
      </div>
      {error ? <div className="error-text">{error}</div> : null}
      <button className="primary full" disabled={pending} type="submit">
        {pending ? "로그인 중" : "로그인"}
      </button>
    </form>
  );
}
