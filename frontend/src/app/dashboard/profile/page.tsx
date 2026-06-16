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

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Left Column: Personal Info Card */}
				<div className="lg:col-span-2 space-y-8">
					<div className="glass-surface rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl relative group">
						<div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
						
						<div className="p-8 sm:p-10 border-b border-white/5 bg-white/[0.02] flex items-center justify-between relative z-10">
							<div className="space-y-1">
								<h3 className="text-xl font-black text-white tracking-tight">
									Informacje <span className="text-purple-400">Osobiste</span>
								</h3>
								<p className="text-xs text-gray-400 font-bold uppercase tracking-widest opacity-60">
									Dane profilowe i tożsamość
								</p>
							</div>
							<div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-400">
								<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
								</svg>
							</div>
						</div>

						{loading ? (
							<div className="p-10 space-y-6">
								<div className="flex items-center gap-6">
									<div className="skeleton h-20 w-20 rounded-3xl" />
									<div className="space-y-3">
										<div className="skeleton h-6 w-48" />
										<div className="skeleton h-4 w-32" />
									</div>
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
									<div className="skeleton h-20 w-full rounded-2xl" />
									<div className="skeleton h-20 w-full rounded-2xl" />
								</div>
							</div>
						) : (
							<div className="p-8 sm:p-10 space-y-10 relative z-10">
								{/* Avatar Hero Section */}
								<div className="flex flex-col sm:flex-row items-center gap-8">
									<div className="relative group/avatar">
										<div className="absolute -inset-1 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-[2rem] blur opacity-25 group-hover/avatar:opacity-50 transition duration-500" />
										<div className="relative h-24 w-24 flex items-center justify-center rounded-[1.8rem] bg-[#0d0f14] border border-white/10 text-3xl font-black text-white shadow-2xl">
											{user?.name?.charAt(0).toUpperCase() || "?"}
										</div>
										<div className="absolute -bottom-2 -right-2 h-8 w-8 bg-emerald-500 rounded-xl border-4 border-[#0d0f14] flex items-center justify-center">
											<div className="h-2 w-2 bg-white rounded-full animate-pulse" />
										</div>
									</div>
									<div className="text-center sm:text-left space-y-2">
										<h4 className="text-2xl font-black text-white tracking-tighter">
											{user?.name || "Kierowca Nienazwany"}
										</h4>
										<div className="flex flex-wrap justify-center sm:justify-start gap-3">
											<span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest text-blue-300">
												Szerokiej drogi!
											</span>
										</div>
									</div>
								</div>

								{/* Info Grid */}
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
									<div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 space-y-3 hover:bg-white/[0.05] transition-colors group/item">
										<div className="flex items-center gap-3">
											<div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover/item:scale-110 transition-transform">
												<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
												</svg>
											</div>
											<span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Adres Email</span>
										</div>
										<p className="text-lg font-bold text-gray-200 truncate">{user?.email || "—"}</p>
									</div>

									<div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 space-y-3 hover:bg-white/[0.05] transition-colors group/item">
										<div className="flex items-center gap-3">
											<div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover/item:scale-110 transition-transform">
												<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
												</svg>
											</div>
											<span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Rola w systemie</span>
										</div>
										<div className="flex items-center gap-2">
											<span className={`px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest border ${
												user?.is_superuser 
												? "bg-purple-500/10 border-purple-500/20 text-purple-300" 
												: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
											}`}>
												{user?.is_superuser ? "Administrator" : "Pracownik"}
											</span>
										</div>
									</div>
								</div>

								{/* Onboarding Section */}
								<div className="p-6 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-[2rem] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
									<div className="flex items-center gap-4">
										<div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-purple-400">
											<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
										</div>
										<div className="space-y-0.5">
											<p className="text-sm font-bold text-white">Pomoc i Przewodnik</p>
											<p className="text-xs text-gray-500 font-medium">Uruchom interaktywny samouczek systemu</p>
										</div>
									</div>
									<button
										type="button"
										onClick={() => {
											window.dispatchEvent(new CustomEvent("reset-onboarding-tour"));
										}}
										className="btn-ghost !px-6 !py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-white/10 hover:bg-white/5 whitespace-nowrap"
									>
										Uruchom Tutorial
									</button>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Right Column: Security Card */}
				<div className="space-y-8">
					<div className="glass-surface rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden relative group">
						<div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
						
						<div className="p-8 border-b border-white/5 bg-white/[0.02] relative z-10">
							<div className="flex items-center gap-3 mb-1">
								<div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
									<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
									</svg>
								</div>
								<h3 className="text-xl font-black text-white tracking-tight">Bezpieczeństwo</h3>
							</div>
							<p className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-10">Zmiana Hasła Dostępu</p>
						</div>

						<div className="p-8 space-y-6 relative z-10">
							<form onSubmit={handleChangePassword} className="space-y-4">
								<div className="space-y-2">
									<label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Aktualne Hasło</label>
									<input
										type="password"
										placeholder="••••••••"
										className="input-dark w-full !bg-white/5 border-white/10 focus:border-rose-500/50 rounded-2xl py-4 px-5 text-sm"
										value={oldPassword}
										onChange={(e) => setOldPassword(e.target.value)}
									/>
								</div>
								
								<div className="h-px w-full bg-white/5 my-2" />

								<div className="space-y-2">
									<label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Nowe Hasło</label>
									<input
										type="password"
										placeholder="Nowe hasło"
										className="input-dark w-full !bg-white/5 border-white/10 focus:border-purple-500/50 rounded-2xl py-4 px-5 text-sm"
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
									/>
								</div>

								<div className="space-y-2">
									<label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Potwierdź Hasło</label>
									<input
										type="password"
										placeholder="Powtórz hasło"
										className="input-dark w-full !bg-white/5 border-white/10 focus:border-purple-500/50 rounded-2xl py-4 px-5 text-sm"
										value={confirmNewPassword}
										onChange={(e) => setConfirmNewPassword(e.target.value)}
									/>
								</div>

								{changeError && (
									<div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 animate-shake">
										<svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										<p className="text-xs font-bold text-rose-300 leading-relaxed">{changeError}</p>
									</div>
								)}

								{changeSuccess && (
									<div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
										<svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										<p className="text-xs font-bold text-emerald-300 leading-relaxed">{changeSuccess}</p>
									</div>
								)}

								<button 
									type="submit" 
									disabled={changing} 
									className="btn-primary w-full py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(139,92,246,0.3)] hover:shadow-[0_15px_40px_rgba(139,92,246,0.5)] transition-all mt-4"
								>
									{changing ? "Przetwarzanie..." : "Zaktualizuj Hasło"}
								</button>
							</form>
						</div>
					</div>

					{/* Mini Stats/Quick Info */}
					<div className="glass-surface rounded-[2.5rem] p-8 border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
						<div className="flex items-center gap-4 text-white/40">
							<div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
							<span className="text-[10px] font-black uppercase tracking-widest">Wszystkie systemy sprawne</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
