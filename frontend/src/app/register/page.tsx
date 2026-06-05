"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validate = () => {
    const errors: { name?: string; email?: string; password?: string } = {};
    const normalized = email.trim().toLowerCase();

    if (!name.trim()) errors.name = "Imię jest wymagane.";
    if (!normalized.includes("@")) errors.email = "Niepoprawny format email.";
    if (password.length < 6) errors.password = "Hasło musi mieć co najmniej 6 znaków.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validate()) return;

    setLoading(true);
    try {
      await api.register(name.trim(), email.trim().toLowerCase(), password);
      router.push("/login?registered=true");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Błąd podczas rejestracji.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-160 h-160 rounded-full opacity-10 blur-[120px]"
          style={{ background: "radial-gradient(circle, var(--color-accent) 0%, transparent 70%)" }}
        />
      </div>

      <div className="glass-elevated w-full max-w-md rounded-2xl p-8 relative z-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: "var(--color-accent-glow)" }}
          >
            <svg className="h-6 w-6" style={{ color: "var(--color-accent-soft)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            Zarejestruj się
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Utwórz konto w systemie zarządzania flotą
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
              Imię i nazwisko
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              className={`input-dark ${fieldErrors.name ? "input-error" : ""}`}
              placeholder="Jan Kowalski"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined }));
              }}
            />
            {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
              Adres email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className={`input-dark ${fieldErrors.email ? "input-error" : ""}`}
              placeholder="twoj@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
              }}
            />
            {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
              Hasło
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              className={`input-dark ${fieldErrors.password ? "input-error" : ""}`}
              placeholder="Minimum 6 znaków"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
              }}
            />
            {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg p-3 text-sm"
              style={{ background: "var(--color-error-soft)", color: "var(--color-error)", border: "1px solid rgba(248, 113, 113, 0.2)" }}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Tworzenie konta...
              </>
            ) : (
              "Zarejestruj się"
            )}
          </button>

          <p className="text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Masz już konto?{" "}
            <Link href="/login" className="font-medium hover:underline" style={{ color: "var(--color-accent-soft)" }}>
              Zaloguj się
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
