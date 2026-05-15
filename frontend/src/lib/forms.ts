import type { EntityType } from "@/types";

export const INITIAL_STATES: Record<EntityType, any> = {
	Makes: { name: "" },
	Workers: { name: "", email: "" },
	Vehicles: { veh_model_id: "", version_id: "", description: "" },
	Models: { name: "", make_id: "" },
	Reservations: {},
	Actions: { name: "", type: "" },
	Equipments: { name: "" },
	SetOfEquipments: { name: "", version_id: "" },
	Versions: { destination: "" },
};
