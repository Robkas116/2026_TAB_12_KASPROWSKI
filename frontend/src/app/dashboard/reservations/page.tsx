"use client";

import Link from "next/link";

export default function ReservationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Twoje rezerwacje</h1>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          &larr; Powrót do menu
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          <li className="px-6 py-12 text-center text-gray-500">
            <div className="text-4xl mb-4">📭</div>
            <p>Nie masz jeszcze żadnych rezerwacji.</p>
            <div className="mt-6">
              <Link
                href="/dashboard/vehicles"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Zarezerwuj pierwszy pojazd
              </Link>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
