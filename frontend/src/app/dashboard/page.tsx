"use client";

import Link from "next/link";

export default function DashboardPage() {
  const tiles = [
    {
      title: "Wyświetl profil",
      description: "Zarządzaj swoimi danymi i ustawieniami konta.",
      href: "/dashboard/profile",
      icon: "👤",
    },
    {
      title: "Wyświetl wszystkie pojazdy",
      description: "Przeglądaj flotę i dokonuj nowych rezerwacji.",
      href: "/dashboard/vehicles",
      icon: "🚗",
    },
    {
      title: "Wyświetl swoje rezerwacje",
      description: "Sprawdź status swoich obecnych i przyszłych rezerwacji.",
      href: "/dashboard/reservations",
      icon: "📅",
    },
  ];

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Menu główne</h1>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => (
            <Link
              key={tile.href}
              href={tile.href}
              className="flex flex-col items-center p-8 bg-white rounded-xl shadow-sm border border-gray-200 transition-all hover:shadow-md hover:border-indigo-300 group"
            >
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">
                {tile.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{tile.title}</h3>
              <p className="text-gray-500 text-center text-sm">{tile.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
