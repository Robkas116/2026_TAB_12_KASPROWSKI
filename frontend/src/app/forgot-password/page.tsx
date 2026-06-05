"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const [resetLink, setResetLink] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setMessage("");
		setResetLink("");

		if (!email.trim() || !email.includes("@")) {
			setError("Proszę podać poprawny adres email.");
			return;
		}

		setLoading(true);
		try {
			const response = await api.requestPasswordReset(email);
			setMessage(response.message);
			if (response.reset_link) {
				setResetLink(response.reset_link);
			}
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Nie udało się wysłać linku resetu.");
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
				<div
					className="absolute top-1/4 left-1/2 -translate-x-1/2 w-160 h-160 rounded-full opacity-10 blur-[120px]"
					style={{ background: "radial-gradient(circle, var(--color-accent) 0%, transparent 70%)" }}
				/>
			</div>

			<div className="glass-elevated w-full max-w-md rounded-2xl p-8 relative z-10">
				<div className="mb-8 text-center">
					<div
						className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
						style={{ background: "var(--color-accent-glow)" }}
					>
						<svg className="h-6 w-6" style={{ color: "var(--color-accent-soft)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.657 1.79-3 4-3s4 1.343 4 3-1.79 3-4 3-4 1.343-4 3 1.79 3 4 3 4-1.343 4-3M4 11c0-1.657 1.79-3 4-3s4 1.343 4 3-1.79 3-4 3-4 1.343-4 3 1.79 3 4 3 4-1.343 4-3" />
						</svg>
					</div>
					<h2 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
						Reset hasła
					</h2>
					<p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
						Podaj email, aby wygenerować link do ustawienia nowego hasła.
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
							className="input-dark"
							placeholder="twoj@email.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
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

					{message && (
						<div className="rounded-lg p-3 text-sm" style={{ background: "var(--color-success-soft)", color: "var(--color-success)", border: "1px solid rgba(52, 211, 153, 0.2)" }}>
							{message}
						</div>
					)}

					{resetLink && (
						<div className="rounded-lg p-4 text-sm space-y-2" style={{ background: "var(--color-overlay)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
							<p className="font-medium" style={{ color: "var(--color-text-primary)" }}>
								Link resetu w trybie lokalnym:
							</p>
							<a href={resetLink} className="break-all font-medium hover:underline" style={{ color: "var(--color-accent-soft)" }}>
								{resetLink}
							</a>
						</div>
					)}

					<button type="submit" disabled={loading} className="btn-primary w-full">
						{loading ? (
							<>
								<div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
								Wysyłanie linku...
							</>
						) : (
							"Wyślij link resetu"
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