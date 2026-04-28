import type {
	EquipmentCreate,
	EquipmentPublic,
	EquipmentsPublic,
	EquipmentUpdate,
} from "@/types/equipment_types";
import { API_URL } from "./config";

export const equipmentApi = {
	getAll: async (skip = 0, limit = 100): Promise<EquipmentsPublic> => {
		const response = await fetch(
			`${API_URL}/equipment/?skip=${skip}&limit=${limit}`,
		);
		if (!response.ok) throw new Error(`Equipment GET Error: ${response.status}`);
		return response.json();
	},

	create: async (data: EquipmentCreate): Promise<EquipmentPublic> => {
		const response = await fetch(`${API_URL}/equipment/`, {
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
			throw new Error(`Failed to create Equipment: ${response.status}`);
		}
		return response.json();
	},

	update: async (
		id: number,
		data: EquipmentUpdate,
	): Promise<EquipmentPublic> => {
		const response = await fetch(`${API_URL}/equipment/${id}`, {
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
			throw new Error(`Failed to update Equipment: ${response.status}`);
		}
		return response.json();
	},

	delete: async (id: number) => {
		const response = await fetch(`${API_URL}/equipment/${id}`, {
			method: "DELETE",
		});
		if (!response.ok) {
			const errorData = await response.json();
			if (response.status === 409) {
				const conflictMessage = errorData.detail || "Database integration error";
				throw new Error(`${conflictMessage}`);
			}
			throw new Error(`Equipment DELETE Error: ${response.status}`);
		}
		return response.json();
	},
};
