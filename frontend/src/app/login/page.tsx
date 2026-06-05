"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get("registered")
    ? "Konto zostało utworzone! Możesz się teraz zalogować."
    : searchParams.get("reset")
      ? "Hasło zostało zresetowane. Możesz się teraz zalogować."
      : "";

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    const normalized = email.trim().toLowerCase();

    if (!normalized || !normalized.includes("@")) {
      errors.email = "Proszę podać poprawny adres email.";
    }
    if (password.length < 6) {
      errors.password = "Hasło musi mieć co najmniej 6 znaków.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validate()) return;

    setLoading(true);
    try {
      await api.login(email.trim().toLowerCase(), password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Błąd logowania. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      {/* Background ambient glow */}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            Zaloguj się do floty
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Wprowadź swoje dane, aby kontynuować
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
              Email
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
              autoComplete="current-password"
              required
              className={`input-dark ${fieldErrors.password ? "input-error" : ""}`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
              }}
            />
            {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
          </div>

          {success && (
            <div className="flex items-center gap-2 rounded-lg p-3 text-sm"
              style={{ background: "var(--color-success-soft)", color: "var(--color-success)", border: "1px solid rgba(52, 211, 153, 0.2)" }}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </div>
          )}

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
                Logowanie...
              </>
            ) : (
              "Zaloguj się"
            )}
          </button>

          <p className="text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Nie masz konta?{" "}
            <Link href="/register" className="font-medium hover:underline" style={{ color: "var(--color-accent-soft)" }}>
              Zarejestruj się
            </Link>
          </p>

          <p className="text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <Link href="/forgot-password" className="font-medium hover:underline" style={{ color: "var(--color-accent-soft)" }}>
              Zapomniałem hasła
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }} />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
