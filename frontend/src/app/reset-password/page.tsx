"use client";

import { useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

function ResetPasswordContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const validate = () => {
		if (!token) {
			setError("Brakuje tokenu resetu w adresie URL.");
			return false;
		}
		if (password.length < 6) {
			setError("Hasło musi mieć co najmniej 6 znaków.");
			return false;
		}
		if (password !== confirmPassword) {
			setError("Hasła nie są takie same.");
			return false;
		}
		return true;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!validate()) return;

		setLoading(true);
		try {
			await api.resetPassword(token, password);
			router.push("/login?reset=true");
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Nie udało się zresetować hasła.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center px-4 py-12">
			<div className="fixed inset-0 pointer-events-none" aria-hidden="true">
				<div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-160 h-160 rounded-full opacity-10 blur-[120px]" style={{ background: "radial-gradient(circle, var(--color-accent) 0%, transparent 70%)" }} />
			</div>

			<div className="glass-elevated w-full max-w-md rounded-2xl p-8 relative z-10">
				<div className="mb-8 text-center">
					<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "var(--color-accent-glow)" }}>
						<svg className="h-6 w-6" style={{ color: "var(--color-accent-soft)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-14V7a4 4 0 10-8 0v2h8z" />
						</svg>
					</div>
					<h2 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
						Ustaw nowe hasło
					</h2>
					<p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
						Wpisz nowe hasło, aby zakończyć reset.
					</p>
				</div>

				{!token && (
					<div className="mb-4 rounded-lg p-3 text-sm" style={{ background: "var(--color-error-soft)", color: "var(--color-error)", border: "1px solid rgba(248, 113, 113, 0.2)" }}>
						Brakuje tokenu resetu. Skorzystaj z linku z wiadomości resetującej.
					</div>
				)}

				<form className="space-y-4" onSubmit={handleSubmit} noValidate>
					<div>
						<label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
							Nowe hasło
						</label>
						<input
							id="password"
							type="password"
							autoComplete="new-password"
							required
							className="input-dark"
							placeholder="Minimum 6 znaków"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</div>

					<div>
						<label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
							Potwierdź nowe hasło
						</label>
						<input
							id="confirmPassword"
							type="password"
							autoComplete="new-password"
							required
							className="input-dark"
							placeholder="Powtórz hasło"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
						/>
					</div>

					{error && (
						<div className="flex items-center gap-2 rounded-lg p-3 text-sm" style={{ background: "var(--color-error-soft)", color: "var(--color-error)", border: "1px solid rgba(248, 113, 113, 0.2)" }}>
							<svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
							</svg>
							{error}
						</div>
					)}

					<button type="submit" disabled={loading || !token} className="btn-primary w-full">
						{loading ? (
							<>
								<div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
								Zapisywanie...
							</>
						) : (
							"Zmień hasło"
						)}
					</button>

					<p className="text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
						<Link href="/login" className="font-medium hover:underline" style={{ color: "var(--color-accent-soft)" }}>
							Wróć do logowania
						</Link>
					</p>
				</form>
			</div>
		</div>
	);
}

export default function ResetPasswordPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center">
					<div className="h-8 w-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }} />
				</div>
			}
		>
			<ResetPasswordContent />
		</Suspense>
	);
}