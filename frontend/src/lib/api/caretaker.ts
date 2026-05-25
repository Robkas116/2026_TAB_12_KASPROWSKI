import type {
    CaretakerCreate,
    CaretakerPublic,
    CaretakersPublic,
    CaretakerUpdate,
} from "@/types/caretaker_types";
import { API_URL } from "./config";

export const caretakerApi = {
    getAll: async (skip = 0, limit = 100): Promise<CaretakersPublic> => {
        const response = await fetch(
            `${API_URL}/caretaker/?skip=${skip}&limit=${limit}`,
        );
        if (!response.ok) throw new Error(`Caretaker GET Error: ${response.status}`);
        return response.json();
    },

    create: async (data: CaretakerCreate): Promise<CaretakerPublic> => {
        const response = await fetch(`${API_URL}/caretaker/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json();
            // Obsługa zarówno standardowego błędu 422 (Pydantic) jak i Twojego ręcznego 400 z HTTPException
            const msg = errorData.detail?.[0]?.msg || errorData.detail || "Validation Error";
            throw new Error(`Failed to create Caretaker: ${msg}`);
        }
        return response.json();
    },

    update: async (
        id: number,
        data: CaretakerUpdate,
    ): Promise<CaretakerPublic> => {
        const response = await fetch(`${API_URL}/caretaker/${id}`, {
            method: "PATCH", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json();
            const msg = errorData.detail?.[0]?.msg || errorData.detail || "Validation Error";
            throw new Error(`Failed to update Caretaker: ${msg}`);
        }
        return response.json();
    },

    delete: async (id: number) => {
        const response = await fetch(`${API_URL}/caretaker/${id}`, {
            method: "DELETE",
        });
        if (!response.ok) {
            const errorData = await response.json();
            const conflictMessage = errorData.detail || "Database integration error";
            throw new Error(`Caretaker DELETE Error: ${conflictMessage}`);
        }
        return response.json();
    },
};

