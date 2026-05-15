import type {
	IsPerformedCreate,
	IsPerformedPublic,
	IsPerformedsPublic,
	IsPerformedUpdate,
} from "@/types/is_performed_types";
import { API_URL } from "./config";

export const isPerformedApi = {
	getAll: async (
		skip = 0,
		limit = 100,
	): Promise<IsPerformedsPublic> => {
		const response = await fetch(
			`${API_URL}/is-performed/?skip=${skip}&limit=${limit}`,
		);
		if (!response.ok) throw new Error(`IsPerformed GET Error: ${response.status}`);
		const result: { data: IsPerformedPublic[]; count: number } = await response.json();
		return {
			items: result.data,
			total: result.count,
			skip,
			limit,
		};
	},

	create: async (data: IsPerformedCreate): Promise<IsPerformedPublic> => {
		const response = await fetch(`${API_URL}/is-performed/`, {
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
			throw new Error(`Failed to create IsPerformed: ${response.status}`);
		}
		return response.json();
	},

	update: async (id: number, data: IsPerformedUpdate): Promise<IsPerformedPublic> => {
		const response = await fetch(`${API_URL}/is-performed/${id}`, {
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
			throw new Error(`Failed to update IsPerformed: ${response.status}`);
		}
		return response.json();
	},

	delete: async (id: number) => {
		const response = await fetch(`${API_URL}/is-performed/${id}`, {
			method: "DELETE",
		});
		if (!response.ok) {
			const errorData = await response.json();
			if (response.status === 409) {
				const conflictMessage = errorData.detail || "Database integration error";
				throw new Error(`${conflictMessage}`);
			}
			throw new Error(`IsPerformed DELETE Error: ${response.status}`);
		}
		return response.json();
	},
};
