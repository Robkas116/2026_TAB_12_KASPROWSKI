
import type {
    ReservationCreate,
    ReservationPublic,
    ReservationsPublic,
    ReservationUpdate,
} from "@/types/reservation_types";
import { API_URL } from "./config";

export const reservationApi = {
    getAll: async (skip = 0, limit = 100, worker_id?: number): Promise<ReservationsPublic> => {
        let url = `${API_URL}/reservation/?skip=${skip}&limit=${limit}`;
        if (worker_id !== undefined) {
            url += `&worker_id=${worker_id}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Reservation GET Error: ${response.status}`);
        return response.json();
    },

    create: async (data: ReservationCreate): Promise<ReservationPublic> => {
        const response = await fetch(`${API_URL}/reservation/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 422 && errorData.detail) {
                const ValidationMessage = errorData.detail[0].msg;
                throw new Error(`Validation Error: ${ValidationMessage}`);
            }
            throw new Error(`Failed to create Reservation: ${response.status}`);
        }
        return response.json();
    },

    update: async (
        id: number,
        data: ReservationUpdate,
    ): Promise<ReservationPublic> => {
        const response = await fetch(`${API_URL}/reservation/${id}`, {
            method: "PATCH", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 422 && errorData.detail) {
                const ValidationMessage = errorData.detail[0].msg;
                throw new Error(`Validation Error: ${ValidationMessage}`);
            }
            throw new Error(`Failed to update Reservation: ${response.status}`);
        }
        return response.json();
    },

    requestExploitation: async (reservationId: number, data: { action_id: number; price: number; date: string; state: string }) => {
        const response = await fetch(`${API_URL}/reservation/${reservationId}/request-exploitation`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...data, reservation_id: reservationId }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Błąd zgłaszania eksploatacji.");
        }
        return response.json();
    },

    delete: async (id: number) => {
        const response = await fetch(`${API_URL}/reservation/${id}`, {
            method: "DELETE",
        });
        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 409) {
                const conflictMessage = errorData.detail || "Database integration error";
                throw new Error(`${conflictMessage}`);
            }
            throw new Error(`Reservation DELETE Error: ${response.status}`);
        }
        return response.json();
    },
};

