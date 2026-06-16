import { API_URL } from "./config";
import type {
  VehicleWithMake,
  VehiclesWithMakePublic,
  PanelReservationPublic,
  PanelReservationsPublic,
  PanelExploitationPublic,
  PanelExploitationsPublic,
} from "@/types/caretaker_panel_types";
import type {
  ReservationCreate,
  ReservationUpdate,
  ReservationPublic,
} from "@/types/reservation_types";
import type { IsPerformedUpdate } from "@/types/is_performed_types";

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function handleResponse<T>(
  response: Response,
  fallback: string,
): Promise<T> {
  if (!response.ok) {
    let detail = fallback;
    try {
      const err = await response.json();
      detail = err.detail || fallback;
    } catch {
      // use fallback
    }
    throw new Error(detail);
  }
  return response.json();
}

export const caretakerPanelApi = {
  getMyVehicles: async (): Promise<VehicleWithMake[]> => {
    const response = await fetch(`${API_URL}/caretaker-panel/vehicles`, {
      headers: getAuthHeaders(),
    });
    const result = await handleResponse<VehiclesWithMakePublic>(
      response,
      "Błąd pobierania pojazdów.",
    );
    return result.data;
  },

  getReservations: async (
    vehicleId: number,
  ): Promise<PanelReservationPublic[]> => {
    const response = await fetch(
      `${API_URL}/caretaker-panel/vehicles/${vehicleId}/reservations?skip=0&limit=100`,
      { headers: getAuthHeaders() },
    );
    const result = await handleResponse<PanelReservationsPublic>(
      response,
      "Błąd pobierania rezerwacji.",
    );
    return result.data;
  },

  createServiceReservation: async (
    vehicleId: number,
    data: ReservationCreate,
  ): Promise<ReservationPublic> => {
    const response = await fetch(
      `${API_URL}/caretaker-panel/vehicles/${vehicleId}/service`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(data),
      },
    );
    return handleResponse<ReservationPublic>(
      response,
      "Błąd tworzenia rezerwacji serwisowej.",
    );
  },

  editServiceReservation: async (
    vehicleId: number,
    reservationId: number,
    data: ReservationUpdate,
  ): Promise<ReservationPublic> => {
    const response = await fetch(
      `${API_URL}/caretaker-panel/vehicles/${vehicleId}/service/${reservationId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(data),
      },
    );
    return handleResponse<ReservationPublic>(
      response,
      "Błąd aktualizacji rezerwacji serwisowej.",
    );
  },

  cancelReservation: async (
    vehicleId: number,
    reservationId: number,
  ): Promise<ReservationPublic> => {
    const response = await fetch(
      `${API_URL}/caretaker-panel/vehicles/${vehicleId}/reservations/${reservationId}/cancel`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      },
    );
    return handleResponse<ReservationPublic>(
      response,
      "Błąd anulowania rezerwacji.",
    );
  },

  getExploitations: async (
    vehicleId: number,
  ): Promise<PanelExploitationPublic[]> => {
    const response = await fetch(
      `${API_URL}/caretaker-panel/vehicles/${vehicleId}/exploitations?skip=0&limit=100`,
      { headers: getAuthHeaders() },
    );
    const result = await handleResponse<PanelExploitationsPublic>(
      response,
      "Błąd pobierania eksploatacji.",
    );
    return result.data;
  },

  updateExploitation: async (
    vehicleId: number,
    isPerformedId: number,
    data: IsPerformedUpdate,
  ): Promise<void> => {
    const response = await fetch(
      `${API_URL}/caretaker-panel/vehicles/${vehicleId}/exploitations/${isPerformedId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(data),
      },
    );
    if (!response.ok) {
      let detail = "Błąd aktualizacji eksploatacji.";
      try {
        const err = await response.json();
        detail = err.detail || detail;
      } catch {
        // use fallback
      }
      throw new Error(detail);
    }
  },
};
