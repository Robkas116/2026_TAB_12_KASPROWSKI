"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { WorkerPublic } from "@/types/worker_types";

export default function ProfilePage() {
  const [user, setUser] = useState<WorkerPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changeError, setChangeError] = useState("");
  const [changeSuccess, setChangeSuccess] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await api.getCurrentUser();
        setUser(userData);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError("");
    setChangeSuccess("");
    if (newPassword.length < 6) {
      setChangeError("Hasło musi mieć co najmniej 6 znaków.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setChangeError("Hasła nie są takie same.");
      return;
    }
    setChanging(true);
    try {
      await api.changePassword(oldPassword, newPassword);
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setChangeSuccess("Hasło zostało zmienione.");
    } catch (err: unknown) {
      setChangeError(err instanceof Error ? err.message : "Błąd zmiany hasła.");
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1
          className="text-2xl sm:text-3xl font-bold tracking-tight"
          style={{
            background: "linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-accent-soft) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Twój profil
        </h1>
        <Link
          href="/dashboard"
          className="text-sm font-medium hover:underline inline-flex items-center gap-1"
          style={{ color: "var(--color-accent-soft)" }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Powrót do menu
        </Link>
      </div>

      <div className="glass-surface rounded-2xl overflow-hidden">
        <div className="p-6 border-b" style={{ borderColor: "var(--color-border)" }}>
          <h3 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Informacje o użytkowniku
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Szczegóły profilu i dane kontaktowe.
          </p>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-8 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <dl className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {/* Avatar & name row */}
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
                Awatar
              </dt>
              <dd className="mt-1 sm:mt-0 sm:col-span-2 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    background: "var(--color-accent-glow)",
                    color: "var(--color-accent-soft)",
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <span style={{ color: "var(--color-text-primary)" }}>{user?.name || "—"}</span>
              </dd>
            </div>

            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
                Email
              </dt>
              <dd className="mt-1 sm:mt-0 sm:col-span-2" style={{ color: "var(--color-text-secondary)" }}>
                {user?.email || "—"}
              </dd>
            </div>

            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
                Rola
              </dt>
              <dd className="mt-1 sm:mt-0 sm:col-span-2">
                <span
                  className="badge"
                  style={{
                    background: user?.is_superuser ? "var(--color-accent-glow)" : "var(--color-success-soft)",
                    color: user?.is_superuser ? "var(--color-accent-soft)" : "var(--color-success)",
                  }}
                >
                  {user?.is_superuser ? "Administrator" : "Pracownik"}
                </span>
              </dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
                Zmień hasło
              </dt>
              <dd className="mt-1 sm:mt-0 sm:col-span-2">
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div>
                    <input
                      type="password"
                      placeholder="Aktualne hasło"
                      className="input-dark w-full"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Nowe hasło"
                      className="input-dark w-full"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Powtórz nowe hasło"
                      className="input-dark w-full"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                    />
                  </div>
                  {changeError && <p className="field-error">{changeError}</p>}
                  {changeSuccess && (
                    <p className="text-sm" style={{ color: "var(--color-success)" }}>
                      {changeSuccess}
                    </p>
                  )}
                  <div>
                    <button type="submit" disabled={changing} className="btn-primary">
                      {changing ? "Zmiana..." : "Zmień hasło"}
                    </button>
                  </div>
                </form>
              </dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
