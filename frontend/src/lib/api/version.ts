import type {
	VersionCreate,
	VersionPublic,
	VersionsPublic,
	VersionUpdate,
} from "@/types/version_types";
import { API_URL } from "./config";

export const versionApi = {
	getAll: async (skip = 0, limit = 100): Promise<VersionsPublic> => {
		const response = await fetch(
			`${API_URL}/version/?skip=${skip}&limit=${limit}`,
		);
		if (!response.ok) throw new Error(`Version GET Error: ${response.status}`);
		return response.json();
	},

	create: async (data: VersionCreate): Promise<VersionPublic> => {
		const response = await fetch(`${API_URL}/version/`, {
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
			throw new Error(`Failed to create Version: ${response.status}`);
		}
		return response.json();
	},

	update: async (id: number, data: VersionUpdate): Promise<VersionPublic> => {
		const response = await fetch(`${API_URL}/version/${id}`, {
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
			throw new Error(`Failed to update Version: ${response.status}`);
		}
		return response.json();
	},

	delete: async (id: number) => {
		const response = await fetch(`${API_URL}/version/${id}`, {
			method: "DELETE",
		});
		if (!response.ok) {
			const errorData = await response.json();
			if (response.status === 409) {
				const conflictMessage = errorData.detail || "Database integration error";
				throw new Error(`${conflictMessage}`);
			}
			throw new Error(`Version DELETE Error: ${response.status}`);
		}
		return response.json();
	},
};
