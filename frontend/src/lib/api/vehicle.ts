import type {
	VehicleCreate,
	VehiclePublic,
	VehiclesPublic,
	VehicleUpdate,
} from "@/types/vehicle_types";
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

export const vehicleApi = {
	getAll: async (skip = 0, limit = 100): Promise<VehiclesPublic> => {
		const response = await fetch(
			`${API_URL}/vehicle/?skip=${skip}&limit=${limit}`,
		);
		if (!response.ok) throw new Error(`Vehicle GET Error: ${response.status}`);
		const result = await response.json();
		// Map backend response (data, count) to frontend format (items, total)
		return {
			items: result.data,
			total: result.count,
			skip,
			limit,
		};
	},

	create: async (data: VehicleCreate): Promise<VehiclePublic> => {
		const response = await fetch(`${API_URL}/vehicle/`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});
		if (!response.ok) {
			throw new Error(
				await getApiErrorMessage(
					response,
					`Failed to create Vehicle: ${response.status}`,
				),
			);
		}
		return response.json();
	},

	update: async (id: number, data: VehicleUpdate): Promise<VehiclePublic> => {
		const response = await fetch(`${API_URL}/vehicle/${id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});
		if (!response.ok) {
			throw new Error(
				await getApiErrorMessage(
					response,
					`Failed to update Vehicle: ${response.status}`,
				),
			);
		}
		return response.json();
	},

	delete: async (id: number) => {
		const response = await fetch(`${API_URL}/vehicle/${id}`, {
			method: "DELETE",
		});
		if (!response.ok) {
			throw new Error(
				await getApiErrorMessage(
					response,
					`Vehicle DELETE Error: ${response.status}`,
				),
			);
		}
		return response.json();
	},
};
