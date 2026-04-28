import type {
	SetOfEquipmentCreate,
	SetOfEquipmentPublic,
	SetOfEquipmentsPublic,
	SetOfEquipmentUpdate,
} from "@/types/set_of_equipment_types";
import { API_URL } from "./config";

export const setofequipmentApi = {
	getAll: async (skip = 0, limit = 100): Promise<SetOfEquipmentsPublic> => {
		const response = await fetch(
			`${API_URL}/set-of-equipment/?skip=${skip}&limit=${limit}`,
		);
		if (!response.ok)
			throw new Error(`SetOfEquipment GET Error: ${response.status}`);
		return response.json();
	},

	create: async (data: SetOfEquipmentCreate): Promise<SetOfEquipmentPublic> => {
		const response = await fetch(`${API_URL}/set-of-equipment/`, {
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
			throw new Error(`Failed to create SetOfEquipment: ${response.status}`);
		}
		return response.json();
	},

	update: async (
		id: number,
		data: SetOfEquipmentUpdate,
	): Promise<SetOfEquipmentPublic> => {
		const response = await fetch(`${API_URL}/set-of-equipment/${id}`, {
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
			throw new Error(`Failed to update SetOfEquipment: ${response.status}`);
		}
		return response.json();
	},

	delete: async (id: number) => {
		const response = await fetch(`${API_URL}/set-of-equipment/${id}`, {
			method: "DELETE",
		});
		if (!response.ok) {
			const errorData = await response.json();
			if (response.status === 409) {
				const conflictMessage = errorData.detail || "Database integration error";
				throw new Error(`${conflictMessage}`);
			}
			throw new Error(`SetOfEquipment DELETE Error: ${response.status}`);
		}
		return response.json();
	},
};
