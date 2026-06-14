"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import OnboardingTour from "@/components/OnboardingTour";
import { ToastProvider } from "@/components/ui/Toast";
import { api, subscribeToAuthChanges } from "@/lib/api";
import type { WorkerPublic } from "@/types/worker_types";

const UserContext = createContext<WorkerPublic | null>(null);
export const useUser = () => useContext(UserContext);

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [user, setUser] = useState<WorkerPublic | null>(null);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [showTour, setShowTour] = useState(false);
	const router = useRouter();
	const pathname = usePathname();

	const fetchUser = useCallback(async () => {
		try {
			const userData = await api.getCurrentUser();
			setUser(userData);
			if (!userData.onboarding_completed) {
				setShowTour(true);
			}
		} catch {
			setUser(null);
			router.push("/login");
		}
	}, [router]);

	useEffect(() => {
		const handleResetTour = () => {
			setShowTour(true);
		};
		window.addEventListener("reset-onboarding-tour", handleResetTour);
		return () => {
			window.removeEventListener("reset-onboarding-tour", handleResetTour);
		};
	}, []);

	useEffect(() => {
		const unsubscribe = subscribeToAuthChanges(() => {
			if (api.hasToken()) {
				fetchUser();
				return;
			}
			setUser(null);
		});

		fetchUser();
		return unsubscribe;
	}, [fetchUser]);

	const handleLogout = () => {
		api.logout();
	};

	const handleTourComplete = async () => {
		try {
			const updatedUser = await api.completeOnboarding();
			setUser(updatedUser);
			setShowTour(false);
		} catch (err) {
			console.error("Failed to complete onboarding", err);
			setShowTour(false);
		}
	};

	const navLinks = [
		{ href: "/dashboard", label: "Menu", exact: true },
		{ href: "/dashboard/vehicles", label: "Pojazdy" },
		{ href: "/dashboard/reservations", label: "Rezerwacje" },
		{ href: "/dashboard/profile", label: "Profil" },
	];

	if (
		user?.is_superuser &&
		!navLinks.some((link) => link.href.includes("admin"))
	) {
		navLinks.push({ href: "/dashboard/admin", label: "Panel Admina" });
	}

	if (!user) {
		return (
			<div className="flex min-h-screen items-center justify-center surface-base">
				<div className="flex flex-col items-center gap-4">
					<div
						className="h-10 w-10 rounded-full border-2 animate-spin"
						style={{
							borderColor: "var(--color-accent)",
							borderTopColor: "transparent",
						}}
					/>
					<p style={{ color: "var(--color-text-secondary)" }} className="text-sm">
						Ładowanie...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen surface-base relative overflow-hidden">
			{/* Cinematic Background */}
			<div className="fixed inset-0 z-0 pointer-events-none">
				<Image
					src="/assets/bg/hero-road.jpg"
					alt="Background"
					fill
					className="object-cover opacity-15 scale-105"
					priority
				/>
				<div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-[#0a0b0e]" />
			</div>

			{/* Animated background grain */}
			<div
				className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03]"
				aria-hidden="true"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
					backgroundSize: "256px 256px",
				}}
			/>

			{/* Navigation */}
			<nav
				className="glass-surface sticky top-0 z-40 border-b"
				style={{ borderColor: "var(--color-border)" }}
			>
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="flex h-16 items-center justify-between">
						{/* Logo */}
						<Link href="/dashboard" className="flex items-center gap-3 group">
							<div
								className="flex h-9 w-9 items-center justify-center rounded-lg transition-shadow group-hover:shadow-lg"
								style={{
									background: "var(--color-accent-glow)",
									boxShadow: "0 0 12px var(--color-accent-glow)",
								}}
							>
								<svg
									className="h-5 w-5"
									style={{ color: "var(--color-accent-soft)" }}
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<title>Logo</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M13 10V3L4 14h7v7l9-11h-7z"
									/>
								</svg>
							</div>
							<span
								className="text-lg font-bold tracking-tight"
								style={{ color: "var(--color-text-primary)" }}
							>
								Fleet<span style={{ color: "var(--color-accent-soft)" }}>Manager</span>
							</span>
						</Link>

						{/* Desktop nav links */}
						<div className="hidden md:flex items-center gap-1">
							{navLinks.map((link) => {
								const isActive = link.exact
									? pathname === link.href
									: pathname.startsWith(link.href);
								return (
									<Link
										key={link.href}
										href={link.href}
										className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
											isActive ? "text-white" : "hover:text-white"
										}`}
										style={{
											color: isActive
												? "var(--color-text-primary)"
												: "var(--color-text-secondary)",
											background: isActive ? "var(--color-overlay)" : "transparent",
										}}
									>
										{link.label}
										{isActive && (
											<span
												className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full"
												style={{ background: "var(--color-accent)" }}
											/>
										)}
									</Link>
								);
							})}
						</div>

						{/* User section */}
						<div className="flex items-center gap-4">
							<Link 
								href="/dashboard/profile"
								className="flex items-center gap-3 pl-2 pr-4 py-2 rounded-full bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all group/user shadow-lg"
							>
								<div
									className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black shadow-xl shadow-purple-500/30 group-hover/user:scale-105 transition-transform"
									style={{
										background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
										color: "white",
									}}
								>
									{user.name?.charAt(0).toUpperCase()}
								</div>
								<div className="flex flex-col leading-tight hidden lg:flex">
									<span className="text-sm font-black text-white group-hover/user:text-purple-400 transition-colors tracking-tight">
										{user.name}
									</span>
									<span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
										{user.is_superuser ? "Administrator" : "Pracownik"}
									</span>
								</div>
							</Link>

							<div className="h-5 w-px bg-white/10 mx-1 hidden sm:block" />

							<button
								type="button"
								onClick={handleLogout}
								className="btn-ghost !px-4 !py-2 !text-xs font-black uppercase tracking-widest text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all border-none"
							>
								Wyloguj
							</button>

							{/* Mobile menu toggle */}
							<button
								type="button"
								onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
								className="md:hidden p-2 rounded-lg"
								style={{ color: "var(--color-text-secondary)" }}
								aria-label="Toggle menu"
							>
								{mobileMenuOpen ? (
									<svg
										className="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-hidden="true"
									>
										<title>Zamknij menu</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								) : (
									<svg
										className="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-hidden="true"
									>
										<title>Otwórz menu</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M4 6h16M4 12h16M4 18h16"
										/>
									</svg>
								)}
							</button>
						</div>
					</div>

					{/* Mobile menu */}
					{mobileMenuOpen && (
						<div
							className="md:hidden border-t py-3 space-y-1"
							style={{ borderColor: "var(--color-border)" }}
						>
							{navLinks.map((link) => {
								const isActive = link.exact
									? pathname === link.href
									: pathname.startsWith(link.href);
								return (
									<Link
										key={link.href}
										href={link.href}
										onClick={() => setMobileMenuOpen(false)}
										className="block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
										style={{
											color: isActive
												? "var(--color-text-primary)"
												: "var(--color-text-secondary)",
											background: isActive ? "var(--color-overlay)" : "transparent",
										}}
									>
										{link.label}
									</Link>
								);
							})}
						</div>
					)}
				</div>
			</nav>

			{/* Main content */}
			<main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
				<ToastProvider>
					{}
					<UserContext.Provider value={user}>{children}</UserContext.Provider>
				</ToastProvider>
			</main>

			<OnboardingTour
				isOpen={showTour}
				user={user}
				onComplete={handleTourComplete}
			/>
		</div>
	);
}
