"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Credenciales inválidas. Intenta nuevamente.");
      return;
    }

    const callbackUrl =
      new URLSearchParams(window.location.search).get("callbackUrl") || "/admin";
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--cream)] px-4">
      <section className="w-full max-w-[380px] rounded-2xl border border-[#f4c4cc] bg-white p-10">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#2d6a3f]">
          <span className="font-display text-2xl text-white">e</span>
        </div>

        <h1 className="mt-5 text-center font-display text-[1.6rem] text-[#2d6a3f]">
          Acceso administrador
        </h1>
        <p className="mt-1 text-center font-light text-[#6b7e6f]">
          Jardin Esperanza
        </p>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-[0.8rem] uppercase tracking-[0.1em] text-[#6b7e6f]">
              Usuario
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-1.5 w-full rounded-md border-[1.5px] border-[#e0ddd8] px-3.5 py-2.5 outline-none focus:border-[#a8c5a0]"
            />
          </div>

          <div>
            <label className="text-[0.8rem] uppercase tracking-[0.1em] text-[#6b7e6f]">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-md border-[1.5px] border-[#e0ddd8] px-3.5 py-2.5 outline-none focus:border-[#a8c5a0]"
            />
          </div>

          {error ? <p className="text-sm text-[#c0707a]">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-[50px] bg-[#2d6a3f] px-4 py-3 text-white disabled:opacity-70"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </section>
    </main>
  );
}
