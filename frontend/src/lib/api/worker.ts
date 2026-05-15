import type {
    WorkerCreate,
    WorkerPublic,
    WorkersPublic,
    WorkerUpdate,
} from "@/types/worker_types";
import { API_URL } from "./config";

async function getApiErrorMessage(response: Response, fallback: string) {
    try {
        const errorData = await response.json();

        if (response.status === 422 && errorData.detail) {
            const validationDetail = errorData.detail[0];
            return `Validation Error: ${validationDetail.msg}`;
        }

        if (typeof errorData.detail === "string") {
            return errorData.detail;
        }

        if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
            return `Validation Error: ${errorData.detail[0].msg}`;
        }
    } catch {
        // Fall back to a generic message when the response body is not JSON.
    }

    return fallback;
}

export const workerApi = {
    getAll: async (skip = 0, limit = 100): Promise<WorkersPublic> => {
        const response = await fetch(`${API_URL}/worker/?skip=${skip}&limit=${limit}`);
        if (!response.ok) throw new Error(`Worker GET Error: ${response.status}`);
        return response.json();
    },

    create: async (data: WorkerCreate): Promise<WorkerPublic> => {
        const response = await fetch(`${API_URL}/worker/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(
                await getApiErrorMessage(response, `Failed to create Worker: ${response.status}`),
            );
        }
        return response.json();
    },

    update: async (id: number, data: WorkerUpdate): Promise<WorkerPublic> => {
        const response = await fetch(`${API_URL}/worker/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(
                await getApiErrorMessage(response, `Failed to update Worker: ${response.status}`),
            );
        }
        return response.json();
    },

    delete: async (id: number) => {
        const response = await fetch(`${API_URL}/worker/${id}`, {
            method: "DELETE",
        });
        if (!response.ok) {
            throw new Error(
                await getApiErrorMessage(response, `Worker DELETE Error: ${response.status}`),
            );
        }
        return response.json();
    },
};
