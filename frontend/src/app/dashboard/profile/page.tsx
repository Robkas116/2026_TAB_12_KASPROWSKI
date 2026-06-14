"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { WorkerPublic } from "@/types/worker_types";

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
		if (oldPassword === newPassword) {
			setChangeError("Nowe hasło nie może być takie samo jak aktualne.");
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
		<div className="space-y-10 relative z-10 py-4">
			{/* Unified Header Section */}
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
				<div className="space-y-2">
					<nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400/80">
						<Link
							href="/dashboard"
							className="hover:text-purple-300 transition-colors"
						>
							System
						</Link>
						<span className="w-1 h-1 rounded-full bg-white/20" />
						<span className="text-white/40">Twój profil</span>
					</nav>
					<h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter">
						Profil{" "}
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
							Kierowcy
						</span>
					</h1>
					<p className="text-gray-400 text-sm max-w-md font-medium leading-relaxed">
						Zarządzaj swoimi danymi, uprawnieniami i ustawieniami bezpieczeństwa w
						systemie.
					</p>
				</div>
				<Link
					href="/dashboard"
					className="btn-ghost px-6 py-3 border-white/5 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center gap-2"
				>
					<svg
						className="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={3}
						aria-hidden="true"
					>
						<title>Powrót</title>
						<path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
					</svg>
					Powrót do menu
				</Link>
			</div>

			<div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

			<div className="glass-surface rounded-2xl overflow-hidden border border-white/5 shadow-xl">
				<div className="p-6 border-b border-white/5 bg-white/[0.02]">
					<h3 className="text-lg font-bold text-white tracking-tight">
						Informacje o użytkowniku
					</h3>
					<p className="mt-1 text-sm text-gray-400 font-medium">
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
					<dl className="divide-y divide-white/5">
						{/* Avatar & name row */}
						<div className="px-6 py-6 sm:grid sm:grid-cols-3 sm:gap-4 items-center hover:bg-white/[0.01] transition-colors">
							<dt className="text-[10px] font-black uppercase tracking-widest text-white/30">
								Tożsamość
							</dt>
							<dd className="mt-2 sm:mt-0 sm:col-span-2 flex items-center gap-4">
								<div
									className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-black shadow-lg shadow-purple-500/20"
									style={{
										background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
										color: "white",
									}}
								>
									{user?.name?.charAt(0).toUpperCase() || "?"}
								</div>
								<span className="text-lg font-bold text-white tracking-tight">
									{user?.name || "—"}
								</span>
							</dd>
						</div>

						<div className="px-6 py-6 sm:grid sm:grid-cols-3 sm:gap-4 items-center hover:bg-white/[0.01] transition-colors">
							<dt className="text-[10px] font-black uppercase tracking-widest text-white/30">
								Email
							</dt>
							<dd className="mt-1 sm:mt-0 sm:col-span-2 font-medium text-gray-300">
								{user?.email || "—"}
							</dd>
						</div>

						<div className="px-6 py-6 sm:grid sm:grid-cols-3 sm:gap-4 items-center hover:bg-white/[0.01] transition-colors">
							<dt className="text-[10px] font-black uppercase tracking-widest text-white/30">
								Rola
							</dt>
							<dd className="mt-1 sm:mt-0 sm:col-span-2">
								<span
									className="badge px-3 py-1 text-[10px] font-black uppercase tracking-widest border"
									style={{
										background: user?.is_superuser
											? "rgba(139, 92, 246, 0.1)"
											: "rgba(52, 211, 153, 0.1)",
										color: user?.is_superuser ? "#c4b5fd" : "#34d399",
										borderColor: user?.is_superuser
											? "rgba(139, 92, 246, 0.2)"
											: "rgba(52, 211, 153, 0.2)",
									}}
								>
									{user?.is_superuser ? "Administrator" : "Pracownik"}
								</span>
							</dd>
						</div>

						<div className="px-6 py-6 sm:grid sm:grid-cols-3 sm:gap-4 items-center hover:bg-white/[0.01] transition-colors">
							<dt className="text-[10px] font-black uppercase tracking-widest text-white/30">
								Przewodnik startowy
							</dt>
							<dd className="mt-1 sm:mt-0 sm:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
								<span className="text-sm font-medium text-gray-300">
									Chcesz odświeżyć informacje o systemie? Uruchom ponownie interaktywny
									przewodnik startowy.
								</span>
								<button
									type="button"
									onClick={() => {
										window.dispatchEvent(new CustomEvent("reset-onboarding-tour"));
									}}
									className="btn-ghost text-xs !px-4 !py-2 border-white/10 hover:bg-purple-500/10 hover:text-purple-300 hover:border-purple-500/30 transition-all font-bold uppercase tracking-wider whitespace-nowrap"
								>
									Uruchom przewodnik
								</button>
							</dd>
						</div>
						<div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
							<dt
								className="text-sm font-medium"
								style={{ color: "var(--color-text-muted)" }}
							>
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
