"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useUser } from "./layout";
import { caretakerPanelApi } from "@/lib/api/caretaker_panel";

const tiles = [
  {
    title: "Mój profil",
    description: "Zarządzaj swoimi danymi osobowymi i ustawieniami konta.",
    href: "/dashboard/profile",
    gradient: "from-violet-600/20 to-purple-500/5",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    title: "Flota pojazdów",
    description: "Przeglądaj wszystkie pojazdy i dokonuj nowych rezerwacji.",
    href: "/dashboard/vehicles",
    gradient: "from-emerald-600/20 to-teal-500/5",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    title: "Moje rezerwacje",
    description: "Sprawdź status swoich obecnych i przeszłych rezerwacji.",
    href: "/dashboard/reservations",
    gradient: "from-amber-600/20 to-orange-500/5",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
];

export default function DashboardPage() {

  const user = useUser();

  const isSuperUser = user?.is_superuser || false;

  const [isCaretaker, setIsCaretaker] = useState(false);
  const [caretakerVehicleCount, setCaretakerVehicleCount] = useState(0);

  useEffect(() => {
    caretakerPanelApi
      .getMyVehicles()
      .then((vehicles) => {
        setIsCaretaker(vehicles.length > 0);
        setCaretakerVehicleCount(vehicles.length);
      })
      .catch(() => setIsCaretaker(false));
  }, []);

  const caretakerTile = {
    title: "Twoje Pojazdy",
    description: `Zarządzaj ${caretakerVehicleCount} pojazd${caretakerVehicleCount === 1 ? "em" : "ami"}, których jesteś opiekunem.`,
    href: "/dashboard/caretaker",
    gradient: "from-cyan-600/20 to-blue-500/5",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  };

  const displayTiles = isCaretaker
    ? [tiles[0], caretakerTile, ...tiles.slice(1)]
    : tiles;

  return (
    <div className="space-y-10 relative z-10 py-4">
      {/* Nagłówek */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="space-y-2">
          <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400/80">
            <span>System</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-white/40">Panel Główny</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter">
            Menu <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Główne</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-xl font-medium leading-relaxed">
            Witaj w centrum zarządzania flotą. Wybierz sekcję, aby monitorować pojazdy, przeglądać harmonogramy lub zarządzać swoim kontem.
          </p>
        </div>

        {/* PRZYCISK ADMINA */}
        {isSuperUser && (
          <div className="flex-shrink-0">
            <Link
              href="/dashboard/admin/"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-[0_4px_20px_rgba(139,92,246,0.25)] hover:shadow-[0_4px_25px_rgba(139,92,246,0.4)] transition-all duration-300 hover:-translate-y-0.5"
            >
              <svg className="h-4 w-4 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Zarządzanie danymi (Admin)</span>
            </Link>
          </div>
        )}
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Kafki */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {displayTiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="glass-elevated rounded-[2rem] p-8 group relative overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_-15px_rgba(139,92,246,0.2)] border-white/5 hover:border-purple-500/30"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${tile.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} aria-hidden="true" />
            <div className="relative z-10">
              <div
                className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-[0_0_25px_rgba(139,92,246,0.3)]"
                style={{
                  background: "rgba(139, 92, 246, 0.1)",
                  color: "var(--color-accent-soft)",
                  border: "1px solid rgba(139, 92, 246, 0.2)"
                }}
              >
                {tile.icon}
              </div>
              <h3 className="text-xl font-black mb-3 text-white group-hover:text-purple-300 transition-colors tracking-tight">
                {tile.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-400 font-medium group-hover:text-gray-300 transition-colors">
                {tile.description}
              </p>
              <div className="flex items-center gap-2 mt-8 text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-[-10px] group-hover:translate-x-0 text-purple-400">
                <span>Otwórz sekcję</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}