"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { VehiclePublic } from "@/types/vehicle_types";
import { VehModelPublic } from "@/types/vehmodel_types";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [purpose, setPurpose] = useState("business");
  const [price, setPrice] = useState("0");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vehiclesData = await api.getVehicles();
        setVehicles(vehiclesData.items || []);
      } catch (err) {
        console.error("Failed to fetch vehicles", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!startDate || !endDate || !selectedVehicle) {
      setMessage({ type: "error", text: "Proszę wypełnić wszystkie pola." });
      return;
    }

    setSubmitting(true);
    try {
      // Get current user to get worker_id
      const user = await api.getCurrentUser();
      
      await api.createReservation({
        vehicle_id: parseInt(selectedVehicle),
        worker_id: user.id,
        date_start_planned: new Date(startDate).toISOString(),
        date_end_planned: new Date(endDate).toISOString(),
        purpose: purpose,
        price: parseFloat(price),
      });
      setMessage({ type: "success", text: "Rezerwacja została pomyślnie utworzona!" });
      // Reset form
      setStartDate("");
      setEndDate("");
      setSelectedVehicle("");
      setPrice("0");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Błąd podczas tworzenia rezerwacji." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pojazdy i rezerwacje</h1>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          &larr; Powrót do menu
        </Link>
      </div>
      <div className="bg-white px-4 py-5 shadow sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Nowa rezerwacja</h3>
            <p className="mt-1 text-sm text-gray-500">
              Wybierz pojazd oraz termin, aby zarezerwować samochód z floty.
            </p>
          </div>
          <div className="mt-5 md:col-span-2 md:mt-0">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
                    Planowane rozpoczęcie
                  </label>
                  <input
                    type="datetime-local"
                    id="start-date"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
                    Planowane zakończenie
                  </label>
                  <input
                    type="datetime-local"
                    id="end-date"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
                    Cel rezerwacji
                  </label>
                  <select
                    id="purpose"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  >
                    <option value="business">Służbowy (business)</option>
                    <option value="private">Prywatny (private)</option>
                  </select>
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Szacowany koszt (PLN)
                  </label>
                  <input
                    type="number"
                    id="price"
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="col-span-6">
                  <label htmlFor="vehicle" className="block text-sm font-medium text-gray-700">
                    Wybierz samochód
                  </label>
                  <select
                    id="vehicle"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                    required
                    disabled={loading}
                  >
                    <option value="">Wybierz pojazd...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.description || `Pojazd #${v.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {message && (
                <div
                  className={`mt-4 p-3 rounded-md text-sm ${
                    message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400"
                >
                  {submitting ? "Przetwarzanie..." : "Potwierdź rezerwację"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
