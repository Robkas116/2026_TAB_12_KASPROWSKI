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

// Fields that are optional (can be left empty) for each entity type
export const OPTIONAL_FIELDS: Record<EntityType, Set<string>> = {
	Makes: new Set(),
	Workers: new Set(),
	Vehicles: new Set(["description"]),
	Models: new Set(),
	Reservations: new Set(),
	Actions: new Set(),
	Equipments: new Set(),
	SetOfEquipments: new Set(),
	Versions: new Set(),
};
